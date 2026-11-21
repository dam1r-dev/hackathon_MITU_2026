"""Precompute LLM texts for top-5 pairs into data/explanations.json.

For every dataset profile we run the real matcher (backend.app.matching.Index), take its
top 5, and ask Claude once per viewer for `explanation`, `you_give`, `they_give` and
`icebreaker` in kk / ru / en. The backend reads the file and overrides its template text
for those pairs (see docs/CONTRACT.md, "Precomputed explanations"). No LLM on the request path.

Run once from the repo root, then commit data/explanations.json:

    pip install -r backend/scripts/requirements.txt
    python -m backend.scripts.precompute_explanations --dry-run      # only print the pairs
    python -m backend.scripts.precompute_explanations --limit 5      # try 5 viewers first
    python -m backend.scripts.precompute_explanations                # everything

The key is read from ANTHROPIC_API_KEY (or .env). Already computed pairs are skipped, so
the script can be stopped and restarted. Use the same EMBEDDER as the backend
(EMBEDDER=hashing for a quick offline run), otherwise the top 5 may differ.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.embeddings import Embedder  # noqa: E402
from backend.app.matching import Index  # noqa: E402
from backend.app.models import Profile, ProfileIn  # noqa: E402

PROFILES = ROOT / "data" / "profiles.json"
OUT = ROOT / "data" / "explanations.json"
MODEL = os.getenv("EXPLAIN_MODEL", "claude-opus-5-5")
LANGS = ("kk", "ru", "en")
FIELDS = ("explanation", "you_give", "they_give", "icebreaker")

GOALS_EN = {
    "find_job": "find a job",
    "hire": "hire",
    "find_mentor": "find a mentor",
    "be_mentor": "mentor someone",
    "find_cofounder": "find a co-founder",
    "exchange_experience": "exchange experience",
}

SYSTEM = """You write short networking texts for a tech meetup app in Kazakhstan.
For a viewer and each of their recommended matches, write in Kazakh (kk), Russian (ru) and English (en):
- explanation: 1-2 sentences, why these two should meet. Be concrete: name the goal fit and one or two shared or complementary skills.
- you_give: under 12 words, what the viewer brings to the other person.
- they_give: under 12 words, what the other person brings to the viewer.
- icebreaker: one friendly opening line the viewer can say, addressing the other person by first name.
Address the viewer as "you" (ru: "вы", kk: "сіз"). Use only facts from the profiles, invent nothing.
Keep tech names (Python, React, ...) in Latin script. Write natural, simple Kazakh."""

_lang_obj = {
    "type": "object",
    "properties": {f: {"type": "string"} for f in FIELDS},
    "required": list(FIELDS),
    "additionalProperties": False,
}
SCHEMA = {
    "type": "object",
    "properties": {
        "matches": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"target_id": {"type": "string"}, **{lang: _lang_obj for lang in LANGS}},
                "required": ["target_id", *LANGS],
                "additionalProperties": False,
            },
        }
    },
    "required": ["matches"],
    "additionalProperties": False,
}


def _load_env() -> None:
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            if v.strip() and not os.getenv(k.strip()):
                os.environ[k.strip()] = v.strip()


def _card(p: Profile) -> dict:
    d = p.model_dump()
    d["goal"] = GOALS_EN[p.goal]
    d.pop("lang", None)
    return d


def top_pairs(limit: int | None) -> list[tuple[Profile, list[Profile]]]:
    """[(viewer, [5 matched profiles])] using the same matcher as the backend."""
    profiles = [Profile(**p) for p in json.loads(PROFILES.read_text(encoding="utf-8"))]
    idx = Index(Embedder())
    print(f"embedder: {idx.embedder.kind}", file=sys.stderr)
    idx.add_many(profiles)
    out = []
    for p in profiles[:limit] if limit else profiles:
        _, matches = idx.recommend(ProfileIn(**p.model_dump(exclude={"id"})), lang=p.lang, viewer_id=p.id)
        out.append((p, [m.profile for m in matches]))
    return out


def ask_claude(client, viewer: Profile, others: list[Profile]) -> dict:
    """One request per viewer. Returns {target_id: {lang: {field: text}}}."""
    prompt = json.dumps(
        {"viewer": _card(viewer), "matches": [_card(o) for o in others]}, ensure_ascii=False, indent=1
    )
    resp = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    if resp.stop_reason != "end_turn":
        raise RuntimeError(f"stop_reason={resp.stop_reason}")
    text = next(b.text for b in resp.content if b.type == "text")
    wanted = {o.id for o in others}
    result = {}
    for m in json.loads(text)["matches"]:
        if m["target_id"] in wanted:
            result[m["target_id"]] = {lang: {f: m[lang][f].strip() for f in FIELDS} for lang in LANGS}
    return result


def save(data: dict) -> None:
    tmp = OUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(tmp, OUT)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="only the first N viewers")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true", help="print the pairs, call nothing")
    args = ap.parse_args()

    pairs = top_pairs(args.limit)
    data: dict = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    todo = [(v, os_) for v, os_ in pairs if any(f"{v.id}|{o.id}" not in data for o in os_)]
    print(f"{len(pairs)} viewers, {len(todo)} still need text", file=sys.stderr)

    if args.dry_run:
        for v, os_ in pairs:
            print(v.id, v.goal, "->", ", ".join(f"{o.id}({o.goal})" for o in os_))
        return
    if not todo:
        return

    _load_env()
    import anthropic  # only needed for the real run

    client = anthropic.Anthropic()
    lock = threading.Lock()
    failed = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(ask_claude, client, v, os_): v for v, os_ in todo}
        for n, fut in enumerate(as_completed(futures), 1):
            v = futures[fut]
            try:
                res = fut.result()
            except anthropic.AuthenticationError:
                sys.exit("ANTHROPIC_API_KEY is missing or invalid (put it in .env)")
            except (anthropic.APIError, RuntimeError, ValueError, KeyError) as exc:
                failed += 1
                print(f"[{n}/{len(todo)}] {v.id} failed: {exc}", file=sys.stderr)
                continue
            with lock:
                for tid, texts in res.items():
                    data[f"{v.id}|{tid}"] = texts
                save(data)
            print(f"[{n}/{len(todo)}] {v.id}: {len(res)} pairs", file=sys.stderr)
    print(f"done: {len(data)} pairs in {OUT}, {failed} viewers failed (re-run to retry)", file=sys.stderr)


if __name__ == "__main__":
    main()
