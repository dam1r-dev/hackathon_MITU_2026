"""data/profiles.json follows the contract and the hackathon rules (100+ synthetic profiles)."""
from collections import Counter

from backend.app.models import Profile

GOALS = {"find_job", "hire", "find_mentor", "be_mentor", "find_cofounder", "exchange_experience"}


def test_at_least_100_profiles(raw_profiles):
    assert len(raw_profiles) >= 100


def test_every_profile_matches_contract(raw_profiles):
    for p in raw_profiles:
        Profile(**p)  # raises on a wrong field or goal
        assert p["role"] and p["stack"] and p["about"], p["id"]


def test_ids_and_names_unique(raw_profiles):
    assert len({p["id"] for p in raw_profiles}) == len(raw_profiles)
    assert len({p["name"] for p in raw_profiles}) == len(raw_profiles)


def test_diversity(raw_profiles):
    goals = Counter(p["goal"] for p in raw_profiles)
    assert set(goals) == GOALS
    assert min(goals.values()) >= 10, goals  # enough people on every side for a top 5
    assert {p["lang"] for p in raw_profiles} == {"kk", "ru", "en"}
    assert len({p["role"] for p in raw_profiles}) >= 15
