"""GitHub prefill: no real network, the module's _get is replaced."""
import httpx
import pytest

from backend.app import github

USER = {"login": "octo", "name": "Octo Cat", "bio": "Hacker", "avatar_url": "http://a/x.png",
        "public_repos": 5, "created_at": "2015-01-01T00:00:00Z"}
REPOS = [
    {"language": "Python", "fork": False, "topics": ["ai", "cli"]},
    {"language": "Python", "fork": False, "topics": ["ai"]},
    {"language": "Go", "fork": False, "topics": []},
    {"language": "Rust", "fork": True, "topics": ["ai", "ai2"]},
    {"language": None, "fork": False, "topics": ["web"]},
]


def _fake(user_status=200, repos_status=200):
    def get(url):
        if "/repos" in url:
            return httpx.Response(repos_status, json=REPOS)
        return httpx.Response(user_status, json=USER)
    return get


@pytest.fixture(autouse=True)
def _clean():
    github._cache.clear()
    yield
    github._cache.clear()


def test_profile_languages_topics_forks(client, monkeypatch):
    monkeypatch.setattr(github, "_get", _fake())
    r = client.get("/api/github/octo")
    assert r.status_code == 200
    d = r.json()
    assert d["stack"] == ["Python", "Go"]  # fork (Rust) and null ignored
    assert d["interests"][0] == "ai" and "ai2" not in d["interests"]
    assert d["name"] == "Octo Cat" and d["about"] == "Hacker" and d["repos"] == 5
    assert 0 <= d["experience_years"] <= 20 and d["experience_years"] >= 10


def test_cached(client, monkeypatch):
    calls = []
    f = _fake()
    monkeypatch.setattr(github, "_get", lambda u: (calls.append(u), f(u))[1])
    client.get("/api/github/octo")
    client.get("/api/github/octo")
    assert len(calls) == 2


def test_errors(client, monkeypatch):
    monkeypatch.setattr(github, "_get", _fake(user_status=404))
    r = client.get("/api/github/nobody")
    assert r.status_code == 404 and r.json()["detail"] == "github_not_found"
    monkeypatch.setattr(github, "_get", _fake(user_status=403))
    r = client.get("/api/github/limited")
    assert r.status_code == 503 and r.json()["detail"] == "github_rate_limited"

    def boom(url):
        raise httpx.ConnectError("down")
    monkeypatch.setattr(github, "_get", boom)
    r = client.get("/api/github/offline")
    assert r.status_code == 503 and r.json()["detail"] == "github_unavailable"


def test_bad_username(client):
    for bad in ("-x", "a_b", "x" * 40, "a.b"):
        assert client.get(f"/api/github/{bad}").status_code == 422, bad
