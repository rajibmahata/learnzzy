# CHANGELOG: Learnzzy

## [Unreleased]

### Added
- Five deterministic child games with validated Mongo-backed content pools.
- Five-agent registry, task/run/event persistence, retries, BullMQ/Redis integration, and local fallback.
- AI provider abstraction with model routing, usage tracking, budgets, and mock mode.
- Admin authentication, protected operations APIs, content approvals, pool refill, analytics, and command center UI.
- Docker Compose, Nginx reverse-proxy example, security headers, and admin setup script.
- Adaptive personalized-learning layer: learner profiles (optional nickname + age band), 15 seeded level configs, server progress/promotion, server reward mirror, interest signals, deterministic personalization engine with validated learning plans, personalization + QA agents (7 total), learner setup/plan/sticker-collection UI, per-window game shuffling, and admin learner-insights/levels/QA/personalization endpoints.
- Education Gateway (`src/integrations/education/`): provider interfaces, allowlisted registry, Tutor/OER/NCERT adapters with live HTTP contracts + deterministic mocks (all disabled by default), Zod validation, provenance + license gate, 3-tier cache, classified errors with retry/backoff, and health tracking.
- Stable concept model (`src/lib/concepts.ts`) bridging games, planner, providers, and parent progress.
- Advisory-only planner hook: gateway recommendations annotate plans; order/level/score never change.
- OER grounding for content generation with provenance stamps on produced docs.
- Parent experience: scrypt auth + HttpOnly sessions, single-use expiring pairing codes, active-link authorization, child summaries/insights/activity/progress/plan APIs, 10 parent pages, 5 public parent pages, child `/link` page, landing footer links.
- Admin education diagnostics (`providers/health/provenance`) + command-center providers panel.
- 37 gateway/parent/pairing unit tests; 52 Playwright specs across 4 viewports on system Chrome.
- Sentry SDK wired (client/server/edge configs, ErrorBoundary reporting; inert without DSN).
- Redis-backed fixed-window rate limiting on all 16 write/auth endpoints with instant memory fallback.
- Production deploy assets: `docker-compose.prod.yml` (loopback-only web, log rotation), `deploy/nginx.prod.conf` (TLS example), `npm run backup` driver-based JSON dumps, completed QA agent instructions.
- Resilience fixes (live-verified): fail-fast Redis clients + 10s negative-result caching in limiter, education cache, and BullMQ bootstrap (Redis outage previously hung requests); `COOKIE_SECURE` escape for local Docker HTTP auth while production stays Secure; `PARENT_AUTH_SECRET` plumbed through compose with `.env` auto-generation via `scripts/docker-env.mjs`.
- Sketch/Docker root-cause fix: Phaser boot read `scene.events` before SceneManager attached it, crashing all 5 games silently in production (`SKETCH_DOCKER_ROOT_CAUSE.md`); readiness now uses the Game `ready` event and boot failures warn. Added sketch color picker (cosmetic-only), canvas boot + sketch draw e2e, and sketch definition unit tests.
- Password hashes use `:` delimiters (`scrypt:<salt>:<hex>`) because `$` is interpolated by compose dotenv and Next dotenv-expand; old `$` hashes are invalid.
- Learning progression/content gap fixed: the seed now produces 25 distinct
  level-one addition combinations instead of a constant second operand; server
  content selection rotates a deterministic candidate window, excludes recent
  content IDs, and avoids duplicate problem identities. Added level-aware
  fallback ranges, server-side locked-level responses, three deterministic
  tracks, `/api/learners/:learnerId/journey`, child journey UI, parent journey
  summary, and focused learning-progress tests.
- Agentic Academic Engine (2026-09-17, MCP-powered, advisory-only): new
  deterministic core `src/lib/academic.ts` (LEARN→PRACTICE→PLAY→RECALL→REVIEW→
  MASTER stage machine, review-first next-concept ordering, interest+need
  balance, spec-shaped game recommendations, no-jump post-activity decisions,
  `validateAcademicPlan` authority gate rejecting chain-of-thought/banned
  content/level jumps); `src/services/academicEngine.ts` orchestrator answering
  "what should this learner learn next?" via the Education Gateway (Tutor
  state + NCERT prereqs, isolated failures, deterministic fallback);
  `src/repositories/academicPlans.ts` (`academicPlans` collection); 8th
  least-privilege `academic-agent` (queue `academic-plan`) wired in
  `agent-store.ts` + `workers/ensure.ts`. New learner APIs
  (`/academic/plan`, `/academic/recommendation`, `/academic/voice`,
  `/academic/result`) and `GET /api/admin/academic/plans` inspection; parent
  insights/progress carry `academic {conceptsLearned/Mastered/Practicing,
  streakDays, nextActivity}` with parent-safe reasons only.
