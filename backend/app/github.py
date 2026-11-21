"""Profile prefill from a public GitHub account. See docs/CONTRACT.md (GET /api/github/{username})."""
from __future__ import annotations

import re
import secrets
import threading
import time
from collections import Counter
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from .api_events import Auth, auth, need_member
from .ctx import ctx

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


# ------------------------------------------------------------------ ownership check
CODE_TTL = 15 * 60


class GithubStart(BaseModel):
    login: str


@router.post("/me/github/start")
def github_start(req: GithubStart, a: Auth = Depends(auth)) -> dict:
    """Issue a code the member puts in their GitHub bio. Pending for 15 minutes."""
    member_id = need_member(a)
    login = req.login.strip().lstrip("@")
    if not USERNAME.match(login):
        raise HTTPException(422, "bad_username")
    code = "qit-" + secrets.token_hex(3)
    st = ctx.state
    with st.lock:
        st.data["github_pending"][member_id] = {"login": login, "code": code, "created": time.time()}
        st.save()
    return {"code": code, "login": login}


@router.post("/me/github/verify")
def github_verify(a: Auth = Depends(auth)) -> dict:
    member_id = need_member(a)
    st = ctx.state
    rec = st.data["github_pending"].get(member_id)
    if not rec or time.time() - rec["created"] > CODE_TTL:
        raise HTTPException(404, "no_pending_check")
    user = _fetch(f"{API}/users/{rec['login']}")  # fresh, never from the prefill cache
    bio = (user.get("bio") or "") if isinstance(user, dict) else ""
    if rec["code"].lower() not in bio.lower():
        raise HTTPException(409, "code_not_found")
    login = (user.get("login") or rec["login"]) if isinstance(user, dict) else rec["login"]
    with st.lock:
        st.data["github"][member_id] = login
        st.data["github_pending"].pop(member_id, None)
        st.save()
    return {"github": login}


@router.delete("/me/github", status_code=204)
def github_remove(a: Auth = Depends(auth)) -> Response:
    member_id = need_member(a)
    st = ctx.state
    with st.lock:
        st.data["github"].pop(member_id, None)
        st.data["github_pending"].pop(member_id, None)
        st.save()
    return Response(status_code=204)
