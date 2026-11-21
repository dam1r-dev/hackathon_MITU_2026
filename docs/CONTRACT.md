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

- `wanted_role` (optional string, max 80): only for goal `hire`. Employers describe the vacancy, not themselves:
  `wanted_role` = who they need ("Junior frontend developer"), `stack` = required skills, `experience_years` = minimum
  experience required, `about` = about the vacancy, `role` = the employer's own title/company ("HR, Kaspi").
  Old profiles without it fall back to `role`. Matching embeds the vacancy for `hire`, and an employer scores a
  candidate lower when the candidate has less experience than required (factor `max(0.4, 1 - 0.2 * gap)`).
  Texts: a job seeker sees `they_give` = "Vacancy: <wanted_role> · <skills> · from N yr"; an employer sees
  "<name> fits your vacancy «<wanted_role>». Has: <matched skills>. Experience: <N>, you need from <M>."
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
Event  { "id": "e_1a2b3c4d", "code": "YYZGW3", "title": "Qazaq IT Meetup", "date": "2026-12-01", "start_time": "08:00", "end_time": "18:00", "venue": "Almaty",
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
| `GET /api/events/open` | Home page list of OPEN events, newest first: `[{ "code", "title", "date", "start_time", "end_time", "venue", "attendee_count" }]` (no organizer ids) |
| `GET /api/events/by-code/{code}/stats` | Goal statistics for the member "Room" tab: `{ "attendees", "by_goal": [{goal, count}] }`, no member data |
| `GET /api/events/by-code/{code}/locations` | Live venue counts `[{ "name", "count" }]` in the event's order; counts presence updated within the last 90 minutes |
| `GET /api/events/by-code/{code}/graph` | Room map for the projector. Same shape as `/api/graph`, only this event's attendees, `name` shortened to initials |
| `POST /api/events/by-code/{code}/join` | Join. Body `{ "profile": ProfileIn, "contact": "@handle", "lang": "ru" }`. Returns `{ "member_id", "token", "event", "took_ms", "matches" }`. With a valid `X-Member-Token` and no `profile` it adds the existing member (idempotent). |
| `POST /api/pin` `{ "pin": "123 456" }` | Join without a QR code: resolve the rotating 6-digit PIN shown on the projector. Spaces and other non-digits are ignored. Returns `{ "code" }` for the open event; `404 pin_invalid` otherwise. The current and the previous 5-minute window are accepted |

### Member (X-Member-Token)
| Method and path | Purpose |
|---|---|
| `GET /api/events/by-code/{code}/matches?lang=ru` | Top 5 among this event's attendees. Call again to refresh as people arrive |
| `POST /api/events/by-code/{code}/meet` `{ "target_id" }` | "Want to meet". Returns `{ "mutual": bool, "contact": "@handle" or null, "contact_verified": bool }`. Contact is shown only when both sides pressed it |
| `GET /api/events/by-code/{code}/mutual` | Everyone with mutual interest, with `contact` and `contact_verified` |
| `POST /api/events/by-code/{code}/location` `{ "location": str or null }` | "Where I am now". Must be an attendee (`403 not_in_event`) and the name must be in the event's `locations` (`422 unknown_location`); `null` clears. Returns `{ "location", "at" }` |
| `GET /api/me` | `{ profile, system_role, contact, contact_verified, events, locations }`. `locations` maps event id to own fresh `{ "location", "at" }` (absent when unknown or older than 90 min) |
| `PATCH /api/me` `{ "profile": ProfileIn, "contact": str or null }` | Edit own profile and contact (re-embedded, saved). Only members who joined at runtime (`403 profile_not_editable` for dataset profiles). `contact` omitted keeps it, empty string removes it. Returns the same shape as `GET /api/me` |
| `POST /api/feedback` | Same as before, add `"event_code"` to stay inside the event |

Event matches and join responses add optional `location` and `location_at` to each match (the matched person's venue location, only when fresh, under 90 minutes; otherwise `null`). `/api/recommend` and `/api/feedback` omit these fields.

Small events rarely have enough reciprocal goals (a room of students who all want a job). Inside an event, when fewer than 5 people pass the goal check, the list is filled with the most similar attendees regardless of goal: `score = similarity * 0.5` (always below real matches) and `kind: "similar"`; real matches have `kind: null`.
Default `locations` for new, seeded and older events: `["Актовый зал", "Буфет", "Сцена", "Балкон", "Вход"]`. Presence is stored in state as `presence[event_id][member_id] = { "location", "at" }`.

`contact` is never part of `Profile` and never appears in matches, lists or the map.

### Verified identity
Contact: when a member's Telegram is linked and the account has a username, the contact shown to mutual matches (meet, `/mutual`, bot messages, summaries) is `"@<telegram username>"` with `contact_verified: true`; otherwise the typed contact with `contact_verified: false`. `contact_verified` sits next to every `contact` field (default false).

| Route | Notes |
|---|---|
| `GET /api/tg/link` (member) | `{ enabled, linked, username, url }`. Every call issues a fresh one-time code (15 min) and drops the member's earlier unused codes. The bot consumes the code on `/start <code>`; unknown, used or expired codes get the "open the bot from the event page" reply. Stored: `tg_users[member] = { chat_id, username or null, first_name }`. One Telegram account belongs to one member, the newest link wins |
| `DELETE /api/tg/link` (member) | Unlink: removes chat and username. `204` |
| `POST /api/me/github/start` `{ "login" }` (member) | `{ "code": "qit-xxxxxx", "login" }`, pending 15 min. `422 bad_username` |
| `POST /api/me/github/verify` (member) | Fetches the GitHub bio (bypassing the prefill cache); stores the login as verified when the code is in it. `{ "github": login }`. `409 code_not_found`, `404 no_pending_check` (none or expired), plus the GitHub errors above |
| `DELETE /api/me/github` (member) | Removes the verified login. `204` |

`Profile` gets optional `github: string | null`: only a verified login, filled in event matches, attendees, `/mutual` and `/me`. The unverified prefill never appears.

### Admin and organizer
Organizer rights apply only to events where the member is listed in `organizer_ids`.

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/events` | admin, organizer (own events) | List events, newest first |
| `POST /api/events` | admin | Create. Body `{ "title", "date", "start_time"?, "end_time"?, "venue", "code"?, "organizer_ids"? }`. Code is generated when omitted (6 letters and digits) |
| `PATCH /api/events/{event_id}` | admin, organizer | Change `title`, `date`, `start_time`, `end_time` (`"HH:MM"` 24h, Almaty time UTC+5, or `null` to clear; bad format or end not after start gives `422 bad_time`; old events have `null`), `venue`, `status`, `locations` (1 to 12 unique non-empty names, max 40 chars each, else 422). `organizer_ids` only by admin |
| `DELETE /api/events/{event_id}` | admin | Delete the event (members stay) |
| `GET /api/events/{event_id}/attendees` | admin, organizer | `Attendee[]` |
| `POST /api/events/{event_id}/attendees` | admin, organizer | Add `{ "member_id" }` or create `{ "profile": ProfileIn }` |
| `DELETE /api/events/{event_id}/attendees/{member_id}` | admin, organizer | Remove from the event |
| `GET /api/events/{event_id}/stats` | admin, organizer | `{ "attendees", "by_goal": [{goal, count}], "hints": [{code, scarce, plenty, scarce_count, plenty_count}] }`. A hint `scarce_supply` means for example 3 hirers for 40 job seekers |
| `GET /api/events/by-code/{code}/pin` | admin, organizer | `{ "pin": "123456", "expires_in": 187 }`: the current rotating join PIN for the projector (changes every 5 minutes, `expires_in` is seconds left). Shown on the screen page next to the QR code; people type it at `/pin` (route `#/pin`) |
| `GET /api/members` | admin | All members with `events` (ids) |
| `PATCH /api/members/{member_id}/role` `{ "role" }` | admin | Set `admin`, `organizer` or `member` |
| `DELETE /api/members/{member_id}` | admin | Remove the member everywhere |
| `POST /api/events/{event_id}/telegram-summary` | admin, organizer | Send every Telegram-linked attendee a personal results message in their profile language: people met (mutual pairs plus done meetings, deduped, up to 10 listed), contacts only for mutual pairs, "met at <location>" for done meetings, a thank-you; attendees with nothing get a friendly "no matches this time" line. Returns `{ "sent": n, "linked": m }`. `409 telegram_off` when the bot is off |

### Pre-event forecast (admin, organizer)
`GET /api/events/{event_id}/forecast`: who has registered so far and what the organizer should do before the event. Pure counting over attendees (no LLM, no per-request embeddings), so it answers in milliseconds. `403` for members, `401` without a token.
```json
{
  "attendees": 42,
  "by_goal": [{ "goal": "find_job", "count": 18 }],
  "stacks": [{ "name": "Python", "count": 14 }],
  "roles": [{ "name": "backend", "count": 11 }],
  "levels": [{ "name": "junior", "count": 20 }],
  "langs": [{ "name": "ru", "count": 25 }],
  "pairs": { "with_pair": 37, "without_pair": 5, "without_by_goal": [{ "goal": "find_mentor", "count": 5 }] },
  "tips": [{ "code": "stack_gap", "params": { "stack": "Python", "seekers": 9, "hirers": 1 } }]
}
```
- `stacks`: top 8 stack tags; `roles`: role family by keywords in `role` (`backend`, `frontend`, `mobile`, `data`, `devops`, `design`, `product`, `qa`, `security`, `management`, `other`); `levels` by `experience_years`: `junior` < 2, `middle` 2–4, `senior` 5–9, `lead` 10+. `stacks`, `roles`, `langs` are sorted by count; `levels` go junior to lead; zero counts are omitted (`by_goal` keeps all 6 goals).
- `pairs.with_pair`: attendees who have at least one other attendee with the reciprocal goal (job seeker and hirer, mentee and mentor, cofounder and cofounder, exchange and exchange).
- `tips[].code`, rendered by the UI in kk/ru/en:
  - `scarce_supply` `{scarce, plenty, scarce_count, plenty_count}`: same rule as `stats.hints`.
  - `stack_gap` `{stack, seekers, hirers}`: at least 4 job seekers with this stack and hirers asking for it are at most a quarter of them.
  - `stack_cluster` `{stack, count, share}`: one stack covers at least 25 % of a room of 8+; suggest a table or zone for it.
  - `mostly_junior` `{share}`: at least half the room has under 2 years of experience.
  - `no_pair` `{count, goal}`: attendees with nobody of the reciprocal goal; `goal` is the most common such goal.
  - `cofounder_thin` `{count}`: only 1–2 people look for a cofounder.
  - `few_registered` `{count}`: fewer than 10 registrations.

The organizer report (`GET /api/events/{event_id}/report`) also carries `"telegram": { "on": bool, "linked": int }` (bot enabled, attendees linked to it) so the admin UI can enable the "Send results to Telegram" button.

### GitHub prefill (public)
`GET /api/github/{username}` fills a profile from a public GitHub account. Username must match `^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$` (else `422 bad_username`). Returns
`{ "login", "name" (login when empty), "about" (bio or ""), "stack": top 6 languages by non-fork repo count, "interests": up to 5 most frequent repo topics, "experience_years": account age in years (0..20), "avatar_url", "repos": public_repos }`.
Errors: `404 github_not_found`, `503 github_rate_limited` (GitHub 403/429), `503 github_unavailable` (network, timeout 6 s). Successful results are cached in memory for 10 minutes. The form hides this row for goal `hire`.

### Seed events (optional, `data/events.json`)
Read once, on the first start with no saved state. A list (or `{ "events": [...] }`) of
`{ "title", "date"?, "start_time"?, "end_time"?, "venue"?, "code"?, "status"?, "attendees": ["p_001", ...] or "all" }`.
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
