"""Goal reciprocity, exactly 5 matches, sorted scores. Hard requirements 2 and 3."""
import pytest

from backend.app.models import RECIPROCAL, ProfileIn


def _top(index, p: dict, lang: str = "ru"):
    _, matches = index.recommend(ProfileIn(**{k: v for k, v in p.items() if k != "id"}), lang, p["id"])
    return matches


def test_job_seeker_never_sees_job_seekers(index, raw_profiles):
    seekers = [p for p in raw_profiles if p["goal"] == "find_job"]
    assert seekers
    for p in seekers:
        goals = {m.profile.goal for m in _top(index, p)}
        assert goals == {"hire"}, (p["id"], goals)


def test_reciprocity_for_every_profile(index, raw_profiles):
    for p in raw_profiles:
        for m in _top(index, p):
            assert m.profile.goal == RECIPROCAL[p["goal"]], (p["id"], m.profile.id)
            assert m.profile.id != p["id"], "viewer must not see themselves"


def test_exactly_five_sorted(index, raw_profiles):
    for p in raw_profiles:
        matches = _top(index, p)
        assert len(matches) == 5, p["id"]
        scores = [m.score for m in matches]
        assert scores == sorted(scores, reverse=True), p["id"]


@pytest.mark.parametrize("lang", ["kk", "ru", "en"])
def test_explanations_filled_in_every_language(index, raw_profiles, lang):
    for m in _top(index, raw_profiles[0], lang):
        for field in (m.explanation, m.you_give, m.they_give, m.icebreaker):
            assert field.strip()


def test_new_visitor_job_seeker_gets_hirers(index):
    """A jury member who is not in the dataset fills in the form."""
    visitor = ProfileIn(
        name="Test Visitor",
        role="Junior Python developer",
        stack=["Python", "Django"],
        experience_years=1,
        interests=["fintech"],
        about="Ищу первую работу бэкенд-разработчиком.",
        goal="find_job",
        lang="ru",
    )
    _, matches = index.recommend(visitor, "ru")
    assert len(matches) == 5
    assert {m.profile.goal for m in matches} == {"hire"}


def test_mentor_is_more_experienced(index, raw_profiles):
    """Two-sided score: a mentee's top match should usually have more experience."""
    mentees = [p for p in raw_profiles if p["goal"] == "find_mentor"]
    for p in mentees:
        best = _top(index, p)[0]
        assert best.profile.experience_years > p["experience_years"], p["id"]
