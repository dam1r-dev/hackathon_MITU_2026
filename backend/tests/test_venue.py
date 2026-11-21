"""Open events list, venue locations, presence in matches, edit profile (docs/CONTRACT.md)."""
import os

DEFAULTS = ["Актовый зал", "Буфет", "Сцена", "Балкон", "Вход"]
SEEKER = {"name": "Venue Seeker", "role": "Junior backend developer", "stack": ["Python", "FastAPI"],
          "experience_years": 1, "interests": ["fintech"], "about": "Looking for a job.",
          "goal": "find_job", "lang": "en"}


def _admin(client) -> dict:
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    return {"X-Admin-Token": r.json()["token"]}


def _event(client, title="Venue test"):
    return client.post("/api/events", headers=_admin(client), json={"title": title}).json()


def _join(client, code, profile=SEEKER, contact=None):
    r = client.post(f"/api/events/by-code/{code}/join", json={"profile": profile, "contact": contact, "lang": "en"})
    assert r.status_code == 200, r.text
    d = r.json()
    return d, {"X-Member-Token": d["token"]}


def test_open_events_hide_closed(client):
    r = client.get("/api/events/open")
    assert r.status_code == 200
    items = r.json()
    codes = {e["code"] for e in items}
    assert "DEMO" in codes and "STARTUP" not in codes
    assert set(items[0]) == {"code", "title", "date", "start_time", "end_time", "venue", "attendee_count"}


def test_default_locations_and_patch_validation(client):
    admin = _admin(client)
    e = _event(client)
    assert e["locations"] == DEFAULTS
    url = f"/api/events/{e['id']}"
    ok = client.patch(url, headers=admin, json={"locations": ["Зал А", " Кафе "]})
    assert ok.status_code == 200 and ok.json()["locations"] == ["Зал А", "Кафе"]
    for bad in ([], ["a", "A"], [""], ["x" * 41], [str(i) for i in range(13)]):
        assert client.patch(url, headers=admin, json={"locations": bad}).status_code == 422, bad
    assert client.patch(url, json={"locations": ["x"]}).status_code == 401


def test_location_set_clear_counts_and_matches(client):
    admin = _admin(client)
    e = _event(client)
    code = e["code"]
    hirers = [p["id"] for p in client.get("/api/profiles").json() if p["goal"] == "hire" and p["id"].startswith("p_")]
    for pid in hirers[:6]:
        client.post(f"/api/events/{e['id']}/attendees", headers=admin, json={"member_id": pid})
    _, hdr = _join(client, code)

    assert client.post(f"/api/events/by-code/{code}/location", json={"location": "Буфет"}).status_code == 401
    bad = client.post(f"/api/events/by-code/{code}/location", headers=hdr, json={"location": "Moon"})
    assert bad.status_code == 422

    # a member of another event is not an attendee here
    other = _event(client, "Other")
    _, other_hdr = _join(client, other["code"], {**SEEKER, "name": "Other Person"})
    r = client.post(f"/api/events/by-code/{code}/location", headers=other_hdr, json={"location": "Буфет"})
    assert r.status_code == 403

    r = client.post(f"/api/events/by-code/{code}/location", headers=hdr, json={"location": "Буфет"})
    assert r.status_code == 200 and r.json()["location"] == "Буфет" and r.json()["at"]
    counts = {c["name"]: c["count"] for c in client.get(f"/api/events/by-code/{code}/locations").json()}
    assert list(counts) == DEFAULTS and counts["Буфет"] == 1 and counts["Вход"] == 0

    me = client.get("/api/me", headers=hdr).json()
    assert me["locations"][e["id"]]["location"] == "Буфет"

    # a hirer puts themselves in the buffet: the seeker's matches carry it
    hirer, hhdr = _join(client, code, {"name": "Hirer Venue", "role": "CTO", "stack": ["Python", "FastAPI"],
                                       "experience_years": 9, "interests": ["fintech"], "about": "Hiring.",
                                       "goal": "hire", "lang": "en"})
    client.post(f"/api/events/by-code/{code}/location", headers=hhdr, json={"location": "Сцена"})
    ms = client.get(f"/api/events/by-code/{code}/matches?lang=en", headers=hdr).json()["matches"]
    mine = next(m for m in ms if m["profile"]["id"] == hirer["member_id"])
    assert mine["location"] == "Сцена" and mine["location_at"]
    assert all(m["location"] is None for m in ms if m["profile"]["id"] != hirer["member_id"])

    r = client.post(f"/api/events/by-code/{code}/location", headers=hdr, json={"location": None})
    assert r.status_code == 200 and r.json()["location"] is None
    counts = {c["name"]: c["count"] for c in client.get(f"/api/events/by-code/{code}/locations").json()}
    assert counts["Буфет"] == 0


