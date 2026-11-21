"""Telegram hooks: mutual match and meeting invites reach linked members (sending is stubbed)."""
import os

P = {"role": "Dev", "stack": ["Python"], "experience_years": 2, "interests": ["AI"], "about": "x", "lang": "en"}


def test_link_hidden_when_bot_off(client):
    code = client.post("/api/events", headers=_admin(client), json={"title": "TG off"}).json()["code"]
    tok = _join(client, code, "Off", "find_job")[1]
    assert client.get("/api/tg/link", headers=tok).json() == {"enabled": False, "linked": False, "username": None, "url": None}


def _admin(client):
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    return {"X-Admin-Token": r.json()["token"]}


def _join(client, code, name, goal):
    d = client.post(f"/api/events/by-code/{code}/join",
                    json={"profile": {**P, "name": name, "goal": goal}, "contact": f"@{name}", "lang": "en"}).json()
    return d["member_id"], {"X-Member-Token": d["token"]}


def test_mutual_and_meeting_notifications(client, monkeypatch):
    from backend.app import telegram
    from backend.app.ctx import ctx

    sent = []
    monkeypatch.setattr(telegram, "TOKEN", "test")
    monkeypatch.setattr(telegram, "_send", lambda chat, text: sent.append((chat, text)))

    code = client.post("/api/events", headers=_admin(client), json={"title": "TG on"}).json()["code"]
    a_id, a = _join(client, code, "Aida", "find_job")
    b_id, b = _join(client, code, "Bek", "hire")
    chats = ctx.state.data.setdefault("tg_chats", {})
    chats[a_id], chats[b_id] = 1, 2

    client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": b_id})
    assert sent == []  # not mutual yet
    client.post(f"/api/events/by-code/{code}/meet", headers=b, json={"target_id": a_id})
    assert {c for c, _ in sent} == {1, 2}
    assert any(c == 1 and "Bek" in t and "@Bek" in t for c, t in sent)

    sent.clear()
    loc = client.get(f"/api/events/by-code/{code}").json()["locations"][0]
    m = client.post(f"/api/events/by-code/{code}/meetings", headers=a,
                    json={"target_id": b_id, "location": loc, "in_minutes": 5}).json()
    assert len(sent) == 1 and sent[0][0] == 2 and "Aida" in sent[0][1] and loc in sent[0][1]
    client.post(f"/api/events/by-code/{code}/meetings/{m['id']}/respond", headers=b, json={"accept": True})
    assert sent[-1][0] == 1 and "Bek" in sent[-1][1]


def test_telegram_summary(client, monkeypatch):
    from backend.app import telegram
    from backend.app.ctx import ctx

    admin = _admin(client)
    ev = client.post("/api/events", headers=admin, json={"title": "Sum Event"}).json()
    code = ev["code"]

    monkeypatch.setattr(telegram, "TOKEN", "")
    r = client.post(f"/api/events/{ev['id']}/telegram-summary", headers=admin)
    assert r.status_code == 409 and r.json()["detail"] == "telegram_off"

    sent = []
    monkeypatch.setattr(telegram, "TOKEN", "test")
    monkeypatch.setattr(telegram, "_send", lambda chat, text: sent.append((chat, text)))
    a_id, a = _join(client, code, "Aida", "find_job")
    b_id, b = _join(client, code, "Bek", "hire")
    c_id, c = _join(client, code, "Cem", "find_mentor")
    ctx.state.data.setdefault("tg_chats", {}).update({a_id: 11, b_id: 12, c_id: 13})
    client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": b_id})
    client.post(f"/api/events/by-code/{code}/meet", headers=b, json={"target_id": a_id})
    client.post(f"/api/events/by-code/{code}/meet", headers=c, json={"target_id": a_id})  # one-sided
    loc = client.get(f"/api/events/by-code/{code}").json()["locations"][0]
    m = client.post(f"/api/events/by-code/{code}/meetings", headers=a,
                    json={"target_id": c_id, "location": loc, "in_minutes": 5}).json()
    client.post(f"/api/events/by-code/{code}/meetings/{m['id']}/respond", headers=c, json={"accept": True})
    client.post(f"/api/events/by-code/{code}/meetings/{m['id']}/done", headers=a, json={})
    sent.clear()

    assert client.post(f"/api/events/{ev['id']}/telegram-summary").status_code == 401
    assert client.post(f"/api/events/{ev['id']}/telegram-summary", headers=a).status_code == 403
    r = client.post(f"/api/events/{ev['id']}/telegram-summary", headers=admin)
    assert r.json() == {"sent": 3, "linked": 3}
    by_chat = dict(sent)
    assert "Sum Event" in by_chat[11]
    assert "Bek" in by_chat[11] and "@Bek" in by_chat[11] and "Cem" in by_chat[11] and loc in by_chat[11]
    assert "@Cem" not in by_chat[11]  # done meeting but not mutual: no contact
    assert "Aida" in by_chat[12] and "@Aida" in by_chat[12]
    assert "Aida" in by_chat[13] and loc in by_chat[13]
    assert "@" not in by_chat[13]  # no mutual interest: no contacts
