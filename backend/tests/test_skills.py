"""Employers describe the vacancy in words: skills and level are read from the text (backend/app/matching.py)."""
import numpy as np

from backend.app.matching import SKILLS, Subject, _goal_factor, effective_stack, vacancy_level
from backend.app.models import ProfileIn


def _hire(wanted: str, about: str = "") -> ProfileIn:
    return ProfileIn(name="HR Test", role="HR, Kaspi.kz", goal="hire", wanted_role=wanted, about=about, lang="ru")


def test_skills_are_read_from_vacancy_text():
    found = SKILLS.read("Junior React-разработчик, нужен питон и Docker; we go fast")
    assert {"React", "Python", "Docker"} <= set(found)
    assert "Go" not in found  # "go" in a sentence is not the Go language
    assert effective_stack(_hire("Senior Go developer")) == ["Go"]
    # A filled stack is kept as is.
    assert effective_stack(ProfileIn(name="A", role="Dev", goal="find_job", stack=["Rust"])) == ["Rust"]


def test_vacancy_level():
    assert vacancy_level(_hire("Junior frontend-разработчик")) == "junior"
    assert vacancy_level(_hire("QA lead")) == "senior"
    assert vacancy_level(_hire("Backend developer")) is None
    assert vacancy_level(_hire("Developer for a leading fintech")) is None


def test_level_changes_the_employer_side_fit():
    v = np.zeros(3, dtype=np.float32)
    junior_job = Subject("hire", 0, set(), set(), v, "junior")
    senior_job = Subject("hire", 0, set(), set(), v, "senior")
    lead = Subject("find_job", 10, set(), set(), v)
    newbie = Subject("find_job", 1, set(), set(), v)
    assert _goal_factor(junior_job, newbie) > _goal_factor(junior_job, lead)
    assert _goal_factor(senior_job, lead) > _goal_factor(senior_job, newbie)


def test_employer_without_stack_gets_matching_candidates(index):
    _, matches = index.recommend(_hire("Junior React frontend developer"), "ru")
    assert len(matches) == 5 and {m.profile.goal for m in matches} == {"find_job"}
    top = matches[0]
    assert "React" in top.profile.stack, [m.profile.stack for m in matches]
    assert "React" in top.shared_tags
