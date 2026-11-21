"""Shared fixtures. Run from the repo root: python -m pytest backend/tests -q

The real embedding model is used when it is cached (.cache/fastembed), otherwise the
backend falls back to hashing vectors by itself. EMBEDDER=hashing forces the fast path.
"""
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

PROFILES_FILE = ROOT / "data" / "profiles.json"


@pytest.fixture(scope="session")
def raw_profiles() -> list[dict]:
    return json.loads(PROFILES_FILE.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def index(raw_profiles):
    from backend.app.embeddings import Embedder
    from backend.app.matching import Index
    from backend.app.models import Profile

    idx = Index(Embedder())
    idx.add_many([Profile(**p) for p in raw_profiles])
    return idx


@pytest.fixture(scope="session")
def client(tmp_path_factory):
    """The real FastAPI app with a throwaway state file."""
    import os

    os.environ["STATE_FILE"] = str(tmp_path_factory.mktemp("state") / "state.json")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    with TestClient(app) as c:
        yield c
