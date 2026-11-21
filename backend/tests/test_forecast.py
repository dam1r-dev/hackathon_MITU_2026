"""Pre-event forecast (docs/CONTRACT.md "Pre-event forecast")."""
import os
import time

from backend.app.forecast import build_forecast, level, role_family
from backend.app.models import Profile


def _p(i, goal, stack, years=1, role="Junior backend developer", lang="ru"):
    return Profile(id=f"t{i}", name=f"T{i}", role=role, stack=stack, experience_years=years,
                   goal=goal, lang=lang)


def _codes(f):
    return {t["code"]: t["params"] for t in f["tips"]}


def test_role_family_and_level():
    assert role_family("Senior product designer") == "design"
    assert role_family("QA lead") == "qa"
    assert role_family("Senior SRE") == "devops"
    assert role_family("Junior backend developer") == "backend"
    assert role_family("CTO") == "management"
    assert role_family("Бариста") == "other"
    assert [level(y) for y in (0, 2, 5, 10)] == ["junior", "middle", "senior", "lead"]


def test_stack_gap_and_no_pair_tips():
    people = [_p(i, "find_job", ["Python", "FastAPI"]) for i in range(6)]
    people += [_p(10, "hire", ["Java"], 10, "CTO"), _p(11, "find_mentor", ["Go"])]
    f = build_forecast(people)
    tips = _codes(f)
    assert tips["stack_gap"] == {"stack": "Python", "seekers": 6, "hirers": 0}
    assert tips["stack_cluster"]["stack"] in {"FastAPI", "Python"}
    assert tips["mostly_junior"]["share"] >= 0.5
    assert tips["no_pair"] == {"count": 1, "goal": "find_mentor"}
    assert tips["few_registered"] == {"count": 8}
    assert f["pairs"] == {"with_pair": 7, "without_pair": 1, "without_by_goal": [{"goal": "find_mentor", "count": 1}]}
    assert f["stacks"][0] == {"name": "FastAPI", "count": 6} or f["stacks"][0] == {"name": "Python", "count": 6}
    assert len(f["by_goal"]) == 6


def test_single_cofounder_has_no_pair():
    f = build_forecast([_p(1, "find_cofounder", ["Go"], 5), _p(2, "exchange_experience", ["Go"], 5),
                        _p(3, "exchange_experience", ["Go"], 5)])
    tips = _codes(f)
    assert tips["cofounder_thin"] == {"count": 1}
    assert tips["no_pair"] == {"count": 1, "goal": "find_cofounder"}
    assert "mostly_junior" not in tips


def test_empty_room():
    f = build_forecast([])
    assert f["attendees"] == 0 and f["tips"] == [] and f["stacks"] == []


def test_forecast_endpoint_access_and_speed(client):
    admin = {"X-Admin-Token": client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")}).json()["token"]}
    demo = next(e for e in client.get("/api/events", headers=admin).json() if e["code"] == "DEMO")
    url = f"/api/events/{demo['id']}/forecast"
    assert client.get(url).status_code == 401
    t = time.perf_counter()
    r = client.get(url, headers=admin)
    assert time.perf_counter() - t < 1.0
    body = r.json()
    assert r.status_code == 200 and body["attendees"] >= 100
    assert sum(g["count"] for g in body["by_goal"]) == body["attendees"]
    assert body["pairs"]["with_pair"] + body["pairs"]["without_pair"] == body["attendees"]
    assert body["stacks"] and body["roles"] and body["levels"]
