"""FastAPI app. Endpoints follow docs/CONTRACT.md."""
import hashlib
import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .matching import recommend as run_recommend
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

app = FastAPI(title="Meetup Matchmaker")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

PROFILES: list[Profile] = []
# viewer_id -> {target_id: multiplier}. In memory only, fine for a demo.
PENALTIES: dict[str, dict[str, float]] = {}


def _load() -> None:
    PROFILES.clear()
    if DATA_FILE.exists():
        PROFILES.extend(Profile(**p) for p in json.loads(DATA_FILE.read_text(encoding="utf-8")))


_load()


def _xy(pid: str) -> tuple[float, float]:
    """Stable fake coordinates. Replace with a real 2D layout (UMAP/t-SNE on embeddings)."""
    h = hashlib.md5(pid.encode()).digest()
    return h[0] / 255, h[1] / 255


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "profiles": len(PROFILES)}


@app.post("/api/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> RecommendResponse:
    took_ms, matches = run_recommend(req.profile, PROFILES, req.lang)
    return RecommendResponse(took_ms=took_ms, matches=matches)


@app.get("/api/profiles", response_model=list[Profile])
def list_profiles() -> list[Profile]:
    return PROFILES


@app.post("/api/profiles")
def add_profile(p: ProfileIn) -> dict:
    pid = f"p_{len(PROFILES) + 1:03d}"
    PROFILES.append(Profile(id=pid, **p.model_dump()))
    return {"id": pid}


@app.get("/api/graph", response_model=GraphResponse)
def graph(viewer: str | None = None) -> GraphResponse:
    goals = sorted({p.goal for p in PROFILES})
    nodes = []
    for p in PROFILES:
        x, y = _xy(p.id)
        nodes.append(
            GraphNode(id=p.id, name=p.name, goal=p.goal, cluster=goals.index(p.goal), x=x, y=y)
        )
    edges: list[GraphEdge] = []
    me = next((p for p in PROFILES if p.id == viewer), None) if viewer else None
    if me:
        _, matches = run_recommend(ProfileIn(**me.model_dump(exclude={"id"})), PROFILES, viewer_id=me.id)
        edges = [GraphEdge(from_=me.id, to=m.profile.id, score=m.score) for m in matches]
    return GraphResponse(nodes=nodes, edges=edges)


@app.post("/api/feedback", response_model=RecommendResponse)
def feedback(fb: FeedbackRequest) -> RecommendResponse:
    pen = PENALTIES.setdefault(fb.viewer_id, {})
    pen[fb.target_id] = 0.0 if fb.verdict == "not_fit" else 0.5  # met: already knows them, show others
    me = next((p for p in PROFILES if p.id == fb.viewer_id), None)
    if not me:
        return RecommendResponse(took_ms=0, matches=[])
    took_ms, matches = run_recommend(
        ProfileIn(**me.model_dump(exclude={"id"})), PROFILES, penalties=pen, viewer_id=me.id
    )
    return RecommendResponse(took_ms=took_ms, matches=matches)
