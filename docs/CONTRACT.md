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
Request: `{ "profile": Profile (without id), "lang": "kk|ru|en", "viewer_id": "p_101" }`

`viewer_id` is optional. Pass the id returned by `POST /api/profiles` so the viewer never sees themselves and feedback (met / not a fit) is applied.

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
`x`, `y` are in `[0.05, 0.95]` (2D projection of the profile embeddings, similar people sit close). `cluster` is an interest cluster (0..5), not the goal.

### POST /api/feedback
Body: `{ "viewer_id": "p_101", "target_id": "p_007", "verdict": "met|not_fit" }`.
Returns a fresh `matches` array (same shape as /recommend) with the new ranking.

## Events, members, roles and access

Product flow: an admin creates an event, people scan its QR code, fill in the profile and see their top 5 **among that event's attendees**.

### Access (kept simple on purpose)
| Who | How | Header |
|---|---|---|
| Admin | `POST /api/admin/login {"code": ADMIN_CODE}` returns `{"token"}`. Admin tokens live in memory, sign in again after a backend restart. A member with role `admin` is an admin too. | `X-Admin-Token` |
| Member | Joining an event returns `token`. It survives restarts. Keep it in `localStorage`. | `X-Member-Token` |
| Organizer | A member with role `organizer` who is listed in the event's `organizer_ids`. Manages only that event. | `X-Member-Token` |

Errors: `401` no or unknown token, `403` signed in but not allowed. Body is `{"detail": "<code>"}`, for example `sign_in_required`, `forbidden`, `event_closed`, `code_taken`, `not_in_event`.

### Types
```json
Event  { "id": "e_1a2b3c4d", "code": "YYZGW3", "title": "Qazaq IT Meetup", "date": "2026-12-01", "venue": "Almaty",
         "status": "open|closed", "organizer_ids": ["m_..."], "created_at": "ISO", "attendee_count": 42,
         "locations": ["Актовый зал", "Буфет", "Сцена", "Балкон", "Вход"],
         "join_path": "/#/join/YYZGW3", "join_url": "http://<PUBLIC_URL>/#/join/YYZGW3" }
SystemRole = "admin" | "organizer" | "member"
Attendee { "profile": Profile, "system_role": SystemRole }
```
The frontend uses hash routing, so the join page is the route `#/join/<code>` (full link `http://<host>/#/join/<code>`). It calls `GET /api/events/by-code/<code>`, then shows the 60-second profile form, then `POST .../join`.
`join_url` is built from the `PUBLIC_URL` env var. Set it to the machine's LAN address so phones can open the QR code.

### Public (no token)
| Method and path | Purpose |
|---|---|
| `GET /api/events/by-code/{code}` | Event info for the landing page |
| `GET /api/events/by-code/{code}/qr.svg` | QR code image (SVG) of `join_url` |
| `GET /api/events/open` | Home page list of OPEN events, newest first: `[{ "code", "title", "date", "venue", "attendee_count" }]` (no organizer ids) |
| `GET /api/events/by-code/{code}/stats` | Goal statistics for the member "Room" tab: `{ "attendees", "by_goal": [{goal, count}] }`, no member data |
| `GET /api/events/by-code/{code}/locations` | Live venue counts `[{ "name", "count" }]` in the event's order; counts presence updated within the last 90 minutes |
| `GET /api/events/by-code/{code}/graph` | Room map for the projector. Same shape as `/api/graph`, only this event's attendees, `name` shortened to initials |
| `POST /api/events/by-code/{code}/join` | Join. Body `{ "profile": ProfileIn, "contact": "@handle", "lang": "ru" }`. Returns `{ "member_id", "token", "event", "took_ms", "matches" }`. With a valid `X-Member-Token` and no `profile` it adds the existing member (idempotent). |
| `POST /api/pin` `{ "pin": "123 456" }` | Join without a QR code: resolve the rotating 6-digit PIN shown on the projector. Spaces and other non-digits are ignored. Returns `{ "code" }` for the open event; `404 pin_invalid` otherwise. The current and the previous 5-minute window are accepted |

### Member (X-Member-Token)
| Method and path | Purpose |
|---|---|
| `GET /api/events/by-code/{code}/matches?lang=ru` | Top 5 among this event's attendees. Call again to refresh as people arrive |
| `POST /api/events/by-code/{code}/meet` `{ "target_id" }` | "Want to meet". Returns `{ "mutual": bool, "contact": "@handle" or null }`. Contact is shown only when both sides pressed it |
| `GET /api/events/by-code/{code}/mutual` | Everyone with mutual interest, with contacts |
| `POST /api/events/by-code/{code}/location` `{ "location": str or null }` | "Where I am now". Must be an attendee (`403 not_in_event`) and the name must be in the event's `locations` (`422 unknown_location`); `null` clears. Returns `{ "location", "at" }` |
| `GET /api/me` | `{ profile, system_role, contact, events, locations }`. `locations` maps event id to own fresh `{ "location", "at" }` (absent when unknown or older than 90 min) |
| `PATCH /api/me` `{ "profile": ProfileIn, "contact": str or null }` | Edit own profile and contact (re-embedded, saved). Only members who joined at runtime (`403 profile_not_editable` for dataset profiles). `contact` omitted keeps it, empty string removes it. Returns the same shape as `GET /api/me` |
| `POST /api/feedback` | Same as before, add `"event_code"` to stay inside the event |

