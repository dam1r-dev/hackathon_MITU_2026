"""Meet now (meetings), the projector live feed and the organizer report. See docs/CONTRACT.md."""
import secrets
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .api_events import (
    Auth,
    _attendee_ids,
    _event_by_code,
    _event_by_id,
    _fresh_presence,
    _goal_counts,
    event_out,
    need_manager,
    need_member,
    auth,
    scarce_hints,
)
from .ctx import ctx
from .events_models import GoalCount
from .models import Profile

from . import telegram

router = APIRouter(prefix="/api")

MeetingStatus = Literal["proposed", "accepted", "declined", "done"]
OPEN = ("proposed", "accepted")


class MeetingIn(BaseModel):
    target_id: str
    location: str
    in_minutes: Literal[0, 5, 10, 15]


class RespondIn(BaseModel):
    accept: bool


class MeetingOut(BaseModel):
    id: str
    direction: Literal["incoming", "outgoing"]
    other: Profile
    location: str
    at: str
    status: MeetingStatus


# ------------------------------------------------------------------ helpers
def _meetings(event_id: str) -> dict[str, dict]:
    return ctx.state.data["meetings"].setdefault(event_id, {})


def _mutual_pairs(event_id: str) -> list[tuple[str, str]]:
    """Unordered pairs (sorted) where both sides pressed "want to meet", attendees only."""
    ids = _attendee_ids(event_id)
    meets = ctx.state.data["meets"].get(event_id, {})
    pairs = set()
    for a, targets in meets.items():
        for b in targets:
            if a in ids and b in ids and a in meets.get(b, []):
                pairs.add(tuple(sorted((a, b))))
    return sorted(pairs)


def _out(m: dict, me_id: str) -> MeetingOut | None:
    outgoing = m["from_id"] == me_id
    other = ctx.index.get(m["to_id"] if outgoing else m["from_id"])
    if not other:
        return None
    return MeetingOut(
        id=m["id"],
        direction="outgoing" if outgoing else "incoming",
        other=other,
        location=m["location"],
        at=m["at"],
        status=m["status"],
    )


def _meeting_for(event: dict, meeting_id: str) -> dict:
    m = _meetings(event["id"]).get(meeting_id)
    if not m:
        raise HTTPException(404, "meeting_not_found")
    return m


# ------------------------------------------------------------------ meetings (member)
@router.post("/events/by-code/{code}/meetings", response_model=MeetingOut, status_code=201)
def propose_meeting(code: str, req: MeetingIn, a: Auth = Depends(auth)) -> MeetingOut:
    me_id = need_member(a)
    e = _event_by_code(code)
    st = ctx.state
    ids = _attendee_ids(e["id"])
    if me_id not in ids or req.target_id not in ids or req.target_id == me_id:
        raise HTTPException(403, "not_in_event")
    if req.location not in event_out(e).locations:
        raise HTTPException(422, "unknown_location")
    with st.lock:
        per_event = _meetings(e["id"])
        pair = {me_id, req.target_id}
        if any({m["from_id"], m["to_id"]} == pair and m["status"] in OPEN for m in per_event.values()):
            raise HTTPException(409, "meeting_open")
        now = datetime.now(timezone.utc)
        m = {
            "id": "mt_" + secrets.token_hex(4),
            "from_id": me_id,
            "to_id": req.target_id,
            "location": req.location,
            "at": (now + timedelta(minutes=req.in_minutes)).isoformat(timespec="seconds"),
            "status": "proposed",
            "created": now.isoformat(timespec="seconds"),
        }
        per_event[m["id"]] = m
        st.save()
    telegram.notify_meeting(m, "invite")
    out = _out(m, me_id)
    if not out:
        raise HTTPException(404, "member_not_found")
    return out


@router.get("/events/by-code/{code}/meetings", response_model=list[MeetingOut])
def my_meetings(code: str, a: Auth = Depends(auth)) -> list[MeetingOut]:
    me_id = need_member(a)
    e = _event_by_code(code)
    mine = [m for m in _meetings(e["id"]).values() if me_id in (m["from_id"], m["to_id"])]
    mine.sort(key=lambda m: m["created"], reverse=True)
    return [o for o in (_out(m, me_id) for m in mine) if o]


@router.post("/events/by-code/{code}/meetings/{meeting_id}/respond", response_model=MeetingOut)
def respond_meeting(code: str, meeting_id: str, req: RespondIn, a: Auth = Depends(auth)) -> MeetingOut:
    me_id = need_member(a)
    e = _event_by_code(code)
    with ctx.state.lock:
        m = _meeting_for(e, meeting_id)
        if m["to_id"] != me_id:
            raise HTTPException(403, "forbidden")
        if m["status"] != "proposed":
            raise HTTPException(409, "bad_status")
        m["status"] = "accepted" if req.accept else "declined"
        ctx.state.save()
    if req.accept:
        telegram.notify_meeting(m, "accepted")
    return _out(m, me_id)  # type: ignore[return-value]


