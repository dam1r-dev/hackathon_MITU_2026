"""FastAPI app. Endpoints follow docs/CONTRACT.md."""
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

DATA_FILE = Path(os.getenv("PROFILES_FILE", Path(__file__).parents[2] / "data" / "profiles.json"))

index: Index


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load the embedding model and embed every profile once, before the first request."""
    global index
    index = Index(Embedder())
    if DATA_FILE.exists():
        index.add_many([Profile(**p) for p in json.loads(DATA_FILE.read_text(encoding="utf-8"))])
    yield


app = FastAPI(title="Meetup Matchmaker", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "profiles": len(index.profiles), "embedder": index.embedder.kind}


@app.post("/api/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> RecommendResponse:
    took_ms, matches = index.recommend(req.profile, req.lang, req.viewer_id)
    return RecommendResponse(took_ms=took_ms, matches=matches)


@app.get("/api/profiles", response_model=list[Profile])
def list_profiles() -> list[Profile]:
    return index.profiles


@app.post("/api/profiles")
def add_profile(p: ProfileIn) -> dict:
    pid = f"p_{len(index.profiles) + 1:03d}"
    index.add_many([Profile(id=pid, **p.model_dump())])
    return {"id": pid}


@app.get("/api/graph", response_model=GraphResponse)
def graph(viewer: str | None = None) -> GraphResponse:
    xy, labels = index.graph_layout()
    nodes = [
        GraphNode(
            id=p.id, name=p.name, goal=p.goal, cluster=int(labels[i]), x=float(xy[i][0]), y=float(xy[i][1])
        )
        for i, p in enumerate(index.profiles)
    ]
    edges: list[GraphEdge] = []
    me = index.get(viewer) if viewer else None
    if me:
        _, matches = index.recommend(ProfileIn(**me.model_dump(exclude={"id"})), viewer_id=me.id)
        edges = [GraphEdge(from_=me.id, to=m.profile.id, score=m.score) for m in matches]
    return GraphResponse(nodes=nodes, edges=edges)


@app.post("/api/feedback", response_model=RecommendResponse)
def feedback(fb: FeedbackRequest) -> RecommendResponse:
    me = index.get(fb.viewer_id)
    if not me:
        return RecommendResponse(took_ms=0, matches=[])
    index.record_feedback(fb.viewer_id, fb.target_id, fb.verdict)
    took_ms, matches = index.recommend(
        ProfileIn(**me.model_dump(exclude={"id"})), lang=me.lang, viewer_id=me.id
    )
    return RecommendResponse(took_ms=took_ms, matches=matches)
