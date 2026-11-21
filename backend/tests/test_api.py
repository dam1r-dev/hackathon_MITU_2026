"""The HTTP API answers by the contract and under 3 seconds."""
import json
import time
from pathlib import Path

LIMIT_MS = 3000
FIELDS = {"profile", "score", "shared_tags", "you_give", "they_give", "explanation", "icebreaker"}
VISITORS = [
    {"name": "Jury One", "role": "Data scientist", "stack": ["Python", "SQL"], "experience_years": 2,
     "interests": ["LLM agents"], "about": "Looking for a job in ML.", "goal": "find_job", "lang": "en"},
    {"name": "Jury Two", "role": "CTO", "stack": ["Go", "Kubernetes"], "experience_years": 12,
     "interests": ["fintech"], "about": "Нанимаем бэкенд-разработчиков.", "goal": "hire", "lang": "ru"},
    {"name": "Jury Three", "role": "Junior frontend developer", "stack": ["React"], "experience_years": 0,
     "interests": ["edtech"], "about": "Тәлімгер іздеймін.", "goal": "find_mentor", "lang": "kk"},
]


def test_health(client):
    body = client.get("/api/health").json()
    assert body["ok"] and body["profiles"] >= 100


def test_recommend_shape_and_speed(client):
    for v in VISITORS:
        start = time.perf_counter()
        r = client.post("/api/recommend", json={"profile": v, "lang": v["lang"]})
        wall_ms = (time.perf_counter() - start) * 1000
        assert r.status_code == 200, r.text
        body = r.json()
        assert wall_ms < LIMIT_MS and body["took_ms"] < LIMIT_MS, (v["name"], wall_ms)
        assert len(body["matches"]) == 5
        for m in body["matches"]:
            assert set(m) == FIELDS
            assert "contact" not in m["profile"]


def test_job_seeker_through_event_join(client):
    """The real flow: join the DEMO event by QR code and get hirers only."""
    r = client.post("/api/events/by-code/DEMO/join", json={"profile": VISITORS[0], "contact": "@jury1", "lang": "en"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["took_ms"] < LIMIT_MS
    assert len(body["matches"]) == 5
    assert {m["profile"]["goal"] for m in body["matches"]} == {"hire"}


def test_explanations_file_is_valid():
    """data/explanations.json is optional; when present it must follow the contract."""
    path = Path(__file__).resolve().parents[2] / "data" / "explanations.json"
    if not path.exists():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    for key, langs in data.items():
        assert "|" in key
        for lang, fields in langs.items():
            assert lang in {"kk", "ru", "en"}
            assert set(fields) <= {"explanation", "you_give", "they_give", "icebreaker"}
