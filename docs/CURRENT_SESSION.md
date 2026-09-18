# CURRENT SESSION: Learnzzy

**Date:** 2026-09-17
**Focus:** Living Wonder visual/UX upgrade (Stitch screens 12–20, code-preserving)
**Owner:** OpenCode
**Previous:** Agentic Academic Engine + multi-character voice learning (same day, committed c68179b)

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

## Living Wonder visual upgrade (2026-09-17, this session)
- Stitch screens 12–20 NOT retrievable (no MCP tool, no URLs, cache has only
  7 older artifacts; STITCH_INSTRUCTIONS.md + KI-021 record this). Built from
  the written specs + Playful Wonder tokens; pixel parity NOT claimed.
- New: `src/lib/characters.ts` (8 friends, purposeful per-game guides, 8
  states, short lines, aria labels) + `CharacterGuide` + calm CSS keyframes
  (reduced-motion neutralized globally); integrated into all 6 plays +
  `Celebration` (optional prop, default off).
- Number Orchard/Breeze Valley: pool `objects.type` passthrough with inline
  allowlist (pool-client stays @/-free), deterministic per-round fallback;
  stages + Phaser scenes accept optional emoji (apple/bird sprite path
  byte-identical default); aria labels use theme nouns ("3 mangoes").
- Voice: persisted mute (`learnzzy.soundMuted.v1`) honored by
  `speakWithCharacter`; GameShell + Play Home toggles persist; addition/
  subtraction "Read aloud" is now a working mute-aware button (was a dead
  pill in addition).
- `/play` games nav → `WonderWorlds` world cards (names/taglines/hrefs kept;
  one e2e assertion caught the missing game name and was fixed in code, not
  in the spec); landing hero gained CSS-only SkyDrift.
- Sketch trace: guides are pure vector `guidePath` + Phaser Graphics — zero
  image/URL references, so no asset-loading bug class exists; Starlight
  frame is CSS-only; added Starlight-gold crayon (evaluation-blind).
- Verified: unit 169/169 ✅, typecheck ✅, lint ✅, `next build` ✅,
  Playwright 51/51 ✅ (system Chrome, fresh prod build on :3100; :3000 held
  by a stale Docker port-forward, Docker CLI shadowed per KI-022).
- NOT verified: Stitch pixel parity, live-Mongo E2E (KI-019), TTS binaries
  (KI-020), physical devices.

## Agentic Academic Engine + voice learning (2026-09-17)- Inspected before building (anti-duplication survey): reused
  `educationGateway`, `conceptsForGame`/`getConceptDef`, `validateAdvisory`,
  `buildPlan`, per-skill `skillLevels`, knowledge mastery machine, and the
  Admin providers panel. New code only where nothing existed: orchestrator,
  stage machine, voice engine, visual themes, `academicPlans`/`voiceAssets`.
- New pure libs (dependency-free, unit-tested): `src/lib/academic.ts`
  (LEARN→MASTER stages, review-first concept ordering, interest+need balance,
  §16 recommendations, no-jump decisions, `validateAcademicPlan` gate),
  `src/lib/voice.ts` (5 characters × 11 events × 5 locales, Parrot ladder,
  deterministic cache keys), `src/lib/visualThemes.ts` (10 themes,
  theme-never-changes-math, 5 cross-domain combos).
- New server layer: `src/services/academicEngine.ts` (orchestrator, gateway
  calls failure-isolated), `src/services/voiceAssetService.ts` (cache, never
  live TTS in request path), `src/repositories/academicPlans.ts`, 8th agent
  `academic-agent` (`src/agents/academic.ts`, queue `academic-plan`).
- New APIs: learner `/academic/plan|recommendation|voice|result` +
  `GET /api/admin/academic/plans`. Parent insights/progress carry
  `academic {learned/mastered/practicing, streakDays, nextActivity}`.
  Discovery play uses the plan's character voice (best-effort) and reports
  academic results (best-effort). Admin dashboard gained an Academic panel.
- Knowledge: +`numbers`/`words` categories (13 total), prepared hi/bn/ta/te
  names; OER mock +4 summaries; NCERT mock foundational Grade-1 rows marked
  explicitly non-official. Content-agent objects widened to 10 spec visuals.
- Verified: unit 156/156 ✅ (22 new), typecheck ✅, lint ✅,
  `next build` ✅ (81 routes), `docker compose config` ✅, dev server
  `/api/health` ok. NOT verified: live-Mongo E2E (KI-019), TTS binaries
  (KI-020), Playwright academic pass, Stitch validation.

