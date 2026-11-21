"""End-to-end flow of the events layer, as in docs/CONTRACT.md:
admin signs in, creates an event, people join by QR code, see matches only inside that
event, press "want to meet", and the contact opens only when the interest is mutual.
"""
import os

SEEKER = {"name": "Seeker Test", "role": "Junior backend developer", "stack": ["Python", "FastAPI"],
          "experience_years": 1, "interests": ["fintech"], "about": "Looking for my first job.",
          "goal": "find_job", "lang": "en"}
HIRER = {"name": "Hirer Test", "role": "CTO", "stack": ["Python", "PostgreSQL"], "experience_years": 10,
         "interests": ["fintech"], "about": "Hiring a junior backend developer.", "goal": "hire", "lang": "en"}


def _admin(client) -> dict:
    code = os.getenv("ADMIN_CODE", "qazaq-admin")
    r = client.post("/api/admin/login", json={"code": code})
    assert r.status_code == 200, r.text
    return {"X-Admin-Token": r.json()["token"]}


def test_admin_login_rejects_wrong_code(client):
    assert client.post("/api/admin/login", json={"code": "wrong"}).status_code == 401


def test_seed_events_loaded(client):
    events = {e["code"]: e for e in client.get("/api/events", headers=_admin(client)).json()}
    assert {"DEMO", "DEVNIGHT", "STARTUP"} <= set(events)
    assert events["DEMO"]["attendee_count"] >= 100
    assert events["STARTUP"]["status"] == "closed"
    assert events["DEMO"]["join_path"] == "/#/join/DEMO"


def test_events_need_admin(client):
    assert client.get("/api/events").status_code == 401
    assert client.post("/api/events", json={"title": "No token"}).status_code == 401


def test_closed_event_rejects_join(client):
    r = client.post("/api/events/by-code/STARTUP/join", json={"profile": SEEKER, "lang": "en"})
    assert r.status_code == 403 and r.json()["detail"] == "event_closed"


def test_matches_stay_inside_the_event(client):
    admin = _admin(client)
    dev = next(e for e in client.get("/api/events", headers=admin).json() if e["code"] == "DEVNIGHT")
    inside = {a["profile"]["id"] for a in client.get(f"/api/events/{dev['id']}/attendees", headers=admin).json()}
    r = client.post("/api/events/by-code/DEVNIGHT/join", json={"profile": SEEKER, "lang": "en"})
    assert r.status_code == 200, r.text
    matches = r.json()["matches"]
    assert len(matches) == 5
    assert all(m["profile"]["id"] in inside for m in matches)
    assert {m["profile"]["goal"] for m in matches} == {"hire"}


def test_full_admin_and_qr_flow(client):
    admin = _admin(client)

    # 1. Admin creates an event and gets a QR code for it.
    r = client.post("/api/events", headers=admin, json={"title": "Flow test", "date": "2026-12-01", "venue": "Almaty"})
    assert r.status_code == 201, r.text
    event = r.json()
    code = event["code"]
    qr = client.get(f"/api/events/by-code/{code}/qr.svg")
    assert qr.status_code == 200 and qr.headers["content-type"].startswith("image/svg")

    # 2. Admin adds 10 people from the dataset, so the room is not empty.
    hirers = [p["id"] for p in client.get("/api/profiles").json() if p["goal"] == "hire" and p["id"].startswith("p_")]
    for pid in hirers[:10]:
        assert client.post(f"/api/events/{event['id']}/attendees", headers=admin, json={"member_id": pid}).status_code == 201

    # 3. Two people scan the QR code and join.
    s = client.post(f"/api/events/by-code/{code}/join", json={"profile": SEEKER, "contact": "@seeker", "lang": "en"}).json()
    h = client.post(f"/api/events/by-code/{code}/join", json={"profile": HIRER, "contact": "@hirer", "lang": "en"}).json()
    seeker_hdr, hirer_hdr = {"X-Member-Token": s["token"]}, {"X-Member-Token": h["token"]}
    assert len(s["matches"]) == 5 and {m["profile"]["goal"] for m in s["matches"]} == {"hire"}

    # 4. Refreshing matches works with the member token; the hirer now sees the seeker.
    hm = client.get(f"/api/events/by-code/{code}/matches?lang=en", headers=hirer_hdr).json()["matches"]
    assert s["member_id"] in {m["profile"]["id"] for m in hm}
    assert all("contact" not in m["profile"] for m in hm)

    # 5. Want to meet: contact is hidden until both sides press it.
    first = client.post(f"/api/events/by-code/{code}/meet", headers=seeker_hdr, json={"target_id": h["member_id"]}).json()
    assert first == {"mutual": False, "contact": None}
    second = client.post(f"/api/events/by-code/{code}/meet", headers=hirer_hdr, json={"target_id": s["member_id"]}).json()
    assert second["mutual"] is True and second["contact"] == "@seeker"

    # 6. Organizer stats show the goal balance.
    stats = client.get(f"/api/events/{event['id']}/stats", headers=admin).json()
    by_goal = {g["goal"]: g["count"] for g in stats["by_goal"]}
    assert stats["attendees"] == 12 and by_goal["hire"] == 11 and by_goal["find_job"] == 1

    # 7. A member cannot manage events; admin can make them an organizer of this event.
    assert client.get(f"/api/events/{event['id']}/attendees", headers=seeker_hdr).status_code == 403
    assert client.patch(f"/api/members/{h['member_id']}/role", headers=admin, json={"role": "organizer"}).status_code == 200
    assert client.patch(f"/api/events/{event['id']}", headers=admin, json={"organizer_ids": [h["member_id"]]}).status_code == 200
    own = client.get("/api/events", headers=hirer_hdr).json()
    assert [e["code"] for e in own] == [code]
