"""Events, members, roles, QR join and organizer tools. See docs/CONTRACT.md.

Access, kept deliberately simple for a 24-hour build:
  - Admin: POST /api/admin/login with ADMIN_CODE returns a token, sent as `X-Admin-Token`.
    A member whose role is "admin" is an admin too.
  - Member: joining an event through its QR code returns a token, sent as `X-Member-Token`.
  - Organizer: a member with role "organizer" who is listed in an event's organizer_ids manages that event.
"""
import io
import os
import re
import secrets

import segno
from fastapi import APIRouter, Depends, Header, HTTPException, Response

from .ctx import ctx
from .events_models import (
    Attendee,
    AttendeeIn,
    Event,
    EventIn,
    EventPatch,
    GoalCount,
    Hint,
    JoinRequest,
    JoinResponse,
    LoginRequest,
    LoginResponse,
    MeetRequest,
    MeetResponse,
    MemberOut,
    MeOut,
    MutualOut,
    RoleRequest,
    Stats,
)
from .models import (
    RECIPROCAL,
    GraphNode,
    GraphResponse,
    Lang,
    Profile,
    ProfileIn,
    RecommendResponse,
)

router = APIRouter(prefix="/api")


# ------------------------------------------------------------------ access
class Auth:
    def __init__(self, admin: bool, member_id: str | None, role: str, token: str | None) -> None:
        self.admin = admin
        self.member_id = member_id
        self.role = role
        self.token = token
        self.authenticated = admin or member_id is not None


def auth(
    x_admin_token: str | None = Header(default=None),
    x_member_token: str | None = Header(default=None),
) -> Auth:
    st = ctx.state
    member_id = st.member_for_token(x_member_token)
    role = st.role(member_id) if member_id else "member"
    admin = bool(x_admin_token and x_admin_token in st.admin_tokens) or role == "admin"
    return Auth(admin, member_id, role, x_member_token)


def _deny(a: Auth) -> HTTPException:
    return HTTPException(403 if a.authenticated else 401, "forbidden" if a.authenticated else "sign_in_required")


def need_admin(a: Auth) -> None:
    if not a.admin:
        raise _deny(a)


def need_member(a: Auth) -> str:
    if a.member_id is None:
        raise HTTPException(401, "member_token_required")
    return a.member_id


def need_manager(a: Auth, event: dict) -> None:
    if a.admin:
        return
    if a.member_id and a.role == "organizer" and a.member_id in event["organizer_ids"]:
        return
    raise _deny(a)


# ------------------------------------------------------------------ helpers
def _public_url() -> str:
    return os.getenv("PUBLIC_URL", "http://localhost:3000").rstrip("/")


def _event_by_code(code: str) -> dict:
    e = ctx.state.event_by_code(code)
    if not e:
        raise HTTPException(404, "event_not_found")
    return e


def _event_by_id(event_id: str) -> dict:
    e = ctx.state.data["events"].get(event_id)
    if not e:
        raise HTTPException(404, "event_not_found")
    return e


def _attendee_ids(event_id: str) -> set[str]:
    return set(ctx.state.data["attendees"].get(event_id, []))


def event_out(e: dict) -> Event:
    known = {p.id for p in ctx.index.profiles}
    count = sum(1 for m in ctx.state.data["attendees"].get(e["id"], []) if m in known)
    return Event(
        **e,
        attendee_count=count,
        join_path=f"/#/join/{e['code']}",
        join_url=f"{_public_url()}/#/join/{e['code']}",
    )


def _as_in(p: Profile) -> ProfileIn:
    return ProfileIn(**p.model_dump(exclude={"id"}))


def _create_member(pin: ProfileIn, contact: str | None, with_token: bool) -> tuple[Profile, str | None]:
    st, idx = ctx.state, ctx.index
    profile = Profile(id=st.new_member_id(), **pin.model_dump())
    idx.add_many([profile])
    st.data["profiles"][profile.id] = profile.model_dump()
    token = None
    if with_token:
        token = secrets.token_urlsafe(16)
        st.data["tokens"][token] = profile.id
    if contact:
        st.data["contacts"][profile.id] = contact.strip()
    return profile, token


def _attendee(p: Profile) -> Attendee:
    return Attendee(profile=p, system_role=ctx.state.role(p.id))


