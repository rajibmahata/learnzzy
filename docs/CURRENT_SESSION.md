# CURRENT SESSION: Learnzzy

**Date:** 2026-09-17
**Focus:** Living Wonder visual/UX upgrade (Stitch screens 12â€“20, code-preserving)
**Owner:** OpenCode
**Previous:** Agentic Academic Engine + multi-character voice learning (same day, committed c68179b)

## Stitch UI Validation â€” 2026-09-15

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

## Gap closure â€” 2026-09-16
- White canvas: Phaser boot now tolerates UMD interop (`default ?? namespace`),
  clears stale StrictMode canvases, falls back from `ready` after 4s, loads SVG
  via `load.svg` with explicit size, and every stage renders a DOM emoji
  fallback so containers never sit empty-white. `getDb` fails fast (2â€“3s),
  `fetchPool` aborts after 8s, and learner setup aborts after 10s with a
  connection error instead of hanging on `Preparing...`.
- Browser-answer exposure: `/api/games/[gameId]/content` no longer sends
  `correctAnswer`; pool validators recompute from `question` and treat a
  present value as an integrity check only.
- Admin: command input posts to `/api/admin/commands` with history, plus
  content review (approve/disable + version inspection).
- Stitch: expired `parent-journey.png` (HTTP 400) removed; only
  `parent-journey.html` kept until the URL is re-fetched.
- Verified 2026-09-16: typecheck âœ…, lint âœ…, unit 106/106 âœ…,
  `next build` 74/74 âœ…, Playwright `canvas.spec` 5/5 âœ… and
  `child.spec` 6/6 âœ… on mobile-320 (welcome + addition flows that
  previously hung now pass via fail-fast fallbacks).

## removeChild crash â€” true root cause + redeploy (2026-09-16)
- Pasted `NotFoundError: removeChild` came from the stage container clear in
  `usePhaserGame` (`while (firstChild) removeChild`) deleting React-managed
  DOM fallback nodes; React's later unmount commit then threw and the route
  ErrorBoundary tripped. Fixed: remove only Phaser `canvas` elements.
- Defense in depth: scene API (`apiRef`) is now exposed only after the engine
  `ready` event; stages gate `showGroups/showScene/...` on a new `booted`
  flag while the 4s timer only resolves UI readiness. Prevents calling scene
  methods on an unbooted scene (tweens undefined â†’ effect throw).
- Environmental trap: `learnzzy-web-1` was squatting host :3000 with a stale
  image, so probes/e2e tested the container instead of local code until the
  image was rebuilt from fixed source and `web` recreated (mongo/redis +
  volumes untouched). Lesson: check `docker ps`/port owners whenever served
  content contradicts disk.
- Re-verified against the redeployed stack: `canvas.spec` 5/5 âœ…,
  `child.spec` 6/6 âœ… (mobile-320).

## Sketch visual-learning enhancement (2026-09-16)
- Assessment: `SKETCH_CONTENT_ASSESSMENT.md`; implementation report:
  `SKETCH_CONTENT_IMPLEMENTATION.md`.
- 23 leveled sketch activities (shapesâ†’objectsâ†’combosâ†’patternsâ†’scenes) with
  task types (`trace|dots|pattern`), instructions, and hints; 69 active pool
  docs / 23 shapes; 30 legacy ID-only-duplicate docs deleted.
- Hint UI (`[? Hint]` + dialog) on Sketch/Addition/Subtraction; `hint_used`
  events now emitted; math copy derives deterministically from operands.
- Verified: unit 115/115 âœ…; e2e mobile-320 canvas 5/5, child 8/8, sketch
  2/2 âœ… against the redeployed compose stack (seeded via host :27018).

## Adaptive per-skill engine (2026-09-16)
- New `src/lib/skillLevels.ts` (dependency-free): rolling last-5 evaluation,
  promote (3+ @80%+, +1 max), stabilize-first, reduce after repeated weakness
  (âˆ’1, floor 1). One skill never touches another; global level stays the
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
  parent auth 500d â€” generated `ADMIN_AUTH_SECRET`/`PARENT_AUTH_SECRET`
  (gitignored `.env`, values untouched otherwise) and recreated `web`.
