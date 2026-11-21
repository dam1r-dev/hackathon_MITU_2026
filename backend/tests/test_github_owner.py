"""GitHub ownership: a login counts only after the member puts a one-time code in their bio."""
import os

import httpx
import pytest

from backend.app import github

USER = {"login": "octo", "name": "Octo Cat", "bio": "Hacker", "avatar_url": "", "public_repos": 1,
        "created_at": "2015-01-01T00:00:00Z"}


@pytest.fixture(autouse=True)
def _clean():
    github._cache.clear()
    yield
    github._cache.clear()


def _members(client):
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    code = client.post("/api/events", headers={"X-Admin-Token": r.json()["token"]}, json={"title": "GH own"}).json()["code"]
    p = {"role": "Dev", "stack": ["Python"], "experience_years": 2, "interests": ["AI"], "about": "x", "lang": "en"}
    out = []
    for name, goal in (("Gia", "find_job"), ("Hal", "hire")):
        d = client.post(f"/api/events/by-code/{code}/join",
                        json={"profile": {**p, "name": name, "goal": goal}, "lang": "en"}).json()
        out.append((d["member_id"], {"X-Member-Token": d["token"]}))
    return code, out


def _fake(bio):
    def get(url):
        if "/repos" in url:
            return httpx.Response(200, json=[])
        return httpx.Response(200, json={**USER, "bio": bio})
    return get


def test_github_ownership(client, monkeypatch):
    code, ((a_id, a), (b_id, b)) = _members(client)
    assert client.post("/api/me/github/start", json={"login": "octo"}).status_code == 401
    assert client.post("/api/me/github/start", headers=a, json={"login": "a_b"}).status_code == 422
    assert client.post("/api/me/github/verify", headers=a).status_code == 404  # nothing pending

    # the prefill alone never marks a login as verified
    monkeypatch.setattr(github, "_get", _fake("Hacker"))
    assert client.get("/api/github/octo").status_code == 200
    seen = client.get(f"/api/events/by-code/{code}/matches", headers=b).json()["matches"]
    assert seen and all(m["profile"]["github"] is None for m in seen)

    start = client.post("/api/me/github/start", headers=a, json={"login": "octo"}).json()
    assert start["login"] == "octo" and start["code"].startswith("qit-") and len(start["code"]) == 10
    r = client.post("/api/me/github/verify", headers=a)  # the cached prefill bio has no code
    assert r.status_code == 409 and r.json()["detail"] == "code_not_found"

    monkeypatch.setattr(github, "_get", _fake(f"Hacker {start['code']}"))
    r = client.post("/api/me/github/verify", headers=a)  # bypasses the prefill cache
    assert r.status_code == 200 and r.json() == {"github": "octo"}
    assert client.get("/api/me", headers=a).json()["profile"]["github"] == "octo"
    seen = client.get(f"/api/events/by-code/{code}/matches", headers=b).json()["matches"]
    assert [m["profile"]["github"] for m in seen if m["profile"]["id"] == a_id] == ["octo"]
    assert client.post("/api/me/github/verify", headers=a).status_code == 404  # code consumed

    assert client.delete("/api/me/github", headers=a).status_code == 204
    assert client.get("/api/me", headers=a).json()["profile"]["github"] is None


def test_github_code_expires(client, monkeypatch):
    from backend.app.ctx import ctx

    code, ((a_id, a), _) = _members(client)
    start = client.post("/api/me/github/start", headers=a, json={"login": "octo"}).json()
    ctx.state.data["github_pending"][a_id]["created"] -= 16 * 60
    monkeypatch.setattr(github, "_get", _fake(start["code"]))
    assert client.post("/api/me/github/verify", headers=a).status_code == 404