# ------------------------------------------------------------------ admin sign-in
@router.post("/admin/login", response_model=LoginResponse)
def admin_login(req: LoginRequest) -> LoginResponse:
    expected = os.getenv("ADMIN_CODE", "qazaq-admin")
    if not secrets.compare_digest(req.code.encode(), expected.encode()):
        raise HTTPException(401, "wrong_code")
    token = secrets.token_urlsafe(24)
    ctx.state.admin_tokens.add(token)
    return LoginResponse(token=token)


# ------------------------------------------------------------------ events (admin / organizer)
@router.get("/events", response_model=list[Event])
def list_events(a: Auth = Depends(auth)) -> list[Event]:
    events = list(ctx.state.data["events"].values())
    if not a.admin:
        if not (a.member_id and a.role == "organizer"):
            raise _deny(a)
        events = [e for e in events if a.member_id in e["organizer_ids"]]
    events.sort(key=lambda e: e["created_at"], reverse=True)
    return [event_out(e) for e in events]


@router.post("/events", response_model=Event, status_code=201)
def create_event(req: EventIn, a: Auth = Depends(auth)) -> Event:
    need_admin(a)
    st = ctx.state
    with st.lock:
        code = (req.code or st.new_code()).upper()
        if not re.fullmatch(r"[A-Z0-9]{4,12}", code):
            raise HTTPException(422, "code_must_be_letters_and_digits")
        if st.event_by_code(code):
            raise HTTPException(409, "code_taken")
        missing = [m for m in req.organizer_ids if not ctx.index.get(m)]
        if missing:
            raise HTTPException(422, f"unknown_organizer: {missing[0]}")
        e = {
            "id": st.new_event_id(),
            "code": code,
            "title": req.title.strip(),
            "date": req.date,
            "venue": req.venue,
            "status": "open",
            "organizer_ids": req.organizer_ids,
            "created_at": st.now(),
        }
        st.data["events"][e["id"]] = e
        st.data["attendees"][e["id"]] = []
        st.save()
    return event_out(e)


# Public routes by join code come before the {event_id} routes.
@router.get("/events/by-code/{code}", response_model=Event)
def event_public(code: str) -> Event:
    return event_out(_event_by_code(code))


@router.get("/events/by-code/{code}/qr.svg")
def event_qr(code: str) -> Response:
    e = _event_by_code(code)
    buf = io.BytesIO()
    segno.make(event_out(e).join_url, error="m").save(buf, kind="svg", scale=10, border=2, dark="#000000")
    return Response(content=buf.getvalue(), media_type="image/svg+xml")


@router.get("/events/by-code/{code}/graph", response_model=GraphResponse)
def event_graph(code: str) -> GraphResponse:
    """Room map for the projector screen. Names are shortened to initials: this route is public."""
    e = _event_by_code(code)
    ids = _attendee_ids(e["id"])
    xy, labels = ctx.index.graph_layout()
    nodes = [
        GraphNode(
            id=p.id,
            name="".join(w[0] for w in p.name.split()[:2]).upper(),
            goal=p.goal,
            cluster=int(labels[i]),
            x=float(xy[i][0]),
            y=float(xy[i][1]),
        )
        for i, p in enumerate(ctx.index.profiles)
        if p.id in ids
    ]
    return GraphResponse(nodes=nodes)


@router.post("/events/by-code/{code}/join", response_model=JoinResponse)
def join_event(code: str, req: JoinRequest, a: Auth = Depends(auth)) -> JoinResponse:
    st, idx = ctx.state, ctx.index
    e = _event_by_code(code)
    if e["status"] != "open":
        raise HTTPException(403, "event_closed")
    with st.lock:
        if a.member_id and req.profile is None:
            member = idx.get(a.member_id)
            if not member:
                raise HTTPException(404, "member_not_found")
            token = a.token or ""
        elif req.profile is not None:
            member, token = _create_member(req.profile, req.contact, with_token=True)
        else:
            raise HTTPException(422, "profile_required")
        lst = st.data["attendees"].setdefault(e["id"], [])
        if member.id not in lst:
            lst.append(member.id)
        st.save()
        allowed = set(lst)
    took_ms, matches = idx.recommend(_as_in(member), req.lang, member.id, allowed_ids=allowed)
    return JoinResponse(member_id=member.id, token=token or "", event=event_out(e), took_ms=took_ms, matches=matches)