- Multi-character Voice Engine (2026-09-17): Teddy/Bunny/Owl/Monkey/Parrot in
  `src/lib/voice.ts` with 11 voice events × 5 locales (en/hi/bn/ta/te,
  prepared scripts incl. the Parrot ladder — never live-translated);
  `voiceAssets` Mongo cache (`src/services/voiceAssetService.ts`) so gameplay
  resolves cached audio or instant device speech and never calls TTS inline;
  client `audio.ts` extended with `speakWithCharacter` (backward compatible);
  Discovery play uses the plan's character voice best-effort.
- Dynamic visual themes + cross-domain learning (2026-09-17):
  `src/lib/visualThemes.ts` (10 deterministic themes; theme never changes
  math, verified); 5 `buildCrossDomainActivity` combos (fruit+addition,
  animal+counting, color+sorting, shape+counting, bird+classification);
  content-agent object pool widened to the 10 spec visuals (math unchanged).
- Knowledge catalog growth (2026-09-17): `numbers` + `words` (basic
  vocabulary) categories (13 total, ~120 concepts) with prepared hi/bn/ta/te
  names (e.g. Parrot → तोता / টিয়া পাখি); OER mock +4 discovery summaries;
  NCERT mock returns foundational-stage (Grade 1) rows with explicit
  non-official `learnzzy-native` provenance instead of invented CBSE
  alignment.
- Academic Admin + parent surfaces (2026-09-17): command-center "Academic
  engine" panel (plans/voice/signals/failures); parent Progress page "Learning
  · streak N days" + "Next:" card.
- 22 new `tests/academic-voice-themes.test.ts` tests (stages, ordering, plan
  gate, recommendation, decisions, voice i18n/cache, theme math-invariance);
  suite now 156/156 green; production build passes with 4 new academic
  routes + 1 admin route.
- Living Wonder visual upgrade (2026-09-17, Stitch screens 12–20 followed
  from written specs — live retrieval blocked, see STITCH_INSTRUCTIONS.md;
  game logic, scoring, pools, and agents untouched): `src/lib/characters.ts`
  + `CharacterGuide` (8 purposeful friends × 8 states, calm CSS loops under
  the existing reduced-motion kill-switch) integrated into all 6 plays +
  `Celebration`; Number Orchard / Breeze Valley per-round themes via pool
  `objects.type` passthrough (`pool-client` allowlist) with deterministic
  fallback — Phaser apple/bird sprites stay the default path, math never
  reads the theme; working "🔊 Read aloud" buttons in addition/subtraction
  (mute-aware); persisted mute preference (`learnzzy.soundMuted.v1`) honored
  by every voice call with GameShell + Play Home toggles; `WonderWorlds`
  world-selector on `/play` (game names/taglines/hrefs preserved);
  CSS-only `SkyDrift` landing hero; Starlight night frame + Starlight-gold
  crayon for Sketch (guides remain vector — asset trace found zero image
  dependencies, so no broken-image class of bug exists there).
- 13 new `tests/characters.test.ts` tests; suite now 169/169 green;
  Playwright 51/51 green (child/discover/canvas/sketch/adaptive/parent/
  admin/learning-journey across mobile-320/mobile/tablet/desktop on system
  Chrome against the fresh production build).
