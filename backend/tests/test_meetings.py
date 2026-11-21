"""Meet now, the projector live feed (docs/CONTRACT.md)."""
import os

SEEKER = {"name": "Meet Seeker", "role": "Junior backend developer", "stack": ["Python", "FastAPI"],
          "experience_years": 1, "interests": ["fintech"], "about": "Looking for a job.",
          "goal": "find_job", "lang": "en"}
HIRER = {**SEEKER, "name": "Meet Hirer", "role": "CTO", "goal": "hire", "experience_years": 9}


def _admin(client) -> dict:
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    return {"X-Admin-Token": r.json()["token"]}


def _event(client, title="Meet test"):
    return client.post("/api/events", headers=_admin(client), json={"title": title}).json()


def _join(client, code, profile):
    r = client.post(f"/api/events/by-code/{code}/join", json={"profile": profile, "lang": "en"})
    assert r.status_code == 200, r.text
    d = r.json()
    return d["member_id"], {"X-Member-Token": d["token"]}


def _setup(client):
    e = _event(client)
    a_id, a_h = _join(client, e["code"], SEEKER)
    b_id, b_h = _join(client, e["code"], HIRER)
    return e["code"], a_id, a_h, b_id, b_h


def _propose(client, code, hdr, target, location="Буфет", in_minutes=5):
    return client.post(f"/api/events/by-code/{code}/meetings", headers=hdr,
                       json={"target_id": target, "location": location, "in_minutes": in_minutes})


def test_propose_list_and_validation(client):
    code, a_id, a_h, b_id, b_h = _setup(client)
    base = f"/api/events/by-code/{code}/meetings"
    assert client.post(base, json={"target_id": b_id, "location": "Буфет", "in_minutes": 5}).status_code == 401
    assert _propose(client, code, a_h, b_id, "Moon").status_code == 422
    assert _propose(client, code, a_h, b_id, in_minutes=7).status_code == 422
    assert _propose(client, code, a_h, a_id).status_code == 403
    outsider_id, out_h = _join(client, _event(client, "Elsewhere")["code"], {**SEEKER, "name": "Outsider"})
    assert _propose(client, code, a_h, outsider_id).status_code == 403
    assert _propose(client, code, out_h, b_id).status_code == 403

    r = _propose(client, code, a_h, b_id, "Буфет", 10)
    assert r.status_code == 201, r.text
    m = r.json()
    assert m["direction"] == "outgoing" and m["status"] == "proposed" and m["other"]["id"] == b_id
    assert m["location"] == "Буфет" and m["at"]
    # one open meeting per pair, in either direction
    assert _propose(client, code, a_h, b_id).status_code == 409
    assert _propose(client, code, b_h, a_id).status_code == 409

    mine = client.get(base, headers=a_h).json()
    theirs = client.get(base, headers=b_h).json()
    assert [x["direction"] for x in mine] == ["outgoing"] and [x["direction"] for x in theirs] == ["incoming"]
    assert theirs[0]["other"]["id"] == a_id
    assert client.get(base).status_code == 401


def test_respond_and_done_permissions(client):
    code, a_id, a_h, b_id, b_h = _setup(client)
    base = f"/api/events/by-code/{code}/meetings"
    mid = _propose(client, code, a_h, b_id, in_minutes=0).json()["id"]
    _, third_h = _join(client, code, {**SEEKER, "name": "Third Person"})

    assert client.post(f"{base}/{mid}/respond", headers=a_h, json={"accept": True}).status_code == 403  # sender
    assert client.post(f"{base}/{mid}/respond", headers=third_h, json={"accept": True}).status_code == 403
    assert client.post(f"{base}/nope/respond", headers=b_h, json={"accept": True}).status_code == 404
    assert client.post(f"{base}/{mid}/done", headers=a_h).status_code == 409  # not accepted yet

    r = client.post(f"{base}/{mid}/respond", headers=b_h, json={"accept": True})
    assert r.status_code == 200 and r.json()["status"] == "accepted" and r.json()["direction"] == "incoming"
    assert client.post(f"{base}/{mid}/respond", headers=b_h, json={"accept": False}).status_code == 409
    assert client.post(f"{base}/{mid}/done", headers=third_h).status_code == 403
    assert _propose(client, code, a_h, b_id).status_code == 409  # still open while accepted

    r = client.post(f"{base}/{mid}/done", headers=a_h)
    assert r.status_code == 200 and r.json()["status"] == "done"
    assert client.post(f"{base}/{mid}/done", headers=b_h).status_code == 409
    # a finished meeting is not open: a new one may be proposed
    assert _propose(client, code, a_h, b_id).status_code == 201


