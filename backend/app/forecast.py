"""Pre-event forecast for organizers: who registered and what to do before the event.

Pure counting over the event's attendees (no LLM, no embeddings), see docs/CONTRACT.md
"Pre-event forecast".
"""
from collections import Counter

from fastapi import APIRouter, Depends

from .api_events import Auth, _attendee_ids, _event_by_id, auth, need_manager, scarce_hints
from .ctx import ctx
from .models import RECIPROCAL, Profile

router = APIRouter(prefix="/api")

# First match wins, so "product designer" is design and "QA lead" is qa.
ROLE_FAMILIES: list[tuple[str, tuple[str, ...]]] = [
    ("design", ("design", "ux", "ui ", "дизайн")),
    ("qa", ("qa", "test", "тестир")),
    ("security", ("secur", "pentest", "безопас")),
    ("mobile", ("ios", "android", "mobile", "flutter", "мобил")),
    ("data", ("data", "ml ", "machine learning", "analyst", "scientist", "аналит", "данн")),
    ("devops", ("devops", "sre", "platform", "cloud", "infra")),
    ("frontend", ("frontend", "front-end", "фронт")),
    ("backend", ("backend", "back-end", "бэкенд", "бекенд", "fullstack", "full-stack", "developer", "engineer", "разработ")),
    ("product", ("product", "продакт", "продукт", " pm", "project")),
    ("management", ("cto", "ceo", "head", "founder", "director", "hr", "recruit", "lead", "руковод")),
]

LEVELS = (("junior", 2), ("middle", 5), ("senior", 10))


def role_family(role: str) -> str:
    r = f" {role.lower()} "
    for family, keys in ROLE_FAMILIES:
        if any(k in r for k in keys):
            return family
    return "other"


def level(years: int) -> str:
    for name, below in LEVELS:
        if years < below:
            return name
    return "lead"


def _top(c: Counter, n: int | None = None) -> list[dict]:
    return [{"name": k, "count": v} for k, v in sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[:n] if v > 0]


def build_forecast(people: list[Profile]) -> dict:
    total = len(people)
    goals = Counter(p.goal for p in people)
    counts = {g: goals.get(g, 0) for g in RECIPROCAL}
    stacks = Counter(s for p in people for s in dict.fromkeys(p.stack))
    roles = Counter(role_family(p.role) for p in people)
    levels = Counter(level(p.experience_years) for p in people)
    langs = Counter(p.lang for p in people)

    # Has at least one other attendee with the reciprocal goal.
    without = Counter()
    for p in people:
        partners = counts[RECIPROCAL[p.goal]] - (1 if RECIPROCAL[p.goal] == p.goal else 0)
        if partners <= 0:
            without[p.goal] += 1
    without_total = sum(without.values())

    tips: list[dict] = []
    if 0 < total < 10:
        tips.append({"code": "few_registered", "params": {"count": total}})
    tips += [{"code": h.code, "params": h.model_dump(exclude={"code"})} for h in scarce_hints(counts)]

    seeker_stacks = Counter(s for p in people if p.goal == "find_job" for s in dict.fromkeys(p.stack))
    hirer_stacks = Counter(s for p in people if p.goal == "hire" for s in dict.fromkeys(p.stack))
    gaps = [
        (s, n, hirer_stacks.get(s, 0))
        for s, n in seeker_stacks.items()
        if n >= 4 and hirer_stacks.get(s, 0) <= n * 0.25
    ]
    for s, n, h in sorted(gaps, key=lambda g: (-g[1], g[0]))[:2]:
        tips.append({"code": "stack_gap", "params": {"stack": s, "seekers": n, "hirers": h}})

    if total >= 8 and stacks:
        s, n = min(stacks.items(), key=lambda kv: (-kv[1], kv[0]))
        if n / total >= 0.25:
            tips.append({"code": "stack_cluster", "params": {"stack": s, "count": n, "share": round(n / total, 2)}})

    if total >= 4 and levels["junior"] / total >= 0.5:
        tips.append({"code": "mostly_junior", "params": {"share": round(levels["junior"] / total, 2)}})

    if without_total:
        goal = min(without.items(), key=lambda kv: (-kv[1], kv[0]))[0]
        tips.append({"code": "no_pair", "params": {"count": without_total, "goal": goal}})

    if 1 <= counts["find_cofounder"] <= 2:
        tips.append({"code": "cofounder_thin", "params": {"count": counts["find_cofounder"]}})

    return {
        "attendees": total,
        "by_goal": [{"goal": g, "count": c} for g, c in counts.items()],
        "stacks": _top(stacks, 8),
        "roles": _top(roles),
        "levels": [{"name": n, "count": levels[n]} for n in ("junior", "middle", "senior", "lead") if levels[n]],
        "langs": _top(langs),
        "pairs": {
            "with_pair": total - without_total,
            "without_pair": without_total,
            "without_by_goal": [{"goal": g, "count": c} for g, c in sorted(without.items(), key=lambda kv: (-kv[1], kv[0]))],
        },
        "tips": tips,
    }


@router.get("/events/{event_id}/forecast")
def forecast(event_id: str, a: Auth = Depends(auth)) -> dict:
    e = _event_by_id(event_id)
    need_manager(a, e)
    ids = _attendee_ids(e["id"])
    return build_forecast([p for p in ctx.index.profiles if p.id in ids])