- Stitch screens 12–20 retrieved live (2026-09-18): `list_screens` +
  `get_screen` over the Stitch MCP (`STITCH_API_KEY`) then `curl -L`
  downloads — 7 game/world HTML files + 9 screenshots (7 screens + 3 square
  art boards) under `docs/stitch_learnzzy_educational_kids_playground/`;
  the 3 art boards optimized via `sharp` to 640px WebP postcards (36–54KB)
  at `public/assets/learnzzy/games/{clean-up,puzzle,sketch}/scene.webp`.
  Child surfaces restyled from the actual designs (game logic, scoring,
  pools, agents, e2e contracts untouched): `src/lib/worlds.ts` world
  metadata + `WonderBits` shared bits (`GuideCard`, `StepperTrail`,
  `QuestFeedbackBar`, `ClueButton`); banner-style `WonderWorlds` cards with
  island/host/spark pills; Buddy Pip greeting with spoken invite + amber
  "Spin for a Wonder Adventure!"; Number Orchard / Breeze Valley stage cards
  (branch badges, glow ring, question banners, counting guidance); Pip quest
  stepper + item pill + clue bar for Clean Up ("Wonderful Job!" finale);
  dino art guide + "Dino is Awake!" for Puzzle; Bella Bunny guide + Stitch
  wand names + elephant-art hint for Sketch; `anim-bob-alt`/`anim-wiggle`/
  `anim-glow` keyframes under the existing reduced-motion kill-switch.
  Deliberate deviations recorded (DEC-187): WebGL Shader not adopted
  (performance/battery), subtraction host stays Teddy (tested mapping),
  Clean Up mechanics unchanged, Stitch names are display-only.
- 5 new `tests/worlds.test.ts` tests; suite now 174/174 green; typecheck,
  lint, `next build` green; Playwright child/sketch/discover/adaptive/
  learning-journey green on mobile; `/play`, `/play/addition`,
  `/play/clean-up` screenshot-verified; production `docker build`
  (`learnzzy:stitch-check`) succeeds.
- Worksheet-inspired Learning Playground (2026-09-18, DEC-188): `/play` is
  now category-first — 6 Learning World cards (numbers/words/think/create/
  discover/puzzles, `src/lib/categories.ts`) → `/learn/[category]` → 16
  activities (`src/lib/activityRegistry.ts`). Ten new activities (count,
  order, before-after, shape-count, big-small, word-family, word-match,
  trace-write, pattern, find-object) run on one generic engine:
  deterministic generators (`src/lib/activityContent.ts` — no LLM, exactly-
  one-correct, rotated answers/visuals, teaching hints) + reusable
  `ComplexityProfile` (`src/lib/complexity.ts`, spec §27 baseline, age
  changes the actual problem, `timePressure` always 0) +
  `GET /api/activities/[activityId]/content` (learner skill lookup
  best-effort, `recentIds` exclusion, works without Mongo) + one
  `ActivityPlayer` (character states, hint ladder, read-aloud, completion
  via existing game-events + `academic/result` — no new contracts, so
  per-skill `skillLevels`, parent dashboards, and the academic engine work
  unchanged; MCP/gateway untouched). Shipped engines linked, never
  duplicated. 8 new tests (`activity-registry` + `activity-content`);
  suite now 182/182 green; `next build` green (76 routes).
- Animal Wonderland Rich + Home Learning World (2026-09-18, Session 10):
  landing validated against new Stitch `d14a9b61` + `4b8445bd` (ANIMATION_45
  Rich: 5 candy mushrooms + 5 bobbing apples + 15 warm stars + 4 birds +
  tap jump burst) via `curl -L` under `.stitch/1495487808742926612/` and
  `public/images/stitch/home-child-first-v2.png`; `AnimalWonderland3D`
  updated to match (camera, mushrooms, apples, 15 stars, 4 birds,
  `pointerdown` jump, deterministic). Landing now category-primary per spec
  §2/§3 (hero → CTA → `HomeContinue` personalized Good-morning + plan card
  → 7-category `CATEGORIES` grid → secondary 5-tile shortcuts → games
  gallery → voice board → safety) while preserving Stitch hierarchy.
  `BrandLogo` every header now → `/play`. Fixes: `genTraceWrite`
  `answerIndex: 0` → `options.indexOf(answer)` with tightened
  `activity-content` assertions (`options[answerIndex]==answer` across
  bands) + `resolveComplexity` dead `nudge` removal. 189/189 unit
  (47 suites), `tsc`/`eslint`/`next build` green.