def test_public_stats(client):
    r = client.get("/api/events/by-code/DEMO/stats")
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"attendees", "by_goal"} and len(body["by_goal"]) == 6


def test_patch_me_changes_profile_and_matches(client):
    e = _event(client, "Edit test")
    code = e["code"]
    d, hdr = _join(client, code, SEEKER, "@old")
    new = {**SEEKER, "goal": "hire", "name": "Edited Name", "role": "CTO"}
    r = client.patch("/api/me", headers=hdr, json={"profile": new, "contact": "@new"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["profile"]["name"] == "Edited Name" and body["profile"]["goal"] == "hire"
    assert body["profile"]["id"] == d["member_id"] and body["contact"] == "@new"
    assert client.get("/api/me", headers=hdr).json()["profile"]["goal"] == "hire"
    # another attendee looking for a job now sees the edited member as a hirer
    _, h2 = _join(client, code, {**SEEKER, "name": "Second Seeker"})
    ms = client.get(f"/api/events/by-code/{code}/matches?lang=en", headers=h2).json()["matches"]
    assert d["member_id"] in {m["profile"]["id"] for m in ms}
    assert client.patch("/api/me", json={"profile": new}).status_code == 401


def test_patch_me_rejects_dataset_profiles(client):
    admin = _admin(client)
    e = _event(client, "Dataset edit")
    # a dataset member cannot hold a token, so edit must be refused for non-runtime ids
    from backend.app.ctx import ctx
    ctx.state.data["tokens"]["dataset-token"] = "p_001"
    r = client.patch("/api/me", headers={"X-Member-Token": "dataset-token"}, json={"profile": SEEKER})
    assert r.status_code == 403
    del ctx.state.data["tokens"]["dataset-token"]


def test_event_times(client):
    admin = _admin(client)
    r = client.post("/api/events", headers=admin, json={"title": "T", "date": "2026-11-21",
                                                         "start_time": "08:00", "end_time": "18:00"})
    assert r.status_code == 201
    e = r.json()
    assert (e["start_time"], e["end_time"]) == ("08:00", "18:00")
    assert _event(client)["start_time"] is None
    url = f"/api/events/{e['id']}"
    r = client.patch(url, headers=admin, json={"start_time": "09:30"})
    assert r.status_code == 200 and r.json()["start_time"] == "09:30" and r.json()["end_time"] == "18:00"
    assert client.patch(url, headers=admin, json={"end_time": "09:00"}).json()["detail"] == "bad_time"
    assert client.patch(url, headers=admin, json={"start_time": "25:00"}).status_code == 422
    r = client.patch(url, headers=admin, json={"end_time": None})
    assert r.json()["end_time"] is None
    bad = client.post("/api/events", headers=admin, json={"title": "B", "start_time": "10:00", "end_time": "10:00"})
    assert bad.status_code == 422 and bad.json()["detail"] == "bad_time"
    opened = {x["code"]: x for x in client.get("/api/events/open").json()}
    assert opened[e["code"]]["start_time"] == "09:30"
