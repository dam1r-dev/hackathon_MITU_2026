"""Rotating join PIN: organizer-only display, public resolve, grace window, open events only."""
import os
import time

from backend.app import pin as pinlib


def _admin(client) -> dict:
    r = client.post("/api/admin/login", json={"code": os.getenv("ADMIN_CODE", "qazaq-admin")})
    assert r.status_code == 200, r.text
    return {"X-Admin-Token": r.json()["token"]}


def _event_id(client, code: str) -> str:
    return next(e["id"] for e in client.get("/api/events", headers=_admin(client)).json() if e["code"] == code)


def _window() -> int:
    return int(time.time() // pinlib.WINDOW_SECONDS)


def test_pin_endpoint_requires_admin(client):
    assert client.get("/api/events/by-code/DEMO/pin").status_code == 401
    r = client.get("/api/events/by-code/DEMO/pin", headers=_admin(client))
    assert r.status_code == 200
    body = r.json()
    assert len(body["pin"]) == 6 and body["pin"].isdigit()
    assert 0 < body["expires_in"] <= pinlib.WINDOW_SECONDS


def test_resolve_current_pin(client):
    pin = client.get("/api/events/by-code/DEMO/pin", headers=_admin(client)).json()["pin"]
    r = client.post("/api/pin", json={"pin": f"{pin[:3]} {pin[3:]}"})
    assert r.status_code == 200 and r.json() == {"code": "DEMO"}


def test_previous_window_still_works(client):
    old = pinlib.pin_for(_event_id(client, "DEVNIGHT"), _window() - 1)
    assert client.post("/api/pin", json={"pin": old}).json() == {"code": "DEVNIGHT"}


def test_older_window_rejected(client):
    old = pinlib.pin_for(_event_id(client, "DEVNIGHT"), _window() - 5)
    r = client.post("/api/pin", json={"pin": old})
    assert r.status_code == 404 and r.json()["detail"] == "pin_invalid"


def test_wrong_pin(client):
    r = client.post("/api/pin", json={"pin": "12"})
    assert r.status_code == 404 and r.json()["detail"] == "pin_invalid"


def test_closed_event_pin_not_accepted(client):
    pin = pinlib.pin_for(_event_id(client, "STARTUP"))
    assert client.post("/api/pin", json={"pin": pin}).status_code == 404
