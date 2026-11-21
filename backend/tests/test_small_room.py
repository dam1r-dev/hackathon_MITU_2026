"""A small live room where goals rarely match: nobody should get an empty list."""
import os


def _profile(name, goal):
    return {"name": name, "role": "Student developer", "stack": ["Python", "React"], "experience_years": 1,
            "interests": ["AI"], "about": "student", "goal": goal, "lang": "ru"}


def test_small_room_falls_back_to_similar_people(client):
    admin = {"X-Admin-Token": client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")}).json()["token"]}
    code = client.post("/api/events", headers=admin, json={"title": "Small live room"}).json()["code"]
    tokens = []
    for i, g in enumerate(["find_job", "find_job", "find_job", "hire"]):
        r = client.post(f"/api/events/by-code/{code}/join", json={"profile": _profile(f"Student {i}", g), "lang": "ru"})
        assert r.status_code == 200, r.text
        tokens.append(r.json()["token"])

    r = client.get(f"/api/events/by-code/{code}/matches?lang=ru", headers={"X-Member-Token": tokens[0]})
    ms = r.json()["matches"]
    assert len(ms) == 3  # everyone else in the room
    assert ms[0]["kind"] is None and ms[0]["profile"]["goal"] == "hire"  # the real two-sided match first
    assert all(m["kind"] == "similar" for m in ms[1:])
    assert all(m["score"] < ms[0]["score"] for m in ms[1:])