## Stitch 12–20 live retrieval + attractiveness pass (2026-09-18, this session)
- Unblocked the Stitch MCP: `STITCH_API_KEY` present in env; `initialize` +
  `tools/list` + `list_screens` + 10× `get_screen` over
  `https://stitch.googleapis.com/mcp` (JSON-RPC bodies via `@file` — Windows
  curl.exe mangles single-quoted `-d`). Then `curl -L`: 7 HTML
  (clean-up/puzzle/sketch/living-wonder-worlds/number-orchard/breeze-valley/
  shader) + 9 screenshots into `docs/stitch_learnzzy_educational_kids_playground/`.
  Prior "unretrievable" status (KI-021) is now RESOLVED; retrieval method +
  deviations recorded in STITCH_INSTRUCTIONS.md (DEC-187).
- Inspected all 10 screens (code + rendered screenshots) against the running
  app before changing anything. Corrections applied: "Pip" is Stitch-canonical
  (kept, not replaced); subtraction host conflict (Stitch Bella vs tested
  Teddy mapping) resolved in favor of docs/tests.
- New: `src/lib/worlds.ts` (6 world metas, art manifest; 5 unit tests) +
  `src/components/child/WonderBits.tsx` (`GuideCard`/`StepperTrail`/
  `QuestFeedbackBar`/`ClueButton`) + `anim-bob-alt`/`anim-wiggle`/`anim-glow`
  CSS (reduced-motion safe). Restyled: `WonderWorlds` banner cards, Play Home
  Pip greeting + Spin button, Addition (orchard card/badges/glow plus/banner/
  guidance), Subtraction (meadow card/flew-away pill/perched badges), Clean Up
  (quest stepper/item pill/clue bar, "Wonderful Job!"), Puzzle (dino art,
  "Dino is Awake!"), Sketch (Stitch wand names incl. pinned "Red", Bella
  guide, elephant-art hint). Art: 3 boards → 640px WebP (36–54KB) via sharp,
  lazy `<img>` (deliberate, no next/image churn). Mechanics, scoring, pools,
  agents, voice scripts, e2e contracts untouched.
- Verified: unit 174/174 ✅, typecheck ✅, lint ✅ (one
  `no-unescaped-entities` fix), `next build` ✅, Playwright child 8/8 +
  sketch 2/2 + discover 2/2 + adaptive + learning-journey ✅ (mobile, prod
  build on :3100), screenshots of `/play`, `/play/addition`, `/play/clean-up`
  reviewed ✅, `docker build learnzzy:stitch-check` ✅ via explicit
  `docker.exe` path (KI-022 trap: bare `docker` resolves to
  `C:\windows\system32\docker`).
- NOT done: parent-journey screenshot re-fetch (still expired), physical
  devices, live-Mongo E2E (KI-019), TTS binaries (KI-020).

## Worksheet-inspired Learning Playground (2026-09-18, this session)
- Inspected first (registry, /play, learner/age-bands, skillLevels,
  pool-client, gateway/MCP, agents): reused everything — no rewrites.
- New dependency-free libs: `lib/categories.ts` (6 Learning Worlds),
  `lib/complexity.ts` (ComplexityProfile + §27 baseline matrix,
  timePressure 0), `lib/activityRegistry.ts` (16 activities; shipped
  engines linked via href, never duplicated), `lib/activityContent.ts`
  (10 deterministic generators: count/order/before-after/shape-count/
  big-small/word-family/word-match/trace-write/pattern/find-object;
  exactly-one-correct, rotated answers/visuals, teaching hints).
- New: `GET /api/activities/[activityId]/content` (ageBand + learner
  skill lookup best-effort + recentIds exclusion) + `ActivityPlayer`
  (CharacterGuide states, hint ladder, read-aloud, completion via
  game-events + academic/result → skillLevels/parent/academic with no
  new contracts) + `/learn/[category]` + `/learn/[category]/[activity]`
  + /play Learning World category cards (WonderWorlds untouched).
- Verified: unit 182/182 ✅ (8 new), typecheck ✅, lint ✅ (only
  pre-existing no-img-element warnings), `next build` ✅ (76 routes).
- NOT verified: Playwright pass for /learn flows, live-Mongo E2E
  (KI-019), TTS (KI-020), physical devices, Stitch validation of new
  category/activity surfaces.
