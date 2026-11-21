"""FastAPI app. Endpoints follow docs/CONTRACT.md."""
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .api_events import router as events_router
from . import telegram
from .api_meetings import router as meetings_router
from .ctx import ctx
from .events_models import DEFAULT_LOCATIONS
from .embeddings import Embedder
from .matching import Index
from .models import (
    FeedbackRequest,
    GraphEdge,
    GraphNode,
    GraphResponse,
    Profile,
    ProfileIn,
    RecommendRequest,
    RecommendResponse,
)
from .store import State

DATA_FILE = Path(os.getenv("PROFILES_FILE", Path(__file__).parents[2] / "data" / "profiles.json"))
EVENTS_SEED = Path(os.getenv("EVENTS_FILE", DATA_FILE.parent / "events.json"))


def _persist_feedback() -> None:
    fb = ctx.index.feedback
    ctx.state.data["feedback"] = {
        v: {"met": sorted(x["met"]), "not_fit": sorted(x["not_fit"])} for v, x in fb.items()
    }
    ctx.state.save()


def _seed_events(dataset_ids: list[str]) -> None:
    """First start only: events from data/events.json, or one DEMO event with every dataset profile."""
    st = ctx.state
    if st.data["events"]:
        return
    items: list[dict] = []
    if EVENTS_SEED.exists():
        raw = json.loads(EVENTS_SEED.read_text(encoding="utf-8"))
        items = raw["events"] if isinstance(raw, dict) else raw
    if not items:
        items = [{"title": "Demo meetup", "code": "DEMO", "attendees": "all"}]
    known = {p.id for p in ctx.index.profiles}
    for it in items:
        eid = it.get("id") or st.new_event_id()
        attendees = dataset_ids if it.get("attendees", "all") == "all" else it["attendees"]
        st.data["events"][eid] = {
            "id": eid,
            "code": (it.get("code") or st.new_code()).upper(),
            "title": it["title"],
            "date": it.get("date", ""),
            "venue": it.get("venue", ""),
            "status": it.get("status", "open"),
            "organizer_ids": [m for m in it.get("organizer_ids", []) if m in known],
            "created_at": st.now(),
            "locations": list(it.get("locations") or DEFAULT_LOCATIONS),
        }
        st.data["attendees"][eid] = [m for m in attendees if m in known]
    st.save()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load the embedding model, the saved state and every profile before the first request."""
    ctx.state = State()
    ctx.index = Index(Embedder())
    st, idx = ctx.state, ctx.index

    deleted = set(st.data["deleted"])
    dataset = []
    if DATA_FILE.exists():
        dataset = [Profile(**p) for p in json.loads(DATA_FILE.read_text(encoding="utf-8"))]
        dataset = [p for p in dataset if p.id not in deleted]
    idx.add_many(dataset)
    idx.add_many([Profile(**p) for p in st.data["profiles"].values()])
    idx.feedback = {
        v: {"met": set(x.get("met", [])), "not_fit": set(x.get("not_fit", []))}
        for v, x in st.data["feedback"].items()
    }
    idx.on_feedback = _persist_feedback
    for e in st.data["events"].values():
        if not e.get("locations"):
            e["locations"] = list(DEFAULT_LOCATIONS)
    _seed_events([p.id for p in dataset])
    telegram.start()
    yield


app = FastAPI(title="Meetup Matchmaker", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(events_router)
app.include_router(meetings_router)
app.include_router(telegram.router)


def _event_ids(code: str | None) -> set[str] | None:
    if not code:
        return None
    e = ctx.state.event_by_code(code)
    if not e:
        raise HTTPException(404, "event_not_found")
    return set(ctx.state.data["attendees"].get(e["id"], []))


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "profiles": len(ctx.index.profiles),
        "events": len(ctx.state.data["events"]),
        "embedder": ctx.index.embedder.kind,
    }


@app.post("/api/recommend", response_model=RecommendResponse, response_model_exclude_none=True)
def recommend(req: RecommendRequest) -> RecommendResponse:
    took_ms, matches = ctx.index.recommend(
        req.profile, req.lang, req.viewer_id, allowed_ids=_event_ids(req.event_code)
    )
    return RecommendResponse(took_ms=took_ms, matches=matches)


@app.get("/api/profiles", response_model=list[Profile])
def list_profiles() -> list[Profile]:
    """Dev helper. In the real flow members join through an event (POST /api/events/by-code/{code}/join)."""
    return ctx.index.profiles


@app.post("/api/profiles")
def add_profile(p: ProfileIn) -> dict:
    """Dev helper kept for the first prototype. Creates a member without an event."""
    st = ctx.state
    with st.lock:
        profile = Profile(id=st.new_member_id(), **p.model_dump())
        ctx.index.add_many([profile])
        st.data["profiles"][profile.id] = profile.model_dump()
        st.save()
    return {"id": profile.id}


@app.get("/api/graph", response_model=GraphResponse)
def graph(viewer: str | None = None, event: str | None = None) -> GraphResponse:
    """Room map. `event` is a join code and limits nodes to that event's attendees."""
    ids = _event_ids(event)
    xy, labels = ctx.index.graph_layout()
    nodes = [
        GraphNode(
            id=p.id, name=p.name, goal=p.goal, cluster=int(labels[i]), x=float(xy[i][0]), y=float(xy[i][1])
        )
        for i, p in enumerate(ctx.index.profiles)
        if ids is None or p.id in ids
    ]
    edges: list[GraphEdge] = []
    me = ctx.index.get(viewer) if viewer else None
    if me:
        _, matches = ctx.index.recommend(
            ProfileIn(**me.model_dump(exclude={"id"})), viewer_id=me.id, allowed_ids=ids
        )
        edges = [GraphEdge(from_=me.id, to=m.profile.id, score=m.score) for m in matches]
    return GraphResponse(nodes=nodes, edges=edges)


@app.post("/api/feedback", response_model=RecommendResponse, response_model_exclude_none=True)
def feedback(fb: FeedbackRequest) -> RecommendResponse:
    me = ctx.index.get(fb.viewer_id)
    if not me:
        return RecommendResponse(took_ms=0, matches=[])
    ctx.index.record_feedback(fb.viewer_id, fb.target_id, fb.verdict)
    took_ms, matches = ctx.index.recommend(
        ProfileIn(**me.model_dump(exclude={"id"})),
        lang=me.lang,
        viewer_id=me.id,
        allowed_ids=_event_ids(fb.event_code),
    )
    return RecommendResponse(took_ms=took_ms, matches=matches)
