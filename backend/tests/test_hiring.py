"""Employers describe the vacancy: matching compares it with candidates (docs/CONTRACT.md)."""
from backend.app.matching import Subject, _goal_factor
from backend.app.models import ProfileIn

import numpy as np

EMPLOYER = {"name": "Dana HR", "role": "HR, Kaspi", "wanted_role": "Junior frontend developer",
            "stack": ["React", "TypeScript"], "experience_years": 1, "interests": [],
            "about": "Office in Almaty, junior role.", "goal": "hire", "lang": "en"}


def _seeker(name, stack, years=2, role="Developer"):
    return {"name": name, "role": role, "stack": stack, "experience_years": years, "interests": [],
            "about": "Looking for a job.", "goal": "find_job", "lang": "en"}


def _scored(index, viewer, others):
    from backend.app.models import Profile

    ids = set()
    for i, o in enumerate(others):
        pid = f"hire_test_{viewer['name']}_{i}"
        index.add_many([Profile(id=pid, **o)])
        ids.add(pid)
    try:
        _, ms = index.recommend(ProfileIn(**viewer), lang="en", allowed_ids=ids)
    finally:
        for pid in ids:
            index.remove(pid)
    return ms


def test_vacancy_ranks_matching_candidate_first(index):
    react = _seeker("React Rita", ["React", "TypeScript"], 2, "Frontend developer")
    go = _seeker("Go Gleb", ["Go", "PostgreSQL"], 2, "Backend developer")
    ms = _scored(index, {**EMPLOYER, "name": "Dana1"}, [go, react])
    assert [m.profile.name for m in ms][0] == "React Rita"
    assert ms[0].score > ms[1].score


def test_candidate_below_required_experience_scores_lower(index):
    ev = {**EMPLOYER, "name": "Dana2", "experience_years": 3}
    ok = _seeker("Enough Eli", ["React", "TypeScript"], 3)
    low = _seeker("Junior Jan", ["React", "TypeScript"], 1)
    ms = {m.profile.name: m for m in _scored(index, ev, [ok, low])}
    assert ms["Junior Jan"].score < ms["Enough Eli"].score
    assert "1 year, you need from 3" in ms["Junior Jan"].explanation


def test_goal_factor_values():
    v = np.zeros(1)
    emp = Subject("hire", 3, set(), set(), v)
    assert _goal_factor(emp, Subject("find_job", 3, set(), set(), v)) == 1.0
    assert _goal_factor(emp, Subject("find_job", 2, set(), set(), v)) == 0.8
    assert _goal_factor(emp, Subject("find_job", 0, set(), set(), v)) == 0.4


def test_texts_mention_vacancy(index):
    react = _seeker("React Rita", ["React", "TypeScript"], 2)
    ms = _scored(index, {**EMPLOYER, "name": "Dana3"}, [react])
    m = ms[0]
    assert "Junior frontend developer" in m.explanation and "React, TypeScript" in m.explanation
    assert m.you_give == "Vacancy: Junior frontend developer · React, TypeScript · from 1 yr"
    back = _scored(index, react, [{**EMPLOYER}])
    assert back[0].they_give == "Vacancy: Junior frontend developer · React, TypeScript · from 1 yr"
