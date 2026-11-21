"""Rotating 6-digit event PIN (Kahoot style) for people who cannot scan the QR code.

The PIN is derived from a per-process secret, the event id and a 5-minute window, so nothing is
stored. A restart changes every PIN; that is fine, the projector fetches a fresh one.
"""
import hashlib
import hmac
import os
import time

WINDOW_SECONDS = 300
_SECRET = os.urandom(32)


def _window(now: float | None = None) -> int:
    return int((time.time() if now is None else now) // WINDOW_SECONDS)


def pin_for(event_id: str, window: int | None = None) -> str:
    w = _window() if window is None else window
    digest = hmac.new(_SECRET, f"{event_id}:{w}".encode(), hashlib.sha256).digest()
    return f"{int.from_bytes(digest[:8], 'big') % 1_000_000:06d}"


def seconds_left() -> int:
    return max(1, int(WINDOW_SECONDS - (time.time() % WINDOW_SECONDS)))
