"""Persistent state: events, attendees, roles, tokens, contacts, feedback, runtime profiles.

One JSON file, written atomically after every change. Default location is `.state/state.json`
in the repo root (git-ignored). Override with STATE_FILE. Admin tokens live in memory only,
so an admin signs in again after a restart.
"""
import json
import os
import secrets
import threading
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_PATH = Path(__file__).resolve().parents[2] / ".state" / "state.json"
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _empty() -> dict:
    return {
        "events": {},  # event_id -> {id, code, title, date, venue, status, organizer_ids, created_at}
        "attendees": {},  # event_id -> [member_id]
        "profiles": {},  # member_id -> Profile dict, only profiles created at runtime
        "deleted": [],  # ids of dataset profiles removed by an admin
        "roles": {},  # member_id -> "admin" | "organizer" (absent means member)
        "tokens": {},  # member token -> member_id
        "contacts": {},  # member_id -> contact string
        "admin_tokens": [],  # admin sessions survive a restart (docker rebuild)
        "meets": {},  # event_id -> {viewer_id: [target_id]}
        "presence": {},  # event_id -> {member_id: {"location": str, "at": iso}}
        "meetings": {},  # event_id -> {meeting_id: {id, from_id, to_id, location, at, status, created}}
        "joined_at": {},  # event_id -> {member_id: iso}, missing for attendees from before this was recorded
        "feedback": {},  # viewer_id -> {"met": [...], "not_fit": [...]}
    }


class State:
    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path or os.getenv("STATE_FILE") or DEFAULT_PATH)
        self.lock = threading.RLock()
        self.data = _empty()
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            loaded = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return
        for key in self.data:
            if key in loaded:
                self.data[key] = loaded[key]

    def save(self) -> None:
        with self.lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self.path.with_suffix(".tmp")
            tmp.write_text(json.dumps(self.data, ensure_ascii=False, indent=1), encoding="utf-8")
            os.replace(tmp, self.path)

    # ---- helpers
    @staticmethod
    def now() -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds")

    def new_event_id(self) -> str:
        return "e_" + secrets.token_hex(4)

    def new_member_id(self) -> str:
        return "m_" + secrets.token_hex(4)

    def new_code(self) -> str:
        used = {e["code"] for e in self.data["events"].values()}
        while True:
            code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))
            if code not in used:
                return code

    def event_by_code(self, code: str) -> dict | None:
        code = code.strip().upper()
        return next((e for e in self.data["events"].values() if e["code"].upper() == code), None)

    def role(self, member_id: str | None) -> str:
        return self.data["roles"].get(member_id or "", "member")

    def member_for_token(self, token: str | None) -> str | None:
        return self.data["tokens"].get(token) if token else None

    def events_of(self, member_id: str) -> list[str]:
        return [eid for eid, ids in self.data["attendees"].items() if member_id in ids]