def test_decline_frees_the_pair(client):
    code, a_id, a_h, b_id, b_h = _setup(client)
    mid = _propose(client, code, a_h, b_id).json()["id"]
    r = client.post(f"/api/events/by-code/{code}/meetings/{mid}/respond", headers=b_h, json={"accept": False})
    assert r.json()["status"] == "declined"
    assert _propose(client, code, b_h, a_id).status_code == 201


def test_done_records_met_feedback(client):
    from backend.app.ctx import ctx
    code, a_id, a_h, b_id, b_h = _setup(client)
    mid = _propose(client, code, a_h, b_id).json()["id"]
    base = f"/api/events/by-code/{code}/meetings/{mid}"
    client.post(f"{base}/respond", headers=b_h, json={"accept": True})
    assert b_id not in ctx.index.feedback.get(a_id, {}).get("met", set())
    client.post(f"{base}/done", headers=b_h)
    assert b_id in ctx.index.feedback[a_id]["met"] and a_id in ctx.index.feedback[b_id]["met"]
    assert b_id in ctx.state.data["feedback"][a_id]["met"]


def test_live_edges_and_counters(client):
    code, a_id, a_h, b_id, b_h = _setup(client)
    c_id, c_h = _join(client, code, {**HIRER, "name": "Other Hirer"})
    live = f"/api/events/by-code/{code}/live"
    start = client.get(live).json()
    assert start["edges"] == [] and start["counters"] == {
        "attendees": 3, "mutual_pairs": 0, "meetings_accepted": 0, "meetings_done": 0}

    meet = f"/api/events/by-code/{code}/meet"
    client.post(meet, headers=a_h, json={"target_id": b_id})
    assert client.get(live).json()["edges"] == []  # one-sided is not an edge
    client.post(meet, headers=b_h, json={"target_id": a_id})
    client.post(meet, headers=a_h, json={"target_id": c_id})
    client.post(meet, headers=c_h, json={"target_id": a_id})
    body = client.get(live).json()
    assert {frozenset((e["from"], e["to"])): e["kind"] for e in body["edges"]} == {
        frozenset((a_id, b_id)): "mutual", frozenset((a_id, c_id)): "mutual"}
    assert body["counters"]["mutual_pairs"] == 2

    mid = _propose(client, code, a_h, b_id).json()["id"]
    assert {e["kind"] for e in client.get(live).json()["edges"]} == {"mutual"}  # proposed is not enough
    client.post(f"/api/events/by-code/{code}/meetings/{mid}/respond", headers=b_h, json={"accept": True})
    body = client.get(live).json()
    kinds = {frozenset((e["from"], e["to"])): e["kind"] for e in body["edges"]}
    assert kinds[frozenset((a_id, b_id))] == "meeting" and kinds[frozenset((a_id, c_id))] == "mutual"
    assert len(body["edges"]) == 2  # meeting wins over mutual, one edge per pair
    assert body["counters"]["meetings_accepted"] == 1 and body["counters"]["mutual_pairs"] == 2
    client.post(f"/api/events/by-code/{code}/meetings/{mid}/done", headers=a_h)
    c = client.get(live).json()["counters"]
    assert c["meetings_accepted"] == 0 and c["meetings_done"] == 1

    text = client.get(live).text
    assert "Meet Seeker" not in text and "Hirer" not in text and "contact" not in text
    graph_ids = {n["id"] for n in client.get(f"/api/events/by-code/{code}/graph").json()["nodes"]}
    assert {a_id, b_id, c_id} <= graph_ids
