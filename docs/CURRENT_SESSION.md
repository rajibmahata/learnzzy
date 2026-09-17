# CURRENT SESSION: Learnzzy

**Date:** 2026-09-13
**Focus:** Agent workforce, admin operations, deployment hardening
**Owner:** OpenCode

## Stitch UI Validation — 2026-09-15

The hosted artifacts for Stitch project `1495487808742926612` were downloaded to
`docs/stitch_learnzzy_educational_kids_playground/` and used to validate the
Playful Wonder design system. The child home, learner setup, addition,
subtraction, parent journey, and admin command-center references are now
represented by shared Learnzzy tokens, tactile controls, responsive cards,
quest progress, and safe-area navigation in the existing routes.

The Content Agent Inspector and Agent Fleet references remain visual reference
artifacts only because the current application exposes one authenticated
`/admin` command center rather than separate admin detail routes. No fake logs,
counts, or agent detail pages were added.

## Objective
Complete the MVP background workforce and the first usable admin command center without making the child path dependent on AI or infrastructure.

## Tasks

- [x] Register five least-privilege agents and persist task/run/event lifecycle.
- [x] Add BullMQ/Redis queue with in-process retrying fallback.
- [x] Add deterministic content generation with AI assist and validation gates.
- [x] Add pool monitoring, idempotent refill, and gameplay-safe refill triggers.
- [x] Add admin auth, rate limiting, protected APIs, dashboard, approvals, analytics, and health.
- [x] Add Docker Compose, Nginx, headers, and environment examples.
- [x] Pass lint, typecheck, test, and production build.

## Decisions
- Child APIs only serve `status: "active"` content; low pools refill asynchronously.
- Admin auth uses an env-configured scrypt password hash and signed, HttpOnly cookie session.
- Redis is durable when configured; local development executes the same handlers in-process.

## Gap closure — 2026-09-16
- White canvas: Phaser boot now tolerates UMD interop (`default ?? namespace`),
  clears stale StrictMode canvases, falls back from `ready` after 4s, loads SVG
  via `load.svg` with explicit size, and every stage renders a DOM emoji
  fallback so containers never sit empty-white. `getDb` fails fast (2–3s),
  `fetchPool` aborts after 8s, and learner setup aborts after 10s with a
  connection error instead of hanging on `Preparing...`.
- Browser-answer exposure: `/api/games/[gameId]/content` no longer sends
  `correctAnswer`; pool validators recompute from `question` and treat a
  present value as an integrity check only.
- Admin: command input posts to `/api/admin/commands` with history, plus
  content review (approve/disable + version inspection).
- Stitch: expired `parent-journey.png` (HTTP 400) removed; only
  `parent-journey.html` kept until the URL is re-fetched.
- Verified 2026-09-16: typecheck ✅, lint ✅, unit 106/106 ✅,
  `next build` 74/74 ✅, Playwright `canvas.spec` 5/5 ✅ and
  `child.spec` 6/6 ✅ on mobile-320 (welcome + addition flows that
  previously hung now pass via fail-fast fallbacks).

## removeChild crash — true root cause + redeploy (2026-09-16)
- Pasted `NotFoundError: removeChild` came from the stage container clear in
  `usePhaserGame` (`while (firstChild) removeChild`) deleting React-managed
  DOM fallback nodes; React's later unmount commit then threw and the route
  ErrorBoundary tripped. Fixed: remove only Phaser `canvas` elements.
- Defense in depth: scene API (`apiRef`) is now exposed only after the engine
  `ready` event; stages gate `showGroups/showScene/...` on a new `booted`
  flag while the 4s timer only resolves UI readiness. Prevents calling scene
  methods on an unbooted scene (tweens undefined → effect throw).
- Environmental trap: `learnzzy-web-1` was squatting host :3000 with a stale
  image, so probes/e2e tested the container instead of local code until the
  image was rebuilt from fixed source and `web` recreated (mongo/redis +
  volumes untouched). Lesson: check `docker ps`/port owners whenever served
  content contradicts disk.
- Re-verified against the redeployed stack: `canvas.spec` 5/5 ✅,
  `child.spec` 6/6 ✅ (mobile-320).

## Sketch visual-learning enhancement (2026-09-16)
- Assessment: `SKETCH_CONTENT_ASSESSMENT.md`; implementation report:
  `SKETCH_CONTENT_IMPLEMENTATION.md`.
- 23 leveled sketch activities (shapes→objects→combos→patterns→scenes) with
  task types (`trace|dots|pattern`), instructions, and hints; 69 active pool
  docs / 23 shapes; 30 legacy ID-only-duplicate docs deleted.
- Hint UI (`[? Hint]` + dialog) on Sketch/Addition/Subtraction; `hint_used`
  events now emitted; math copy derives deterministically from operands.
- Verified: unit 115/115 ✅; e2e mobile-320 canvas 5/5, child 8/8, sketch
  2/2 ✅ against the redeployed compose stack (seeded via host :27018).

## Adaptive per-skill engine (2026-09-16)
- New `src/lib/skillLevels.ts` (dependency-free): rolling last-5 evaluation,
  promote (3+ @80%+, +1 max), stabilize-first, reduce after repeated weakness
  (−1, floor 1). One skill never touches another; global level stays the
  journey/unlock authority (DEC-182).
- Learner model extended (no new collections): `gameLevels`, `lastResult`
  projection, `recentAccuracy[]` + `hintsUsed` on gameProgress;
  `recordGameResult` writes one structured result per completion; history
  stays append-only in gameEvents.
- Progress API accepts hintsUsed/durationMs and returns global promotion +
  skill adjustment; content API serves per-skill complexity + `skillLevel`;
  new `GET /api/learners/[learnerId]/skills`; parent progress/ChildSummary
  gained skill levels, trends, strengths/practice lines, and latest result;
  parent Progress page renders skill + latest-result cards; plays report
  hints/duration; skill promotions emit `level_unlocked` events.
- Deployment fix found by e2e: compose `.env` lacked auth secrets so all
  parent auth 500d — generated `ADMIN_AUTH_SECRET`/`PARENT_AUTH_SECRET`
  (gitignored `.env`, values untouched otherwise) and recreated `web`.
- Verified: typecheck/lint ✅; unit 125/125 ✅ (new skill-performance suite);
  e2e mobile-320 25/25 ✅ incl. new adaptive flow (promote/addition,
  stabilize/subtraction, independence, content skillLevel, parent link +
  dashboard); `docker compose config` ✅; stack healthy.

## Blockers
- Physical iOS/Android/iPad touch, install, offline, accessibility, and low-end performance testing still require devices.
- Production secrets, managed MongoDB/Redis, S3, CDN, and Sentry are deployment tasks, not committed to the repository.
- Parent-journey screenshot must be re-downloaded from a fresh Stitch URL.

## Next
- Configure `.env.local` using `node scripts/admin-setup.mjs <password>` for local admin smoke testing.
- Run `docker compose up --build` in an environment with Docker, then seed Mongo separately.
- Add server-trusted scoring tokens and full content version UI before production launch.