@router.post("/events/by-code/{code}/meetings/{meeting_id}/done", response_model=MeetingOut)
def finish_meeting(code: str, meeting_id: str, a: Auth = Depends(auth)) -> MeetingOut:
    me_id = need_member(a)
    e = _event_by_code(code)
    with ctx.state.lock:
        m = _meeting_for(e, meeting_id)
        if me_id not in (m["from_id"], m["to_id"]):
            raise HTTPException(403, "forbidden")
        if m["status"] != "accepted":
            raise HTTPException(409, "bad_status")
        m["status"] = "done"
        ctx.state.save()
    # They met: hide them from each other's suggestions from now on.
    ctx.index.record_feedback(m["from_id"], m["to_id"], "met")
    ctx.index.record_feedback(m["to_id"], m["from_id"], "met")
    return _out(m, me_id)  # type: ignore[return-value]


# ------------------------------------------------------------------ projector feed (public)
@router.get("/events/by-code/{code}/live")
def live(code: str) -> dict:
    """Edges for the projector: node ids and kinds only, no names or contacts."""
    e = _event_by_code(code)
    ids = _attendee_ids(e["id"])
    edges: dict[tuple[str, str], dict] = {}
    for a, b in _mutual_pairs(e["id"]):
        edges[(a, b)] = {"from": a, "to": b, "kind": "mutual", "at": None}
    accepted = done = 0
    for m in sorted(_meetings(e["id"]).values(), key=lambda m: m["created"]):
        if m["status"] not in ("accepted", "done") or m["from_id"] not in ids or m["to_id"] not in ids:
            continue
        accepted += m["status"] == "accepted"
        done += m["status"] == "done"
        edges[tuple(sorted((m["from_id"], m["to_id"])))] = {
            "from": m["from_id"],
            "to": m["to_id"],
            "kind": "meeting",
            "at": m["at"],
        }
    mutual_pairs = len(_mutual_pairs(e["id"]))
    return {
        "edges": list(edges.values()),
        "counters": {
            "attendees": len(ids & {p.id for p in ctx.index.profiles}),
            "mutual_pairs": mutual_pairs,
            "meetings_accepted": accepted,
            "meetings_done": done,
        },
    }


# ------------------------------------------------------------------ organizer report
@router.get("/events/{event_id}/report")
def report(event_id: str, a: Auth = Depends(auth)) -> dict:
    e = _event_by_id(event_id)
    need_manager(a, e)
    st = ctx.state
    total, counts = _goal_counts(e["id"])
    ids = _attendee_ids(e["id"])
    names = {p.id: p for p in ctx.index.profiles}

    pairs = _mutual_pairs(e["id"])
    degree: Counter[str] = Counter()
    for x, y in pairs:
        degree[x] += 1
        degree[y] += 1
    matched_share = round(len(degree) / total, 3) if total else 0.0

    meetings = [m for m in _meetings(e["id"]).values() if m["from_id"] in ids and m["to_id"] in ids]
    status = Counter(m["status"] for m in meetings)

    # joined over time in 10-minute buckets, only attendees with a recorded joined_at
    joined = []
    for mid, iso in st.data["joined_at"].get(e["id"], {}).items():
        if mid in ids:
            try:
                joined.append(datetime.fromisoformat(iso))
            except ValueError:
                pass
    timeline = []
    if joined:
        def bucket(dt: datetime) -> datetime:
            return dt.replace(minute=dt.minute - dt.minute % 10, second=0, microsecond=0)

        buckets = Counter(bucket(dt) for dt in joined)
        t, end = bucket(min(joined)), bucket(max(joined))
        while t <= end:
            timeline.append({"t": t.isoformat(timespec="minutes"), "joined": buckets.get(t, 0)})
            t += timedelta(minutes=10)

    loc_names = event_out(e).locations
    now_counts = Counter()
    for mid in st.data["presence"].get(e["id"], {}):
        rec = _fresh_presence(e["id"], mid)
        if rec and mid in ids:
            now_counts[rec["location"]] += 1
    meet_counts = Counter(m["location"] for m in meetings if m["status"] != "declined")
    locations = [{"name": n, "now": now_counts.get(n, 0), "meetings": meet_counts.get(n, 0)} for n in loc_names]

    insights: list[dict] = [{"code": h.code, "params": h.model_dump(exclude={"code"})} for h in scarce_hints(counts)]
    busiest = max(locations, key=lambda x: (x["meetings"], x["now"]), default=None)
    if busiest and (busiest["meetings"] or busiest["now"]):
        insights.append(
            {"code": "top_location", "params": {"name": busiest["name"], "meetings": busiest["meetings"], "now": busiest["now"]}}
        )
    if total >= 2 and matched_share < 0.3:
        insights.append({"code": "low_matching", "params": {"matched_share": matched_share}})

    top = [
        {"id": pid, "name": names[pid].name, "role": names[pid].role, "mutual": n}
        for pid, n in sorted(degree.items(), key=lambda kv: (-kv[1], kv[0]))[:5]
        if pid in names
    ]
    return {
        "attendees": total,
        "matched_share": matched_share,
        "mutual_pairs": len(pairs),
        "meetings": {"proposed": status["proposed"], "accepted": status["accepted"], "done": status["done"]},
        "timeline": timeline,
        "by_goal": [GoalCount(goal=g, count=c).model_dump() for g, c in counts.items()],
        "insights": insights,
        "locations": locations,
        "top_connectors": top,
    }