Event matches and join responses add optional `location` and `location_at` to each match (the matched person's venue location, only when fresh, under 90 minutes; otherwise `null`). `/api/recommend` and `/api/feedback` omit these fields.
Default `locations` for new, seeded and older events: `["Актовый зал", "Буфет", "Сцена", "Балкон", "Вход"]`. Presence is stored in state as `presence[event_id][member_id] = { "location", "at" }`.

`contact` is never part of `Profile` and never appears in matches, lists or the map.

### Admin and organizer
Organizer rights apply only to events where the member is listed in `organizer_ids`.

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/events` | admin, organizer (own events) | List events, newest first |
| `POST /api/events` | admin | Create. Body `{ "title", "date", "venue", "code"?, "organizer_ids"? }`. Code is generated when omitted (6 letters and digits) |
| `PATCH /api/events/{event_id}` | admin, organizer | Change `title`, `date`, `venue`, `status`, `locations` (1 to 12 unique non-empty names, max 40 chars each, else 422). `organizer_ids` only by admin |
| `DELETE /api/events/{event_id}` | admin | Delete the event (members stay) |
| `GET /api/events/{event_id}/attendees` | admin, organizer | `Attendee[]` |
| `POST /api/events/{event_id}/attendees` | admin, organizer | Add `{ "member_id" }` or create `{ "profile": ProfileIn }` |
| `DELETE /api/events/{event_id}/attendees/{member_id}` | admin, organizer | Remove from the event |
| `GET /api/events/{event_id}/stats` | admin, organizer | `{ "attendees", "by_goal": [{goal, count}], "hints": [{code, scarce, plenty, scarce_count, plenty_count}] }`. A hint `scarce_supply` means for example 3 hirers for 40 job seekers |
| `GET /api/events/by-code/{code}/pin` | admin, organizer | `{ "pin": "123456", "expires_in": 187 }`: the current rotating join PIN for the projector (changes every 5 minutes, `expires_in` is seconds left). Shown on the screen page next to the QR code; people type it at `/pin` (route `#/pin`) |
| `GET /api/members` | admin | All members with `events` (ids) |
| `PATCH /api/members/{member_id}/role` `{ "role" }` | admin | Set `admin`, `organizer` or `member` |
| `DELETE /api/members/{member_id}` | admin | Remove the member everywhere |

### Seed events (optional, `data/events.json`)
Read once, on the first start with no saved state. A list (or `{ "events": [...] }`) of
`{ "title", "date"?, "venue"?, "code"?, "status"?, "attendees": ["p_001", ...] or "all" }`.
Without the file the backend creates one event with code `DEMO` containing every profile.

### Persistence
Events, attendees, roles, tokens, contacts, feedback and runtime profiles are saved to `.state/state.json` (git-ignored, override with `STATE_FILE`). Delete the file to reset.

## Precomputed explanations (optional, `data/explanations.json`)

By default the backend builds `explanation`, `you_give`, `they_give` and `icebreaker` from templates (instant, kk/ru/en). For pairs where a better LLM text exists, put it here; it overrides the template for that field. Key is `"<viewer_id>|<target_id>"`:

```json
{
  "p_001|p_009": {
    "en": { "explanation": "...", "you_give": "...", "they_give": "...", "icebreaker": "..." },
    "ru": { "explanation": "..." }
  }
}
```
Any field or language may be missing. The file is re-read automatically when it changes.

## Scoring rule (two-sided)

`score(A,B) = sqrt( fit(A->B) * fit(B->A) )`

- `fit(A->B)` is 0 if B's goal is not in the reciprocity row for A. Otherwise `(0.05 + 0.95 * base) * goal_factor`, where `base = 0.55 * embedding_similarity + 0.3 * stack_overlap + 0.15 * interest_overlap` (overlap = shared items / size of the smaller set).
- `goal_factor`: mentor pairs need the mentor to have more experience (gap 3+ years gives 1.0, no gap gives 0.35); co-founders score higher with different stacks; other goals use 1.
- Embeddings: multilingual MiniLM through fastembed, so kk/ru/en profiles are comparable. Falls back to hashing vectors offline (same language only).
- This is the core idea: complementary, not similar.
