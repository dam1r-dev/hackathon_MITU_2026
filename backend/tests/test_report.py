"""Organizer report (docs/CONTRACT.md)."""
import os

SEEKER = {"name": "Report Seeker", "role": "Junior backend developer", "stack": ["Python"],
          "experience_years": 1, "interests": ["fintech"], "about": "Looking for a job.",
          "goal": "find_job", "lang": "en"}


def _admin(client) -> dict:
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    return {"X-Admin-Token": r.json()["token"]}


def _join(client, code, name, goal):
    r = client.post(f"/api/events/by-code/{code}/join",
                    json={"profile": {**SEEKER, "name": name, "goal": goal}, "lang": "en"})
    d = r.json()
    return d["member_id"], {"X-Member-Token": d["token"]}


def test_report_numbers_and_access(client):
    admin = _admin(client)
    e = client.post("/api/events", headers=admin, json={"title": "Report test"}).json()
    code, url = e["code"], f"/api/events/{e['id']}/report"

    empty = client.get(url, headers=admin).json()
    assert empty["attendees"] == 0 and empty["matched_share"] == 0 and empty["timeline"] == []
    assert empty["insights"] == []

    a, ah = _join(client, code, "Rep A", "find_job")
    b, bh = _join(client, code, "Rep B", "hire")
    c, ch = _join(client, code, "Rep C", "find_job")
    d, dh = _join(client, code, "Rep D", "find_job")
    meet = f"/api/events/by-code/{code}/meet"
    client.post(meet, headers=ah, json={"target_id": b})
    client.post(meet, headers=bh, json={"target_id": a})
    client.post(meet, headers=ch, json={"target_id": b})
    client.post(meet, headers=bh, json={"target_id": c})
    client.post(meet, headers=dh, json={"target_id": a})  # one-sided
    client.post(f"/api/events/by-code/{code}/location", headers=ah, json={"location": "Буфет"})
    m = client.post(f"/api/events/by-code/{code}/meetings", headers=ah,
                    json={"target_id": b, "location": "Буфет", "in_minutes": 0}).json()
    client.post(f"/api/events/by-code/{code}/meetings/{m['id']}/respond", headers=bh, json={"accept": True})
    client.post(f"/api/events/by-code/{code}/meetings/{m['id']}/done", headers=ah)
    client.post(f"/api/events/by-code/{code}/meetings", headers=ch,
                json={"target_id": b, "location": "Сцена", "in_minutes": 5})

    r = client.get(url, headers=admin)
    assert r.status_code == 200
    rep = r.json()
    assert set(rep) == {"attendees", "matched_share", "mutual_pairs", "meetings", "timeline", "by_goal",
                        "insights", "locations", "top_connectors", "telegram"}
    assert rep["attendees"] == 4 and rep["mutual_pairs"] == 2
    assert rep["matched_share"] == 0.75  # A, B, C of four
    assert rep["meetings"] == {"proposed": 1, "accepted": 0, "done": 1}
    assert sum(t["joined"] for t in rep["timeline"]) == 4
    assert {g["goal"]: g["count"] for g in rep["by_goal"]}["find_job"] == 3
    loc = {x["name"]: x for x in rep["locations"]}
    assert loc["Буфет"] == {"name": "Буфет", "now": 1, "meetings": 1} and loc["Сцена"]["meetings"] == 1
    assert rep["top_connectors"][0]["id"] == b and rep["top_connectors"][0]["mutual"] == 2
    codes = {i["code"] for i in rep["insights"]}
    assert "top_location" in codes and "low_matching" not in codes
    assert "scarce_supply" not in codes  # needs 4+ on the plenty side and at most a quarter of that opposite


def test_report_insights(client):
    admin = _admin(client)
    e = client.post("/api/events", headers=admin, json={"title": "Report insights"}).json()
    for i in range(5):
        _join(client, e["code"], f"Seeker {i}", "find_job")
    rep = client.get(f"/api/events/{e['id']}/report", headers=admin).json()
    by = {i["code"]: i for i in rep["insights"]}
    assert by["low_matching"]["params"]["matched_share"] == 0
    assert by["scarce_supply"]["params"] == {"scarce": "hire", "plenty": "find_job",
                                              "scarce_count": 0, "plenty_count": 5}


def test_report_requires_manager(client):
    admin = _admin(client)
    e = client.post("/api/events", headers=admin, json={"title": "Report auth"}).json()
    url = f"/api/events/{e['id']}/report"
    assert client.get(url).status_code == 401
    _, hdr = _join(client, e["code"], "Plain Member", "find_job")
    assert client.get(url, headers=hdr).status_code == 403
    assert client.get("/api/events/e_nope/report", headers=admin).status_code == 404
