# Project rules (read first)

AI-powered meetup networking for the Qazaq IT Community case, AI in Engineering Hackathon 2026.
Idea: match people by mutual usefulness (complementary goals), not by similarity. See `docs/CONTRACT.md`.

## Hard requirements (without all of them no prizes)
1. Profile form: role, stack, experience, interests, about text, goal (6 goals).
2. Top 5 recommendations, each with a 1-2 sentence explanation.
3. Goal reciprocity (job seekers see hirers, not other job seekers).
4. Working UI (web page).
5. 100+ synthetic profiles made by us. Real profiles and scraping LinkedIn/Telegram are forbidden.

Answer for one participant must take under 3 seconds. Runs locally via `docker compose up`.

## Working rules
- `docs/CONTRACT.md` is the source of truth. Change it first, then code.
- Own branch per person. Small commits, merge to `main` often.
- Never commit `.env`, API keys, or model caches. Keys go in `.env` (see `.env.example`).
- Heavy LLM jobs (dataset, explanations) run once and the result is committed as JSON.
- Precompute embeddings. Do not call an LLM on the request path unless cached.
- Keep UI texts in one place so `kk`/`ru`/`en` can be switched.

## Layout
- `backend/` matching service (FastAPI)
- `frontend/` web app (mobile-first)
- `data/` `profiles.json`, generation scripts
- `docs/` contract, pitch notes
