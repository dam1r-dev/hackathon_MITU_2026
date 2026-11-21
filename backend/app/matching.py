"""Matching: embeddings plus two-sided goal fit.

score(A, B) = sqrt(fit(A->B) * fit(B->A))

fit(X->Y) is 0 unless Y's goal is the reciprocal of X's goal. Otherwise it is
base similarity (embedding cosine, stack overlap, interest overlap) times a goal factor:
  - find_mentor / be_mentor: the mentor must have more experience than the mentee
  - find_cofounder: different stacks are better (complementary skills)
  - hire (employer judging a candidate): the candidate's experience vs the required minimum
  - other goals: factor 1
The goal factor is what makes the two directions differ.
"""
from __future__ import annotations

import json
import math
import os
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from . import texts
from .embeddings import Embedder
from .graph import layout
from .models import RECIPROCAL, Match, Profile, ProfileIn

EXPLANATIONS_FILE = Path(
    os.getenv("EXPLANATIONS_FILE", Path(__file__).parents[2] / "data" / "explanations.json")
)
TOP_N = 5


def profile_text(p: ProfileIn) -> str:
    if p.goal == "hire":  # the vacancy, not the employer
        return f"{p.wanted_role or p.role}. {', '.join(p.stack)}. {', '.join(p.interests)}. {p.about}"
    return f"{p.role}. {', '.join(p.stack)}. {', '.join(p.interests)}. {p.about}"


@dataclass
class Subject:
    goal: str
    exp: int
    stack: set[str]
    tags: set[str]
    vec: np.ndarray


def _subject(p: ProfileIn, vec: np.ndarray) -> Subject:
    stack = {t.lower() for t in p.stack}
    return Subject(p.goal, p.experience_years, stack, stack | {t.lower() for t in p.interests}, vec)


def _jaccard(a: set[str], b: set[str]) -> float:
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def _goal_factor(x: Subject, y: Subject) -> float:
    if x.goal == "find_mentor":
        gap = y.exp - x.exp
        return 0.35 if gap <= 0 else min(1.0, 0.55 + 0.15 * gap)
    if x.goal == "be_mentor":
        gap = x.exp - y.exp
        return 0.35 if gap <= 0 else min(1.0, 0.55 + 0.15 * gap)
    if x.goal == "find_cofounder":
        return 0.6 + 0.4 * (1.0 - _jaccard(x.stack, y.stack))
    if x.goal == "hire" and y.goal == "find_job":
        return 1.0 if y.exp >= x.exp else max(0.4, 1.0 - 0.2 * (x.exp - y.exp))
    return 1.0


def _overlap(a: set[str], b: set[str]) -> float:
    """Share of the smaller set found in the other one (overlap coefficient)."""
    return len(a & b) / min(len(a), len(b)) if a and b else 0.0


def fit(x: Subject, y: Subject) -> float:
    """How well Y serves X's goal, 0..1. Zero when the goals are not reciprocal.

    Stack overlap is weighted on its own so a shared stack beats a well-written bio
    in a different field (a frontend job seeker should meet the frontend lead first).
    """
    if RECIPROCAL[x.goal] != y.goal:
        return 0.0
    return (0.05 + 0.95 * similarity(x, y)) * _goal_factor(x, y)


def similarity(x: Subject, y: Subject) -> float:
    """Symmetric profile similarity, 0..1: embeddings, shared stack, shared interests. Ignores goals."""
    cos = float(np.dot(x.vec, y.vec))
    sim = min(1.0, max(0.0, (cos - 0.1) / 0.6))
    return 0.55 * sim + 0.3 * _overlap(x.stack, y.stack) + 0.15 * _overlap(x.tags - x.stack, y.tags - y.stack)


# Fallback picks (no goal match) are scaled down so they always rank below real two-sided matches.
SIMILAR_WEIGHT = 0.5


def score(x: Subject, y: Subject) -> float:
    return math.sqrt(fit(x, y) * fit(y, x))