@router.get("/events/by-code/{code}/matches", response_model=RecommendResponse)
def event_matches(code: str, lang: Lang = "ru", a: Auth = Depends(auth)) -> RecommendResponse:
    me_id = need_member(a)
    e = _event_by_code(code)
    allowed = _attendee_ids(e["id"])
    if me_id not in allowed:
        raise HTTPException(403, "not_in_event")
    took_ms, matches = ctx.index.recommend(_as_in(ctx.index.get(me_id)), lang, me_id, allowed_ids=allowed)
    return RecommendResponse(took_ms=took_ms, matches=matches)


@router.post("/events/by-code/{code}/meet", response_model=MeetResponse)
def want_to_meet(code: str, req: MeetRequest, a: Auth = Depends(auth)) -> MeetResponse:
    me_id = need_member(a)
    st = ctx.state
    e = _event_by_code(code)
    allowed = _attendee_ids(e["id"])
    if me_id not in allowed or req.target_id not in allowed or req.target_id == me_id:
        raise HTTPException(403, "not_in_event")
    with st.lock:
        meets = st.data["meets"].setdefault(e["id"], {})
        mine = meets.setdefault(me_id, [])
        if req.target_id not in mine:
            mine.append(req.target_id)
        mutual = me_id in meets.get(req.target_id, [])
        st.save()
    return MeetResponse(mutual=mutual, contact=st.data["contacts"].get(req.target_id) if mutual else None)


@router.get("/events/by-code/{code}/mutual", response_model=list[MutualOut])
def mutual_meets(code: str, a: Auth = Depends(auth)) -> list[MutualOut]:
    me_id = need_member(a)
    st = ctx.state
    e = _event_by_code(code)
    meets = st.data["meets"].get(e["id"], {})
    out = []
    for target in meets.get(me_id, []):
        p = ctx.index.get(target)
        if p and me_id in meets.get(target, []):
            out.append(MutualOut(profile=p, contact=st.data["contacts"].get(target)))
    return out


@router.get("/me", response_model=MeOut)
def me(a: Auth = Depends(auth)) -> MeOut:
    me_id = need_member(a)
    p = ctx.index.get(me_id)
    if not p:
        raise HTTPException(404, "member_not_found")
    events = [event_out(ctx.state.data["events"][eid]) for eid in ctx.state.events_of(me_id) if eid in ctx.state.data["events"]]
    return MeOut(profile=p, system_role=ctx.state.role(me_id), events=events)


# ------------------------------------------------------------------ event management by id
@router.patch("/events/{event_id}", response_model=Event)
def patch_event(event_id: str, req: EventPatch, a: Auth = Depends(auth)) -> Event:
    e = _event_by_id(event_id)
    need_manager(a, e)
    changes = req.model_dump(exclude_unset=True)
    if "organizer_ids" in changes:
        need_admin(a)
    with ctx.state.lock:
        for key, value in changes.items():
            if value is not None:
                e[key] = value.strip() if key == "title" else value
        ctx.state.save()
    return event_out(e)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: str, a: Auth = Depends(auth)) -> Response:
    need_admin(a)
    _event_by_id(event_id)
    st = ctx.state
    with st.lock:
        st.data["events"].pop(event_id, None)
        st.data["attendees"].pop(event_id, None)
        st.data["meets"].pop(event_id, None)
        st.save()
    return Response(status_code=204)


@router.get("/events/{event_id}/attendees", response_model=list[Attendee])
def list_attendees(event_id: str, a: Auth = Depends(auth)) -> list[Attendee]:
    e = _event_by_id(event_id)
    need_manager(a, e)
    ids = _attendee_ids(e["id"])
    return [_attendee(p) for p in ctx.index.profiles if p.id in ids]


