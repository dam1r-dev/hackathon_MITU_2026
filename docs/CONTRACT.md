# Contract (source of truth for backend and frontend)

Change this file first, then the code. Both sides build against it.

## Goals (enum `goal`)

`find_job` | `hire` | `find_mentor` | `be_mentor` | `find_cofounder` | `exchange_experience`

Reciprocity (who should be shown to whom):

| my goal | wants to meet people whose goal is |
|---|---|
| find_job | hire |
| hire | find_job |
| find_mentor | be_mentor |
| be_mentor | find_mentor |
| find_cofounder | find_cofounder |
| exchange_experience | exchange_experience |

## Profile

```json
{
  "id": "p_001",
  "name": "Aidos Nurlanov",
  "role": "Backend developer",
  "stack": ["Python", "FastAPI", "PostgreSQL"],
  "experience_years": 3,
  "interests": ["LLM agents", "fintech"],
  "about": "Free text, 1-3 sentences.",
  "goal": "find_job",
  "lang": "ru"
}
```

- `lang`: `kk` | `ru` | `en`. All names are fictional. No real people.
- Dataset file: `data/profiles.json` (array of Profile). Minimum 100 profiles.

## API (base `/api`)

### POST /api/recommend
Request: `{ "profile": Profile (without id), "lang": "kk|ru|en" }`

Response:
```json
{
  "took_ms": 420,
  "matches": [
    {
      "profile": { "...Profile": "..." },
      "score": 0.87,
      "shared_tags": ["LLM agents", "Python"],
      "you_give": "Backend experience for their data pipeline.",
      "they_give": "A hiring slot for a junior backend role.",
      "explanation": "1-2 sentences: why you two should meet.",
      "icebreaker": "One opening line for the first conversation."
    }
  ]
}
```
Exactly 5 matches, sorted by `score` descending. Must answer in under 3 seconds.

### POST /api/profiles
Add a profile (used by the QR flow). Body: Profile without id. Returns `{ "id": "p_101" }`.

### GET /api/graph
Data for the room map: `{ "nodes": [{ "id", "name", "goal", "cluster", "x", "y" }], "edges": [{ "from", "to", "score" }] }`.
Edges are optional, only for the current viewer if `?viewer=<id>` is passed.

### POST /api/feedback
Body: `{ "viewer_id": "p_101", "target_id": "p_007", "verdict": "met|not_fit" }`.
Returns a fresh `matches` array (same shape as /recommend) with the new ranking.

## Scoring rule (two-sided)

`score(A,B) = sqrt( fit(A->B) * fit(B->A) )`

- `fit(A->B)` is 0 if B's goal is not in the reciprocity row for A, else semantic closeness of A's need to B's offer (embeddings), adjusted by experience gap for mentor pairs.
- This is the core idea: complementary, not similar.