class Index:
    """All profiles, their embeddings, per-viewer feedback and the cached map layout."""

    def __init__(self, embedder: Embedder) -> None:
        self.embedder = embedder
        self.profiles: list[Profile] = []
        self.mat = np.zeros((0, 1), dtype=np.float32)
        self.feedback: dict[str, dict[str, set[str]]] = {}
        self._layout: tuple[int, np.ndarray, np.ndarray] | None = None
        self._expl: dict = {}
        self._expl_mtime: float | None = None
        self.on_feedback = None  # optional callback, used to persist feedback

    # ---- data
    def add_many(self, new: list[Profile]) -> None:
        if not new:
            return
        vecs = self.embedder.encode([profile_text(p) for p in new])
        self.mat = vecs if len(self.profiles) == 0 else np.vstack([self.mat, vecs])
        self.profiles.extend(new)
        self._layout = None

    def update(self, p: Profile) -> bool:
        """Replace a stored profile (same id) and re-embed it."""
        i = next((k for k, x in enumerate(self.profiles) if x.id == p.id), None)
        if i is None:
            return False
        self.mat[i] = self.embedder.encode([profile_text(p)])[0]
        self.profiles[i] = p
        self._layout = None
        return True

    def get(self, pid: str) -> Profile | None:
        return next((p for p in self.profiles if p.id == pid), None)

    def remove(self, pid: str) -> bool:
        i = next((k for k, p in enumerate(self.profiles) if p.id == pid), None)
        if i is None:
            return False
        del self.profiles[i]
        self.mat = np.delete(self.mat, i, axis=0)
        self.feedback.pop(pid, None)
        for fb in self.feedback.values():
            fb["met"].discard(pid)
            fb["not_fit"].discard(pid)
        self._layout = None
        return True

    # ---- optional precomputed text (data/explanations.json)
    def _explanations(self) -> dict:
        try:
            mtime = EXPLANATIONS_FILE.stat().st_mtime
        except OSError:
            self._expl, self._expl_mtime = {}, None
            return self._expl
        if mtime != self._expl_mtime:
            try:
                self._expl = json.loads(EXPLANATIONS_FILE.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                self._expl = {}
            self._expl_mtime = mtime
        return self._expl

    # ---- room map
    def graph_layout(self) -> tuple[np.ndarray, np.ndarray]:
        if self._layout is None or self._layout[0] != len(self.profiles):
            xy, labels = layout(self.mat)
            self._layout = (len(self.profiles), xy, labels)
        return self._layout[1], self._layout[2]

    # ---- feedback
    def record_feedback(self, viewer_id: str, target_id: str, verdict: str) -> None:
        fb = self.feedback.setdefault(viewer_id, {"met": set(), "not_fit": set()})
        fb["met" if verdict == "met" else "not_fit"].add(target_id)
        if self.on_feedback:
            self.on_feedback()

    def _feedback_factor(self, viewer_id: str | None, idx: int) -> float:
        """0 for people already met or rejected, a soft penalty for people similar to rejected ones."""
        if not viewer_id or viewer_id not in self.feedback:
            return 1.0
        fb = self.feedback[viewer_id]
        pid = self.profiles[idx].id
        if pid in fb["met"] or pid in fb["not_fit"]:
            return 0.0
        factor = 1.0
        for rid in fb["not_fit"]:
            r = next((i for i, p in enumerate(self.profiles) if p.id == rid), None)
            if r is None:
                continue
            cos = float(np.dot(self.mat[idx], self.mat[r]))
            factor *= 1.0 - 0.35 * max(0.0, (cos - 0.55) / 0.45)
        return factor

    # ---- text
    def _texts(self, viewer: ProfileIn, other: Profile, lang: str, viewer_id: str | None, shared: list[str]) -> dict:
        g = texts.GOAL[lang]
        explanation = texts.FRAME[lang].format(my=g[viewer.goal], name=other.name, their=g[other.goal]) + (
            texts.SHARED[lang].format(tags=", ".join(shared)) if shared else ""
        )
        if viewer.goal == "hire" and other.goal == "find_job":
            has = [s for s in viewer.stack if s.lower() in {x.lower() for x in other.stack}]
            vacancy = viewer.wanted_role or viewer.role
            if has or not viewer.stack:
                explanation = texts.FITS_VACANCY[lang].format(name=other.name, role=vacancy)
                if has:
                    explanation += texts.HAS_SKILLS[lang].format(skills=", ".join(has))
            else:
                explanation = texts.SEEKS_JOB[lang].format(name=other.name, their_role=other.role, role=vacancy)
            if viewer.experience_years > 0 or other.experience_years > 0:
                explanation += texts.EXP_LINE[lang].format(
                    have=texts.years(lang, other.experience_years), need=viewer.experience_years
                )
        out = {
            "explanation": explanation,
            "you_give": self._offer(viewer, lang),
            "they_give": self._offer(other, lang),
            "icebreaker": (
                texts.ICEBREAKER[lang].format(first=other.name.split()[0], topic=shared[0])
                if shared
                else texts.ICEBREAKER_ROLE[lang].format(first=other.name.split()[0], role=other.role)
            ),
        }
        override = self._explanations().get(f"{viewer_id}|{other.id}", {}).get(lang) if viewer_id else None
        if isinstance(override, dict):
            for key in out:
                if isinstance(override.get(key), str) and override[key].strip():
                    out[key] = override[key]
        return out

    @staticmethod
    def _offer(p: ProfileIn, lang: str) -> str:
        if p.goal == "hire" and (p.wanted_role or "").strip():
            line = texts.VACANCY[lang].format(role=p.wanted_role.strip())
            if p.stack:
                line += " · " + ", ".join(p.stack[:4])
            if p.experience_years > 0:
                line += " · " + texts.FROM_YEARS[lang].format(n=p.experience_years)
            return line
        stack = ", ".join(p.stack[:3]) or p.role
        return texts.OFFER[lang][p.goal].format(stack=stack, years=texts.years(lang, p.experience_years))

    # ---- main entry
    def recommend(
        self,
        viewer: ProfileIn,
        lang: str = "ru",
        viewer_id: str | None = None,
        allowed_ids: set[str] | None = None,
    ) -> tuple[int, list[Match]]:
        """Top matches for `viewer`. `allowed_ids` limits candidates (for example one event's attendees)."""
        start = time.perf_counter()
        if not self.profiles:
            return 0, []
        vvec = self.embedder.encode([profile_text(viewer)])[0]
        vs = _subject(viewer, vvec)

        scored: list[tuple[float, int]] = []
        similar: list[tuple[float, int]] = []
        for i, p in enumerate(self.profiles):
            if viewer_id and p.id == viewer_id:
                continue
            if allowed_ids is not None and p.id not in allowed_ids:
                continue
            other = _subject(p, self.mat[i])
            fb = self._feedback_factor(viewer_id, i)
            s = score(vs, other) * fb
            if s > 0:
                scored.append((s, i))
            elif allowed_ids is not None and fb > 0:
                # Small live rooms rarely have enough reciprocal goals (everyone looks for a job):
                # keep the most similar people as a fallback so nobody gets an empty list.
                similar.append((similarity(vs, other) * SIMILAR_WEIGHT * fb, i))
        scored.sort(key=lambda x: x[0], reverse=True)
        picks = [(s, i, False) for s, i in scored[:TOP_N]]
        if len(picks) < TOP_N:
            similar.sort(key=lambda x: x[0], reverse=True)
            picks += [(s, i, True) for s, i in similar[: TOP_N - len(picks)]]

        matches: list[Match] = []
        mine = {t.lower(): t for t in (*viewer.stack, *viewer.interests)}
        for s, i, is_similar in picks:
            p = self.profiles[i]
            shared = [mine[t] for t in mine if t in {x.lower() for x in (*p.stack, *p.interests)}]
            text = self._texts(viewer, p, lang, viewer_id, shared)
            if is_similar:
                g = texts.GOAL[lang]
                text["explanation"] = texts.SIMILAR[lang].format(my=g[viewer.goal], name=p.name, their=g[p.goal]) + (
                    texts.SHARED[lang].format(tags=", ".join(shared)) if shared else ""
                )
            matches.append(
                Match(
                    profile=p, score=round(s, 3), shared_tags=shared, kind="similar" if is_similar else None, **text
                )
            )
        return int((time.perf_counter() - start) * 1000), matches
