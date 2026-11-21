"""Telegram linking is owner-only and one-time; the verified @username replaces the typed contact."""
import os

P = {"role": "Dev", "stack": ["Python"], "experience_years": 2, "interests": ["AI"], "about": "x", "lang": "en"}


def _admin(client):
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    return {"X-Admin-Token": r.json()["token"]}


def _join(client, code, name, goal):
    d = client.post(f"/api/events/by-code/{code}/join",
                    json={"profile": {**P, "name": name, "goal": goal}, "contact": f"@{name}", "lang": "en"}).json()
    return d["member_id"], {"X-Member-Token": d["token"]}


def _setup(monkeypatch):
    from backend.app import telegram

    monkeypatch.setattr(telegram, "TOKEN", "test")
    monkeypatch.setattr(telegram, "_bot_username", "qitbot")
    sent = []
    monkeypatch.setattr(telegram, "_send", lambda chat, text: sent.append((chat, text)))
    return telegram, sent


def _code(client, headers):
    return client.get("/api/tg/link", headers=headers).json()["url"].split("start=")[1]


def _start(telegram, code, chat, username="real", first="R"):
    telegram._handle({"message": {"text": f"/start {code}", "chat": {"id": chat},
                                  "from": {"username": username, "first_name": first}}})


def _event(client, title):
    return client.post("/api/events", headers=_admin(client), json={"title": title}).json()["code"]


def test_code_is_one_time(client, monkeypatch):
    from backend.app.ctx import ctx

    telegram, sent = _setup(monkeypatch)
    m_id, m = _join(client, _event(client, "TG once"), "Once", "find_job")
    c = _code(client, m)
    _start(telegram, c, 501)
    assert client.get("/api/tg/link", headers=m).json()["linked"] is True
    assert "Done" in sent[-1][1]
    _start(telegram, c, 502, username="thief")  # reuse is rejected
    assert sent[-1][0] == 502 and "Откройте" in sent[-1][1]
    assert ctx.state.data["tg_chats"][m_id] == 501
    assert ctx.state.data["tg_users"][m_id] == {"chat_id": 501, "username": "real", "first_name": "R"}


def test_expired_and_replaced_codes(client, monkeypatch):
    from backend.app.ctx import ctx

    telegram, sent = _setup(monkeypatch)
    m_id, m = _join(client, _event(client, "TG exp"), "Exp", "find_job")
    old = _code(client, m)
    new = _code(client, m)
    assert old != new
    _start(telegram, old, 511)
    assert m_id not in ctx.state.data["tg_chats"]  # a replaced code is dead
    ctx.state.data["tg_links"][new]["created"] -= 16 * 60
    _start(telegram, new, 511)
    assert m_id not in ctx.state.data["tg_chats"]  # expired
    _start(telegram, _code(client, m), 511)
    assert ctx.state.data["tg_chats"][m_id] == 511


def test_no_hijack_without_fresh_code(client, monkeypatch):
    from backend.app.ctx import ctx

    telegram, sent = _setup(monkeypatch)
    code = _event(client, "TG hij")
    a_id, a = _join(client, code, "Vic", "find_job")
    b_id, b = _join(client, code, "Eve", "hire")
    _start(telegram, _code(client, a), 521, username="victim")
    _start(telegram, _code(client, b), 522, username="eve")
    _start(telegram, "guess", 522)
    _start(telegram, "", 522)
    assert ctx.state.data["tg_chats"][a_id] == 521
    assert ctx.state.data["tg_users"][a_id]["username"] == "victim"
    # one Telegram account, one member: the newest link wins
    _start(telegram, _code(client, b), 521, username="victim")
    assert a_id not in ctx.state.data["tg_chats"] and ctx.state.data["tg_chats"][b_id] == 521


def test_verified_username_replaces_typed_contact(client, monkeypatch):
    telegram, sent = _setup(monkeypatch)
    code = _event(client, "TG ver")
    a_id, a = _join(client, code, "Ann", "find_job")
    b_id, b = _join(client, code, "Bob", "hire")
    _start(telegram, _code(client, b), 531, username="bob_real")
    client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": b_id})
    r = client.post(f"/api/events/by-code/{code}/meet", headers=b, json={"target_id": a_id})
    assert r.json() == {"mutual": True, "contact": "@Ann", "contact_verified": False}
    r = client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": b_id}).json()
    assert r["contact"] == "@bob_real" and r["contact_verified"] is True
    mut = {x["profile"]["id"]: x for x in client.get(f"/api/events/by-code/{code}/mutual", headers=a).json()}
    assert mut[b_id]["contact"] == "@bob_real" and mut[b_id]["contact_verified"] is True
    mut = client.get(f"/api/events/by-code/{code}/mutual", headers=b).json()
    assert mut[0]["contact"] == "@Ann" and mut[0]["contact_verified"] is False
    # linked without a username: the typed contact stays, unverified
    c_id, c = _join(client, code, "Cy", "hire")
    _start(telegram, _code(client, c), 532, username=None)
    client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": c_id})
    client.post(f"/api/events/by-code/{code}/meet", headers=c, json={"target_id": a_id})
    r = client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": c_id}).json()
    assert r["contact"] == "@Cy" and r["contact_verified"] is False
    # no mutual interest: nothing is revealed
    d_id, d = _join(client, code, "Di", "hire")
    r = client.post(f"/api/events/by-code/{code}/meet", headers=a, json={"target_id": d_id}).json()
    assert r == {"mutual": False, "contact": None, "contact_verified": False}


def test_unlink(client, monkeypatch):
    from backend.app.ctx import ctx

    telegram, sent = _setup(monkeypatch)
    m_id, m = _join(client, _event(client, "TG unl"), "Una", "find_job")
    _start(telegram, _code(client, m), 541, username="una")
    assert client.delete("/api/tg/link").status_code == 401
    assert client.delete("/api/tg/link", headers=m).status_code == 204
    assert m_id not in ctx.state.data["tg_chats"] and m_id not in ctx.state.data["tg_users"]
    assert client.get("/api/tg/link", headers=m).json()["linked"] is False