- Calm Warm Female Voice (2026-09-18 Session 11): `src/lib/voice.ts` 13
  events + `VoiceScript` (ageBand/language/emotion/speakingRate/
  volumeProfile/pauseAfterMs) + `createVoiceScript`/`getVoiceProfile` +
  5-locale soft scripts ("Wonderful. You got it.", "Not quite. Let's look
  carefully.", "Take your time."), `src/lib/audio.ts` calm presets
  (0.82–0.88 rate, 0.97–1.05 pitch, volume 0.85, 900ms throttle for thinking
  time), `src/lib/characters.ts` calm `STATE_LINES`. TTS stays cached +
  device fallback, never blocks, mute respected. 190/190 unit (+calm-quality
  test), `tsc`/`build` green.
- Organized Wonder Play + Docker-First MCP (2026-09-18 Session 12):
  Gaps closed: `/play` had 18/25 activities and generic hubs; now all **25**
  activities shown organized by World (Numbers 8, Words 2, Write 3, Think 7,
  Shapes 3, Discover&Puzzles 2) in `More Adventures` + 6 Stitch Category Hub
  cards (Math Kingdom, Language Nest, Logic Grove, Rainbow Studio, Nature
  Savannah, Wooden Playroom) with tactile `0_5px_0` shadows. Fixed
  `WonderArchipelago3D` (`ANIMATION_48` archipelago, fog, 3 biomes) full-screen
  wonderland, child-friendly soft gradients, 56px+ targets. Missing tiles added:
  `more-less`, `count-by-tens`, `trace-number-name`, `matching`,
  `odd-one-out`, `pattern`, `shape-match`. Docker-first MCP shim `services/mcp`
  (`node:20-alpine`, non-root, `HEALTHCHECK`, `/health`/`/capabilities`/`/metrics`,
  Bearer auth, `/data` volumes) for `tutor-mcp:3001`, `oer-mcp:3002`,
  `ncert-mcp:3003` + `qdrant:6333` on private `learnzzy` bridge, service DNS,
  prod override hides host ports, `scripts/docker-health.mjs` + `npm run
  docker:health`. Education Gateway unchanged (advisory, fallback to mocks).
  Stitch `1b8480cd` Category Hub + `a1812/9fa2` Archipelago + `00259/3f852`
  level maps + `f66f/38d8/77cc` games fetched via `curl -L`.
  `docker compose config` OK, 190/190 unit, `tsc`/`build` green.
- All 25 Validated — Big & Small Fix (2026-09-18 Session 13): child reported
  `Big & Small` identical visuals and wrong maths; `ActivityContent` now
  carries `visualMeta {sizes, wantBiggest}` and `ActivityPlayer` renders scaled
  pills (`0.7→1.8` for 4–5, `0.9→1.3` for 8–9) with `1..n` badges so maths is
  visible and deterministic (`answer = indexOf biggest/smallest +1`). Full
  validation of `All Wonder Adventures` 25 tiles (generic 19 + game-route 6)
  across all age bands: `exactly-one-correct`, `unique`, `index-points-at-answer`,
  `visual length == n`. `GET /api/activities/...` still globalLevel+mastery.
  No MCP needed; `npm test` 190/190 remains green.
- Global Level + Personalized Session Planner (2026-09-18 Session 14): one
  global `level 1..6+`, no per-game visible levels; `skill mastery` internal
  (`evaluateSkill` on `recentAccuracy`), `complexity = global + masteryAdj`
  via `resolveComplexity`; new `PersonalizedSessionPlanner` deterministic
  (`hashSeed`/`mulberry32`, interest+need+variety, top-stays+shuffled rest,
  expiresAt+1day); `buildPlan` all items `level = globalLevel`;
  `levelService` global promotion (total completions ≥3, avg ≥0.80, variety);
  new `GET /api/learners/[id]/session`; UI shows `Global Level` + mastery
  strengths. `npm test` 190/190, `tsc` 0.
- Natural Human-Like Female Voice — Root Cause (2026-09-18 Session 15):
  inspection of `speechSynthesis`/`SpeechSynthesisUtterance`/`getVoices`/
  `voiceAssetService` shows `voiceAssets` pending (KI-020), `rate/pitch` only,
  no SSML/breath, `pauseAfterMs` unused, robotic eSpeak fallback. Decision:
  server `ttsProvider` (`tts-1-hd` warm female) → `voiceAssets.audioUrl` →
  `HTMLAudio` preload, `speechSynthesis` only offline fallback.

### Changed
- `/api/games` now exposes all five MVP games as active.
- Empty or low content pools trigger asynchronous refill without blocking gameplay.
- `knowledge.test.ts` locale test now asserts prepared hi/bn Parrot names (translation pipeline landed) with English fallback for untranslated concepts.

### Fixed
- Added strict validation for generated math, scene structure, safety terms, duplicates, and content lifecycle.

### Removed
- None.
