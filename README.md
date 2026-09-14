# Learnzzy — Play. Think. Learn.

A deterministic, fast, and safe educational kids playground (PWA) with an
asynchronous AI/agent workforce operating behind the scenes.

> Child experience: deterministic, fast, simple, safe, delightful.
> Intelligence (AI, personalization, educational knowledge, agents) stays
> server-side and never blocks gameplay.

## Games

1. **Number Adventure** — addition through pictures
2. **Fly Away** — subtraction by counting what remains
3. **Clean Up** — spot-and-clean scenes
4. **Picture Puzzle** — drag/tap spatial puzzles
5. **Shadow Sketch** — tracing with forgiving evaluation

## Stack

Next.js 14 + TypeScript + Phaser 3 + Tailwind CSS · MongoDB · Redis + BullMQ ·
Zod · GPT-5 nano/mini behind an AI abstraction · Docker + Nginx · Playwright

## Quick start (Windows)

Double-click `run.bat` (menu), or:

```bat
run.bat dev      :: dev server → http://localhost:3000
run.bat prod     :: production build + start
run.bat docker   :: full stack (web + worker + mongo + redis)
run.bat seed     :: seed MongoDB content pools
```

MongoDB/Redis run in Docker (`mongodb://mongo:27017`, `redis://redis:6379`
inside containers; host dev uses mapped `127.0.0.1` ports — see `.env.example`).

## Key routes

- `/` landing · `/welcome` learner setup · `/play` game home · `/play/*` games
- `/stickers` collection · `/link` parent-device pairing
- `/parents/*` public parent info · `/parent/*` parent dashboard (auth)
- `/admin` command center (auth) · `/api/health`, `/health`

## Architecture highlights

- **Deterministic game engine** — math recomputed and re-validated; browser
  is never authoritative for score, rewards, or progression.
- **Validated content pools** — only `active` content is playable; low pools
  refill asynchronously via agents.
- **Adaptive learning** — anonymous learner profiles (nickname + age band),
  15 level configs, server-side promotion (3+ completions at 80%+, max +1
  level), stars/stickers, validated learning plans.
- **Education Gateway** (`src/integrations/education/`) — allowlisted
  Tutor/OER/NCERT providers, all disabled by default with deterministic
  mocks; advisory-only (plans never reordered, levels/scores untouched).
- **7 agents** — content, quality/safety, asset, analytics, difficulty,
  personalization, QA — least-privilege, retried, audited.
- **Parents** — separate auth, single-use expiring pairing codes, active-link
  authorization, validated summaries only.

## Verify

```bash
npm run typecheck
npm run lint
npm test          # 87 unit tests
npm run test:e2e  # 52 Playwright specs (uses system Chrome)
npm run build
```

## Docs

`docs/` is the source of truth: `PROJECT.md`, `ARCHITECTURE.md`,
`BUSINESS_RULES.md`, `DATABASE.md`, `API.md`, `DECISIONS.md`,
`MCP_INTEGRATION.md`, `STITCH_INSTRUCTIONS.md`, `NEXT_SESSION.md`.
Stitch designs are the visual reference; docs govern architecture.

## Environment

Copy `.env.example` to `.env.local`. Secrets stay server-side
(`never NEXT_PUBLIC_*`). Generate admin credentials with:

```bash
node scripts/admin-setup.mjs <password-min-12-chars>
```
