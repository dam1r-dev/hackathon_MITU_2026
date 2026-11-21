"""Generate seed events into data/events.json (read by the backend on the first start).

    python data/generate_events.py

Three events (see "Seed events" in docs/CONTRACT.md):
  DEMO     every profile, open. The demo script and tests use this code.
  DEVNIGHT engineers only (backend, frontend, mobile, data, devops, QA, security), open.
  STARTUP  product, founders and mentors, closed (a past event, shows the "closed" state).
Every event keeps at least MIN_PER_GOAL people per goal so a top 5 is always full.
Deterministic: the same profiles give the same file.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent
PROFILES = DATA / "profiles.json"
OUT = DATA / "events.json"
MIN_PER_GOAL = 6
GOALS = ["find_job", "hire", "find_mentor", "be_mentor", "find_cofounder", "exchange_experience"]

NON_ENGINEERING = ("product", "designer", "recruiter", "manager")
STARTUP_GOALS = {"find_cofounder", "be_mentor", "find_mentor"}


def _top_up(chosen: list[dict], everyone: list[dict]) -> list[dict]:
    """Add people (in id order) until every goal has MIN_PER_GOAL attendees."""
    ids = {p["id"] for p in chosen}
    for goal in GOALS:
        have = sum(p["goal"] == goal for p in chosen)
        for p in everyone:
            if have >= MIN_PER_GOAL:
                break
            if p["goal"] == goal and p["id"] not in ids:
                chosen.append(p)
                ids.add(p["id"])
                have += 1
    return sorted(chosen, key=lambda p: p["id"])


def main() -> None:
    profiles = json.loads(PROFILES.read_text(encoding="utf-8"))
    engineers = [p for p in profiles if not any(w in p["role"].lower() for w in NON_ENGINEERING)]
    startup = [p for p in profiles if p["goal"] in STARTUP_GOALS or "startups" in p["interests"]]

    events = [
        {"title": "Qazaq IT Meetup: AI in Engineering", "date": "2026-11-21", "venue": "METU, Almaty",
         "code": "DEMO", "status": "open", "attendees": "all"},
        {"title": "Qazaq IT Dev Night", "date": "2026-12-05", "venue": "Astana Hub, Astana",
         "code": "DEVNIGHT", "status": "open", "attendees": [p["id"] for p in _top_up(engineers, profiles)]},
        {"title": "Startup & Product Meetup", "date": "2026-10-17", "venue": "Almaty",
         "code": "STARTUP", "status": "closed", "attendees": [p["id"] for p in _top_up(startup, profiles)]},
    ]
    OUT.write_text(json.dumps(events, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    by_id = {p["id"]: p for p in profiles}
    for e in events:
        ids = list(by_id) if e["attendees"] == "all" else e["attendees"]
        goals = Counter(by_id[i]["goal"] for i in ids)
        assert all(goals[g] >= MIN_PER_GOAL for g in GOALS), (e["code"], goals)
        print(f"{e['code']:9} {e['status']:6} {len(ids):3} attendees  {dict(goals)}")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
