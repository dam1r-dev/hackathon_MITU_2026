"""Profile prefill from a public GitHub account. See docs/CONTRACT.md (GET /api/github/{username})."""
from __future__ import annotations

import re
import threading
import time
from collections import Counter
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api")

API = "https://api.github.com"
USERNAME = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")
HEADERS = {"Accept": "application/vnd.github+json", "User-Agent": "qazaq-it-networking"}
TTL = 600.0

_cache: dict[str, tuple[float, dict]] = {}
_lock = threading.Lock()


def _get(url: str) -> httpx.Response:
    """The only place that touches the network (tests replace it)."""
    return httpx.get(url, headers=HEADERS, timeout=6, follow_redirects=True)


def _fetch(url: str):
    try:
        r = _get(url)
    except httpx.HTTPError:
        raise HTTPException(503, "github_unavailable")
    if r.status_code == 404:
        raise HTTPException(404, "github_not_found")
    if r.status_code in (403, 429):
        raise HTTPException(503, "github_rate_limited")
    if r.status_code >= 400:
        raise HTTPException(503, "github_unavailable")
    try:
        return r.json()
    except ValueError:
        raise HTTPException(503, "github_unavailable")


def _years(created_at: str | None) -> int:
    try:
        d = datetime.fromisoformat((created_at or "").replace("Z", "+00:00"))
    except ValueError:
        return 0
    return max(0, min(20, int((datetime.now(timezone.utc) - d).days // 365.25)))


def build(user: dict, repos: list[dict]) -> dict:
    own = [r for r in repos if not r.get("fork")]
    langs = Counter(r["language"] for r in own if r.get("language"))
    topics = Counter(t for r in own for t in (r.get("topics") or []))
    login = user.get("login") or ""
    return {
        "login": login,
        "name": user.get("name") or login,
        "about": user.get("bio") or "",
        "stack": [k for k, _ in langs.most_common(6)],
        "interests": [k for k, _ in topics.most_common(5)],
        "experience_years": _years(user.get("created_at")),
        "avatar_url": user.get("avatar_url") or "",
        "repos": int(user.get("public_repos") or 0),
    }


@router.get("/github/{username}")
def github_profile(username: str) -> dict:
    if not USERNAME.match(username):
        raise HTTPException(422, "bad_username")
    key = username.lower()
    now = time.monotonic()
    with _lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < TTL:
            return hit[1]
    user = _fetch(f"{API}/users/{username}")
    repos = _fetch(f"{API}/users/{username}/repos?per_page=100&sort=pushed")
    out = build(user, repos if isinstance(repos, list) else [])
    with _lock:
        _cache[key] = (now, out)
    return out