@router.post("/events/{event_id}/attendees", response_model=Attendee, status_code=201)
def add_attendee(event_id: str, req: AttendeeIn, a: Auth = Depends(auth)) -> Attendee:
    e = _event_by_id(event_id)
    need_manager(a, e)
    st = ctx.state
    with st.lock:
        if req.member_id:
            member = ctx.index.get(req.member_id)
            if not member:
                raise HTTPException(404, "member_not_found")
        elif req.profile:
            member, _ = _create_member(req.profile, None, with_token=False)
        else:
            raise HTTPException(422, "member_id_or_profile_required")
        lst = st.data["attendees"].setdefault(e["id"], [])
        if member.id not in lst:
            lst.append(member.id)
        st.save()
    return _attendee(member)


@router.delete("/events/{event_id}/attendees/{member_id}", status_code=204)
def remove_attendee(event_id: str, member_id: str, a: Auth = Depends(auth)) -> Response:
    e = _event_by_id(event_id)
    need_manager(a, e)
    st = ctx.state
    with st.lock:
        lst = st.data["attendees"].get(e["id"], [])
        if member_id in lst:
            lst.remove(member_id)
        for viewer_targets in st.data["meets"].get(e["id"], {}).values():
            if member_id in viewer_targets:
                viewer_targets.remove(member_id)
        st.data["meets"].get(e["id"], {}).pop(member_id, None)
        st.save()
    return Response(status_code=204)


@router.get("/events/{event_id}/stats", response_model=Stats)
def event_stats(event_id: str, a: Auth = Depends(auth)) -> Stats:
    e = _event_by_id(event_id)
    need_manager(a, e)
    ids = _attendee_ids(e["id"])
    counts = {g: 0 for g in RECIPROCAL}
    total = 0
    for p in ctx.index.profiles:
        if p.id in ids:
            counts[p.goal] += 1
            total += 1
    hints: list[Hint] = []
    for first, second in (("find_job", "hire"), ("find_mentor", "be_mentor")):
        for scarce, plenty in ((first, second), (second, first)):
            if counts[plenty] >= 4 and counts[scarce] <= counts[plenty] * 0.25:
                hints.append(
                    Hint(
                        code="scarce_supply",
                        scarce=scarce,
                        plenty=plenty,
                        scarce_count=counts[scarce],
                        plenty_count=counts[plenty],
                    )
                )
    return Stats(attendees=total, by_goal=[GoalCount(goal=g, count=c) for g, c in counts.items()], hints=hints)


# ------------------------------------------------------------------ members (admin)
@router.get("/members", response_model=list[MemberOut])
def list_members(a: Auth = Depends(auth)) -> list[MemberOut]:
    need_admin(a)
    return [
        MemberOut(profile=p, system_role=ctx.state.role(p.id), events=ctx.state.events_of(p.id))
        for p in ctx.index.profiles
    ]


@router.patch("/members/{member_id}/role", response_model=Attendee)
def set_role(member_id: str, req: RoleRequest, a: Auth = Depends(auth)) -> Attendee:
    need_admin(a)
    p = ctx.index.get(member_id)
    if not p:
        raise HTTPException(404, "member_not_found")
    st = ctx.state
    with st.lock:
        if req.role == "member":
            st.data["roles"].pop(member_id, None)
        else:
            st.data["roles"][member_id] = req.role
        st.save()
    return _attendee(p)


@router.delete("/members/{member_id}", status_code=204)
def delete_member(member_id: str, a: Auth = Depends(auth)) -> Response:
    need_admin(a)
    st = ctx.state
    with st.lock:
        if not ctx.index.remove(member_id):
            raise HTTPException(404, "member_not_found")
        if member_id in st.data["profiles"]:
            del st.data["profiles"][member_id]
        else:
            st.data["deleted"].append(member_id)
        st.data["roles"].pop(member_id, None)
        st.data["contacts"].pop(member_id, None)
        st.data["feedback"].pop(member_id, None)
        st.data["tokens"] = {t: m for t, m in st.data["tokens"].items() if m != member_id}
        for lst in st.data["attendees"].values():
            if member_id in lst:
                lst.remove(member_id)
        for event in st.data["events"].values():
            if member_id in event["organizer_ids"]:
                event["organizer_ids"].remove(member_id)
        for per_event in st.data["meets"].values():
            per_event.pop(member_id, None)
            for targets in per_event.values():
                if member_id in targets:
                    targets.remove(member_id)
        st.save()
    return Response(status_code=204)
