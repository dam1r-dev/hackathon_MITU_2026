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

## Git workflow (important for Claude)
- **Never run `git commit`, `git push`, `git merge`, `git rebase`, or `git reset`.** The human commits and pushes themselves.
- When a piece of work is done and verified, stop and hand over: list the changed files and give a one-line commit message suggestion. In the Claude desktop app, finish the turn with the commit action button (`wrap_up` with the `commit` action) so the human can click it.
- If the human uses the CLI, give them copy-paste commands in separate blocks: `git add <files>`, `git commit -m "..."`, `git push`.
- You may run read-only git commands (`git status`, `git diff`, `git log`) and create/switch to your own branch only when the human asks.
- Keep commits small: one feature or fix per commit. Do not stage `.env`, `node_modules`, `dist`, or `.venv`.
- Before handing over, `git pull --rebase` is done by the human, not you. If you see conflicts in `git status`, tell the human which files and stop.

## How to work
1. Read `docs/CONTRACT.md` and the files in your zone before changing anything. Do not touch files outside your zone (see `docs/TEAM.md`). If you need a contract change, propose it to the human instead of editing the contract silently.
2. Make the smallest change that works, then verify it: run the backend/frontend, call the endpoint, or check the page in the browser. Say what you verified and what you did not.
3. Do not add dependencies without saying so. Do not rewrite working code for style.
4. Be economical with tokens: read only the parts of files you need, no subagents for small tasks, short answers.
5. The 5 hard requirements above always win over polish. Never break them for a nice-to-have.

## Quality bar
- **Backend:** keep `/api/recommend` under 3 seconds. Precompute embeddings and LLM texts at startup or in scripts, not per request. Match the response shape in the contract exactly. Add a small test for any scoring change (a job seeker must never get other job seekers).
- **Frontend:** mobile-first, readable at 375px width, no horizontal scroll. Use only the tokens in `frontend/src/styles/tokens.css` (no hard-coded colors). Every screen needs loading, empty, and error states. All texts come from `frontend/src/i18n.ts` in kk/ru/en. Check contrast and keyboard focus. Use the `frontend-design` and `ui-ux-pro-max` skills for design decisions.
- **Data:** synthetic and diverse (all 6 goals, varied roles, stacks, experience, kk/ru/en bios). Fictional names only.

## Layout
- `backend/` matching service (FastAPI)
- `frontend/` web app (mobile-first)
- `data/` `profiles.json`, generation scripts
- `docs/` contract, pitch notes