- Verified: typecheck/lint âœ…; unit 125/125 âœ… (new skill-performance suite);
  e2e mobile-320 25/25 âœ… incl. new adaptive flow (promote/addition,
  stabilize/subtraction, independence, content skillLevel, parent link +
  dashboard); `docker compose config` âœ…; stack healthy.

## Blockers
- Physical iOS/Android/iPad touch, install, offline, accessibility, and low-end performance testing still require devices.
- Production secrets, managed MongoDB/Redis, S3, CDN, and Sentry are deployment tasks, not committed to the repository.
- Parent-journey screenshot must be re-downloaded from a fresh Stitch URL.

## Next
- Configure `.env.local` using `node scripts/admin-setup.mjs <password>` for local admin smoke testing.
- Run `docker compose up --build` in an environment with Docker, then seed Mongo separately.
- Add server-trusted scoring tokens and full content version UI before production launch.

## Living Wonder visual upgrade (2026-09-17, this session)
- Stitch screens 12â€“20 NOT retrievable (no MCP tool, no URLs, cache has only
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
- `/play` games nav â†’ `WonderWorlds` world cards (names/taglines/hrefs kept;
  one e2e assertion caught the missing game name and was fixed in code, not
  in the spec); landing hero gained CSS-only SkyDrift.
- Sketch trace: guides are pure vector `guidePath` + Phaser Graphics â€” zero
  image/URL references, so no asset-loading bug class exists; Starlight
  frame is CSS-only; added Starlight-gold crayon (evaluation-blind).
- Verified: unit 169/169 âœ…, typecheck âœ…, lint âœ…, `next build` âœ…,
  Playwright 51/51 âœ… (system Chrome, fresh prod build on :3100; :3000 held
  by a stale Docker port-forward, Docker CLI shadowed per KI-022).
- NOT verified: Stitch pixel parity, live-Mongo E2E (KI-019), TTS binaries
  (KI-020), physical devices.

## Agentic Academic Engine + voice learning (2026-09-17)- Inspected before building (anti-duplication survey): reused
  `educationGateway`, `conceptsForGame`/`getConceptDef`, `validateAdvisory`,
  `buildPlan`, per-skill `skillLevels`, knowledge mastery machine, and the
  Admin providers panel. New code only where nothing existed: orchestrator,
  stage machine, voice engine, visual themes, `academicPlans`/`voiceAssets`.
- New pure libs (dependency-free, unit-tested): `src/lib/academic.ts`
  (LEARNâ†’MASTER stages, review-first concept ordering, interest+need balance,
  Â§16 recommendations, no-jump decisions, `validateAcademicPlan` gate),
  `src/lib/voice.ts` (5 characters Ã— 11 events Ã— 5 locales, Parrot ladder,
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
- Verified: unit 156/156 âœ… (22 new), typecheck âœ…, lint âœ…,
  `next build` âœ… (81 routes), `docker compose config` âœ…, dev server
  `/api/health` ok. NOT verified: live-Mongo E2E (KI-019), TTS binaries
  (KI-020), Playwright academic pass, Stitch validation.

## Stitch 12â€“20 live retrieval + attractiveness pass (2026-09-18, this session)
- Unblocked the Stitch MCP: `STITCH_API_KEY` present in env; `initialize` +
  `tools/list` + `list_screens` + 10Ã— `get_screen` over
  `https://stitch.googleapis.com/mcp` (JSON-RPC bodies via `@file` â€” Windows
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
  guide, elephant-art hint). Art: 3 boards â†’ 640px WebP (36â€“54KB) via sharp,
  lazy `<img>` (deliberate, no next/image churn). Mechanics, scoring, pools,
  agents, voice scripts, e2e contracts untouched.
- Verified: unit 174/174 âœ…, typecheck âœ…, lint âœ… (one
  `no-unescaped-entities` fix), `next build` âœ…, Playwright child 8/8 +
  sketch 2/2 + discover 2/2 + adaptive + learning-journey âœ… (mobile, prod
  build on :3100), screenshots of `/play`, `/play/addition`, `/play/clean-up`
  reviewed âœ…, `docker build learnzzy:stitch-check` âœ… via explicit
  `docker.exe` path (KI-022 trap: bare `docker` resolves to
  `C:\windows\system32\docker`).
- NOT done: parent-journey screenshot re-fetch (still expired), physical
  devices, live-Mongo E2E (KI-019), TTS binaries (KI-020).

## Worksheet-inspired Learning Playground (2026-09-18, this session)
- Inspected first (registry, /play, learner/age-bands, skillLevels,
  pool-client, gateway/MCP, agents): reused everything â€” no rewrites.
- New dependency-free libs: `lib/categories.ts` (6 Learning Worlds),
  `lib/complexity.ts` (ComplexityProfile + Â§27 baseline matrix,
  timePressure 0), `lib/activityRegistry.ts` (16 activities; shipped
  engines linked via href, never duplicated), `lib/activityContent.ts`
  (10 deterministic generators: count/order/before-after/shape-count/
  big-small/word-family/word-match/trace-write/pattern/find-object;
  exactly-one-correct, rotated answers/visuals, teaching hints).
- New: `GET /api/activities/[activityId]/content` (ageBand + learner
  skill lookup best-effort + recentIds exclusion) + `ActivityPlayer`
  (CharacterGuide states, hint ladder, read-aloud, completion via
  game-events + academic/result â†’ skillLevels/parent/academic with no
  new contracts) + `/learn/[category]` + `/learn/[category]/[activity]`
  + /play Learning World category cards (WonderWorlds untouched).
- Verified: unit 182/182 âœ… (8 new), typecheck âœ…, lint âœ… (only
  pre-existing no-img-element warnings), `next build` âœ… (76 routes).
- NOT verified: Playwright pass for /learn flows, live-Mongo E2E
  (KI-019), TTS (KI-020), physical devices, Stitch validation of new
  category/activity surfaces.

## Animal Wonderland Rich + Home Learning World (2026-09-18, session 10)
- New Stitch validation: `d14a9b61` + `4b8445bd` (ANIMATION_45 Rich) fetched
  via `curl -L` into `.stitch/...` + `public/images/stitch/home-child-first-v2.png`
  â€” validates `f929a9c4`/`b933` (copy identical; Rich scene delta: 5 candy
  mushrooms + 5 apples + 15 stars + 4 birds + tap jump burst). Updated
  `AnimalWonderland3D` (camera 4.5/20, mushrooms, apples, 15 deterministic
  stars, 4-bird formation, `pointerdown` jumpBoost 1.0â†’0.92, snappier parallax)
  with deterministic seeds and reduced-motion static frame.
- Landing (/) now category-primary per spec Â§2/Â§3 while preserving Stitch
  hierarchy: hero â†’ CTA â†’ `HomeContinue` (Good-morning + plan-first Continue
  card, best-effort `GET /api/learners/.../plan`) â†’ 7-category `CATEGORIES`
  grid â†’ secondary 5-tile quick shortcuts â†’ games gallery â†’ voice board â†’
  safety. `BrandLogo` (all 26 usages) now `Link href="/play"`.
- Bug + hygiene: `genTraceWrite` had `answerIndex: 0` regardless of shuffle â†’
  `options.indexOf(answer)` with tightened `tests/activity-content.test.ts:18`
  (`options[answerIndex]==answer` across all bands, expanded trace-write loop);
  `resolveComplexity` dead `nudge` branching removed (no behavior change).
- Verified: `tsc --noEmit` 0, `eslint` 0, `npm test` 189/189 (47 suites), `next build` 0.

## Calm Warm Female Voice + Organized Wonder Play + Docker-First MCP (2026-09-18, session 11/12)
- Voice (11): calm female companion â€” `VoiceScript` (13 events, 5 locales,
  800ms pause), `CHARACTER_VOICES` 0.82â€“0.88/0.97â€“1.05, throttle 900ms thinking
  gap, `STATE_LINES` calm. TTS cached + fallback. `tcs` 0, `npm test` 190/190.
- Play gaps (12): `/play` had 18/25 activities and generic hubs; now **25/25**
  organized: `Featured Worlds` (6) + `All Wonder Adventures` grouped by World
  (Numbers 8, Words 2, Write 3, Think 7, Shapes 3, Discover&Puzzles 2) + 6
  Stitch Category Hub cards (`1b8480cd` Math Kingdom etc.) + `WonderArchipelago3D`
  (`a1812/9fa2` ANIMATION_48) full-screen wonderland child-friendly.
  Missing 7 tiles added: `more-less`, `count-by-tens`, `trace-number-name`,
  `matching`, `odd-one-out`, `pattern`, `shape-match`.
- Docker-first MCP (12): unified shim `services/mcp` (node:20-alpine non-root,
  HEALTHCHECK, /health/capabilities/metrics, Bearer auth, /data volumes) for
  `tutor:3001`/`oer:3002`/`ncert:3003` + `qdrant:6333` on private `learnzzy`
  bridge, service DNS, prod hides ports, `scripts/docker-health.mjs` + `npm
  run docker:health`. Gateway advisory, fail-closed, never breaks child.
- Stitch fetch (12): `1b8480cd` Category Hub + `a1812/9fa2` Archipelago + `00259/3f852`
  level maps + `f66f/38d8/77cc` games via `curl -L`; `docker compose config` OK.

## All 25 Validated â€” Big & Small Fix (2026-09-18, session 13)
- Fix (13): `Big & Small` maths was visually indistinguishable (identical `text-4xl` emoji) so all appeared wrong; now `visualMeta {sizes, wantBiggest}` + `ActivityPlayer` scaled pills (`0.7â†’1.8` for 4â€“5 obvious, `0.9â†’1.3` for 8â€“9 subtle) with `1..n` badges. Maths deterministic: `answer = indexOf(biggest|smallest)+1`, verified across 4-5/6-7/8-9 Ã—5 levels Ã—20 seeds (300 cases). Full `All Wonder Adventures` 25/25 validated: `one-correct`, `unique`, `index-points-at-answer`, `visual length` via `validate-adventures.mjs` + `validate-api.mjs`; `GET /api/activities/...` globalLevel+mastery still correct, no MCP needed. `npm test` 190/190, `tsc` 0.
## Global Level + Personalized Session Planner (2026-09-18, session 14)
- Global level 1..6+ single source, no per-game visible levels; skill mastery internal via evaluateSkill on recentAccuracy; complexity = global + masteryAdj (+1 strong, -1 needs practice) within age-band safety via resolveComplexity.
- New src/services/personalizedSessionPlanner.ts deterministic: hashSeed/mulberry32, mastery+interest+need+variety, category variety, top-stays + shuffled rest, expiresAt+1day, learningGoals. personalizationService now delegates, all LearningPlan.items.level = globalLevel. levelService global promotion (overall avg + variety). New GET /api/learners/[id]/session. UI shows Global Level only. Verified: npm test 190/190, tsc 0.

## Natural Female Voice -- Root Cause (2026-09-18, session 15)
- Inspection: speechSynthesis parametric eSpeak, only rate/pitch, no SSML/breath, pauseAfterMs unused, voiceAssets pending KI-020, fallback to male voices[0] -> robotic. No Audio preload, stutter on cancel(), Hindi still en-US accent.
- Decision: server ttsProvider (OpenAI tts-1-hd warm nova) -> voiceAssets.audioUrl -> HTMLAudio preload, speechSynthesis only offline fallback; cache deterministic, gameplay never waits.
