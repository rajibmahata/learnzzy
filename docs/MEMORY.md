# Learnzzy â€” Project Memory

**Document:** Persistent Project Context  
**Version:** 1.1  
**Status:** Active  
**Last Updated:** 2026-09-18 â€” Session 15 (Natural Voice Root Cause + All 25 Validated)

---

## 1. Purpose

This document preserves the important project context required to continue Learnzzy work across development sessions.

It is a project handoff/memory document.

It should contain durable project facts, not transient chat conversation.

---

# 2. Product Identity

**Project:** Learnzzy

**Positioning:**

> A fast, delightful learning playground that children want to use, while AI quietly makes the learning world richer in the background.

Core feeling:

```text
Joy
Discovery
Simplicity
Safety
Curiosity
Achievement
```

---

# 3. MVP Games

Exactly five core games are defined for the MVP:

```text
1. Addition / Numbers
2. Subtraction / Fly Away
3. Clean Up
4. Picture Puzzle
5. Shadow Sketch
```

---

# 4. Core Architecture Memory

The central architectural decision is:

```text
Deterministic Game Engine
        +
Validated Content Pool
        +
Asynchronous AI Workforce
```

Child path:

```text
Child PWA
   â†“
Next.js
   â†“
Game
   â†“
Deterministic Services
   â†“
Validated Content
```

Background path:

```text
Admin / Scheduler
   â†“
BullMQ
   â†“
Agent Worker
   â†“
AI
   â†“
Validation
   â†“
MongoDB
```

AI must never become a synchronous dependency of gameplay.

---

# 5. Technology Baseline

```text
Frontend:       Next.js + TypeScript
Game Engine:    Phaser 3
UI:             Tailwind CSS + reusable UI library
Backend:        Next.js / Node.js
Database:       MongoDB
Validation:     Zod + deterministic rules
Cache:          Redis
Jobs:           BullMQ
AI:             GPT-5 nano / GPT-5 mini, configurable
Assets:         S3-compatible object storage
CDN:            Cloudflare
Deployment:     Docker + Nginx + VPS
Monitoring:     Sentry + structured logs
```

MongoDB is the primary authoritative persistent database.

---

# 6. AI Philosophy

AI is a supporting intelligence layer.

Use AI for:

- content generation;
- classification;
- summarization;
- recommendations;
- asset workflows;
- analytics assistance;
- operational automation.

Do not use AI for:

- arithmetic;
- protected scoring;
- game state;
- basic interaction;
- collision logic;
- gameplay-critical answer validation.

AI output is untrusted until validated.

---

# 7. Agent Workforce

Initial agents:

```text
Content Agent
Quality & Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
```

Agent properties:

- asynchronous;
- least privilege;
- observable;
- auditable;
- retryable;
- idempotent.

Consequential operations require authorization and confirmation where configured.

---

# 8. Content Memory

Content is structured and game-specific.

Lifecycle:

```text
draft
  â†“
validating
  â†“
approved
  â†“
active
```

Invalid/rejected/disabled content must not be playable.

Content pools should be replenished in the background.

Deterministic content generation should be used where practical to reduce AI cost.

---

# 8.1 Implemented Workforce Memory

The current code includes five registered agents: Content, Quality & Safety,
Asset, Analytics, and Difficulty. Tasks, runs, operational events, AI usage,
and audit actions are persisted in MongoDB. BullMQ uses Redis when
`REDIS_URL` is present; otherwise the same handlers run in-process with three
attempts and exponential backoff so local gameplay remains usable.

The admin route is protected by an env-configured scrypt password hash and a
signed HttpOnly cookie. Admin APIs cover agents, tasks, content approval and
rejection, pool status/refill, analytics, difficulty recommendations, and
system health. The admin UI is available at `/admin`.

Generated content is deterministic by default, optionally AI-assisted, and
must pass schema, deterministic, safety, duplicate, and structural checks
before it is stored as active content.

The workforce has eight agents (personalization + QA + academic added).
Learners carry optional nicknames, age bands, levels, progress, interests,
and rewards; promotion needs 3+ completions at 80%+ with max +1 level.

# 8.2 Education Gateway Memory

External learning intelligence lives behind `src/integrations/education/`:
allowlisted Tutor/OER/NCERT providers behind `educationGateway`, all disabled
by default with deterministic mocks. The stable concept model
(`src/lib/concepts.ts`) bridges games, planner, providers, and parent views.
Gateway output is advisory only â€” it annotates learning plans but never
reorders them, changes levels/scores, or reaches the browser. OER results
carry provenance + license; only pool-safe licenses may enter content.
Parents sign in separately (`lz_parent` cookie), link devices via single-use
expiring codes, and see only validated summaries for actively linked learners.

# 8.3 Academic Engine + Voice Memory (2026-09-17)

The Academic Orchestrator (`src/services/academicEngine.ts` + pure core
`src/lib/academic.ts`) answers "what should this learner learn next?" as a
Validated Learning Plan
(learnerId/objective/concept/prerequisites/activityType/difficulty/complexity/
reason+reasonCode/source/nextReviewAt/stage/game/locale/characterId/priority).
Tutor/OER/NCERT advise through the Education Gateway; every gateway call is
failure-isolated and the deterministic plan always stands. Plans persist in
`academicPlans`; the `academic-agent` owns their lifecycle and never mutates
game state, score, rewards, or progression.

Learning follows LEARN â†’ PRACTICE â†’ PLAY â†’ RECALL â†’ REVIEW â†’ MASTER with no
stage skips and no multi-level jumps from a single result. Complexity is
per-skill; interest boosts priority but never overrides review/need.

Voice is prepared-per-language (en/hi/bn/ta/te), never live-translated:
`src/lib/voice.ts` defines Teddy/Bunny/Owl/Monkey/Parrot Ã— 11 events;
`voiceAssets` caches (character, event, locale, text-hash) â†’ audioUrl;
gameplay uses cached audio or instant device speechSynthesis and never calls
external TTS inline. Voice never blocks play; text always works.

Visual themes (10 deterministic objects) vary presentation only â€” the
Difficulty Engine owns the numbers and theme changes can never alter an
answer (`verifyThemeMath`). Cross-domain combos (fruit+addition,
animal+counting, color+sorting, shape+counting, bird+classification) resolve
to validated games. Knowledge catalog: 13 categories (~120 concepts) incl.
numbers + basic vocabulary, with prepared hi/bn/ta/te names.

---

# 9. Asset Memory

Asset strategy:

```text
Reuse existing approved asset first
        â†“
Generate only if needed
        â†“
Validate
        â†“
Optimize
        â†“
Object Storage
        â†“
CDN
```

Child-facing assets should be:

- friendly;
- modern;
- simple;
- child-safe;
- text-free unless explicitly required;
- watermark-free.

---

# 10. Child Privacy Memory

MVP does not require child accounts.

Avoid collecting unnecessary:

```text
Name
Email
Phone
Precise location
Photos
Public profile information
```

No public child activity.

No public child-to-child chat.

Analytics should be aggregate-oriented.

---

# 11. UX Memory

Child experience:

```text
Open
 â†“
Home
 â†“
Choose game
 â†“
Play
 â†“
Celebrate
 â†“
Play again / Home
```

Rules:

- visual-first;
- one primary task per screen;
- large touch targets;
- low text;
- positive failure;
- responsive;
- portrait + landscape;
- Android + iPhone + iPad + desktop.

Target question:

> Can a five-year-old understand what to tap without needing an adult to explain the screen?

---

# 12. Admin Memory

Admin is protected and agentic.

Routes include:

```text
/admin/login
/admin
/admin/agents
/admin/content
/admin/assets
/admin/analytics
/admin/difficulty
/admin/system
/admin/settings
```

Admin should prefer natural-language commands over unnecessary form-heavy workflows.

Example:

```text
Create 50 Level 1 addition activities.
Refill the subtraction pool.
Find why puzzle completion is lower this week.
Show failed agent tasks.
```

Natural language must route to structured tasks.

It must never become unrestricted MongoDB access.

---

# 13. Database Memory

Core MongoDB collections:

```text
admins
games
gameConfigs
content
contentVersions
assets
assetVersions
assetTags
sessions
gameEvents
agents
agentTasks
agentRuns
agentEvents
academicPlans
voiceAssets
difficultyRules
difficultyRecommendations
systemSettings
aiUsage
auditLogs
```

Redis is supporting infrastructure, not permanent source of truth.

Binary assets belong in object storage, not normal MongoDB documents.

---

# 14. Gameplay Memory

Game state is deterministic.

Browser state is not authoritative.

Examples:

```text
Addition:
a + b

Subtraction:
start - removed

Clean Up:
all targets collected

Puzzle:
all pieces correctly placed

Sketch:
deterministic geometry-based evaluation
```

---

# 15. Event Memory

Important events include:

```text
session_started
game_started
question_shown
answer_submitted
answer_correct
answer_incorrect
retry_started
game_completed
session_completed
puzzle_piece_placed
puzzle_completed
drawing_started
drawing_completed
```

Events are append-oriented and should support idempotent ingestion.

---

# 16. PWA Memory

Learnzzy is PWA-first.

Required capabilities:

- manifest;
- installability;
- service worker;
- cached application shell;
- cached game assets;
- offline-friendly behavior;
- local event queue;
- synchronization after reconnection.

---

# 17. Reward Memory

Rewards are educational.

Allowed:

```text
Stars
Positive animation
Progress
Milestones
Celebration
```

Avoid:

```text
Harsh punishment
Gambling-like mechanics
Pay-to-progress
Intrusive gameplay ads
```

---

# 18. Documentation Memory

Current key documents:

```text
PROJECT_DETAILS.md
ARCHITECTURE.md
AGENTIC_IMPLEMENTATION_PLAN.md
API.md
UI_UX.md
UI.md
UI_LIBRARY.md
BACKLOG.md
BUSINESS_RULES.md
DATABASE.md
DECISIONS.md
FEATURE_INDEX.md
KNOWN_ISSUES.md
LEARNING_TEMPLATE.md
MEMORY.md
NEXT_SESSION.md
```

---

# 19. Development Principle

Always work:

```text
UNDERSTAND
   â†“
PLAN
   â†“
IMPLEMENT
   â†“
TEST
   â†“
REVIEW
   â†“
DOCUMENT
   â†“
MARK DONE
```

Do not mark a feature complete merely because code was written.

---

# 20. Non-Negotiable Rules

```text
NO LLM per click
NO LLM arithmetic
NO unnecessary child login
NO public child profiles
NO public child chat
NO intrusive gameplay advertising
NO uncontrolled destructive agents
NO unvalidated AI content
NO AI credentials in browser
NO gameplay dependency on live AI
NO browser-authoritative protected scoring
```

Always:

```text
Deterministic logic
Structured content
Validation
Safe assets
Background AI
Caching
Mobile-first UX
PWA
Secure admin
Observability
Cost tracking
```

---

# 21. Memory Maintenance Rule

Update this file only when a fact becomes durable project context.

Do not use it as:

- a bug tracker;
- a sprint backlog;
- a chat transcript;
- a detailed API specification;
- a detailed database schema.

Those responsibilities belong to the other documents.

---

# 22. Final Memory Statement

The most important Learnzzy context is:

> **Keep the child experience deterministic, fast, simple, safe, and delightful; keep sophisticated AI and agent automation behind the scenes.**

# 23. Implementation Reconciliation â€” 2026-09-14

The latest supplied OpenCode session records the following as implemented and verified: MongoDB content/session/event repositories and indexes; seeded 100+100 active addition/subtraction pool items; pool-first gameplay content with deterministic fallback; client-side pool re-validation; Phaser visual stages for Addition and Subtraction; PWA icon/installability fixes; five registered agents with persisted lifecycle; BullMQ/Redis with in-process fallback; AI abstraction with usage/budget/mock support; admin authentication and protected admin operations; Docker Compose/Nginx baseline; and a passing verification suite including 17 tests in the latest pool/game session.

Important status rule: documentation must not claim that all five game renderers are complete merely because all five games are listed in the MVP. The latest session specifically identifies Clean Up renderer work as next and physical-device validation as still outstanding.

## Parent Experience

Parent login, secure parent-child linking, parent dashboard, activity, progress, rewards, insights, and learning plans are part of the approved architecture but are not yet verified as implemented in the supplied session evidence.

The parent relationship must use an explicit secure pairing/approval mechanism. Child name + age and parent name are profile information, not authentication.

# 24. Academic Engine Reconciliation â€” 2026-09-17

Implemented and verified (unit 156/156, typecheck, lint, production build
with 81 routes): Academic Orchestrator + `academic-agent` + Validated
Learning Plan APIs + Voice Character Engine (5 Ã— 11 Ã— 5) with `voiceAssets`
cache + dynamic visual themes + 5 cross-domain combos + numbers/vocabulary
catalog growth + parent academic rollup + admin academic panel. Provenance
rule: NCERT mock returns foundational-stage rows explicitly marked
non-official (`learnzzy-native`) â€” never claim CBSE alignment.

Status rule: do not claim live-Mongo E2E, real TTS binary generation,
Playwright academic coverage, or Stitch validation â€” all four remain open
(see KNOWN_ISSUES KI-019/KI-020 and NEXT_SESSION).

# 25. Living Wonder Reconciliation â€” 2026-09-17

Visual layer only; architecture unchanged. Character system
(`src/lib/characters.ts` + `CharacterGuide`: 8 purposeful friends, 8
states) guides all 6 plays. Per-round visual themes flow pool â†’ stage â†’
Phaser (apple/bird sprite defaults preserved; math never reads the theme).
Mute preference (`learnzzy.soundMuted.v1`) gates every voice call. `/play`
is a world selector; landing has CSS-only sky drift. Sketch guides are
pure vector (no image-asset failure mode). Stitch screens 12â€“20 were
followed from specs only â€” pixel parity NOT claimed (DEC-186, KI-021).

# 26. Stitch Retrieval + Attractiveness Pass â€” 2026-09-18
Stitch screens 12â€“20 are now fetched live, not speculated: `list_screens`
+ `get_screen` over the Stitch MCP (key from `STITCH_API_KEY`; note the
Windows curl.exe single-quote trap â€” request bodies must go in `@file`
form), then `curl -L` downloads. Cache holds 7 HTML + 9 screenshots; the 3
art boards ship as optimized 640px WebP postcards
(`public/assets/learnzzy/games/{clean-up,puzzle,sketch}/scene.webp`,
36â€“54KB, lazy `<img>`). Worlds without Stitch art use gradient scenes,
never invented imagery.

Presentation facts live in `src/lib/worlds.ts` + `WonderBits.tsx`
(`GuideCard`/`StepperTrail`/`QuestFeedbackBar`/`ClueButton`); registry,
character ids/mappings, voice scripts, game-copy functions, and e2e
contracts are untouched. Deliberate deviations (DEC-187): live WebGL
Shader rejected for battery/perf, subtraction host stays Teddy, Clean Up
mechanics unchanged, Stitch names display-only. Verified: unit 174/174,
typecheck, lint, build, Playwright child/sketch/discover/adaptive/
learning-journey, screenshot review of `/play` + addition + clean-up,
production `docker build` OK (invoke `docker.exe` by full path â€” bare
`docker` is shadowed per KI-022).

# 27. Worksheet-Inspired Learning Playground â€” 2026-09-18

/play is category-first: 6 Learning World cards (numbers/words/think/
create/discover/puzzles, `lib/categories.ts`) â†’ `/learn/[category]` â†’
16 activities (`lib/activityRegistry.ts`). Ten new activities (count,
order, before-after, shape-count, big-small, word-family, word-match,
trace-write, pattern, find-object) run on one generic engine: deterministic
generators (`lib/activityContent.ts`, no LLM, exactly-one-correct,
rotated positions/visuals) + reusable `ComplexityProfile`
(`lib/complexity.ts`, spec Â§27 baseline, timePressure always 0) +
`GET /api/activities/[id]/content` (learner skill-level lookup
best-effort, works without Mongo) + `ActivityPlayer` (hints teach
thinking, read-aloud, completion via existing game-events +
`academic/result`). Shipped engines linked, never duplicated (DEC-188).
Characters guide meaningfully (Teddy/Owl/Bunny/Monkey/Parrot states);
LEARNâ†’REVIEW staging via instruction + hints before scoring. Verified:
unit 182/182, typecheck, lint, `next build` 76 routes.

# 28. Animal Wonderland Rich + Home Learning World â€” 2026-09-18 (Session 10)

Landing (/) validated against new Stitch screens with `curl -L`:
`d14a9b61423...` (Animal Wonderland Child-First 3D Play Home) + `4b8445bd...`
(Three.js ANIMATION_45 Rich) under `.stitch/1495487808742926612/` and
`public/images/stitch/home-child-first-v2.png`. These validate
`f929a9c4a` + `b933...` (Â§4): copy/sections/badges identical; Rich scene
adds 5 candy mushrooms + 5 bobbing counting apples + 15 deterministic
warm stars + 4-bird formation + tap `jumpBoost` burst + snappier camera.
Updated `src/components/child/AnimalWonderland3D.tsx` (camera 4.5/20,
mushrooms, apples, 15 stars, 4 birds, `pointerdown` jump, deterministic
seeds, reduced-motion static frame) + `src/styles/globals.css` motion.

Landing is now category-primary per spec Â§2/Â§3 while keeping Stitch
hierarchy: hero â†’ giant CTA â†’ personalized `HomeContinue` ("Good
morning, N! Ready to explore?" + plan-first Continue card, `GET
/api/learners/.../plan` best-effort) â†’ Learning World category grid
(7 `CATEGORIES`, `lib/categories.ts`, `tactile` cards, `â†’` affordance)
â†’ quick-play shortcuts (5 Stitch tiles, secondary) â†’ games gallery â†’
voice board â†’ parent safety. `BrandLogo` (every header) now `â†’ /play`
(`src/components/brand/BrandLogo.tsx:3`).

Bug + hygiene fixes: `genTraceWrite` had `answerIndex: 0` regardless of
shuffle â†’ `options.indexOf(answer)` with tightened
`tests/activity-content.test.ts:18` (`options[answerIndex]==answer` for
every generator/band + expanded trace-write loop); `resolveComplexity`
dead `nudge` branching removed (no behavior change, `itemCount +1 @L4+`
only). Verified: `tsc --noEmit` 0, `eslint` 0, `npm test` 189/189 (was
182, now 47 suites), `next build` 0 (82 routes shown, First Load 148kB).

# 29. Calm Warm Female Voice Companion â€” 2026-09-18 (Session 11)

Voice is now a calm, warm, friendly female learning companion per spec:
moderate speed (0.82â€“0.88), soft volume (0.85), clear articulation, short
sentences, natural pauses (800ms default `pauseAfterMs` in `VoiceScript`),
low-medium energy â€” "I'm learning with a friendly teacher," never shouting.
Updated `src/lib/voice.ts` (13 events + `VoiceScript` {characterId,eventType,
text,ageBand,language,emotion,speakingRate,volumeProfile,pauseAfterMs},
`createVoiceScript`, `getVoiceProfile`, `addition/subtraction/ordering/
tracingTeaching` calm lines, 5-locale soft scripts), `src/lib/audio.ts`
(calm `CHARACTER_VOICES` 0.82â€“0.88 / pitch 0.97â€“1.05, throttle 900ms thinking
gap, volume 0.85, rate/pitch clamped moderate/soft), `src/lib/characters.ts`
`STATE_LINES` calm ("Wonderful. You got it.", "Not quite. Let's look
carefully.", "Take your time."). TTS remains cached (`voiceAssets`) + device
speech fallback; voice never blocks gameplay; mute respected; thinking moments
(2â€“4s quiet) honored by caller gating. Verified: `tsc` 0, `npm test` 190/190
(+1 calm-quality test), `next build` 0.

# 30. Organized Wonder Play + Docker-First MCP â€” 2026-09-18 (Session 12)

Gaps found: `/play` showed only 6 Worlds + 12 quick tiles (18/25 activities)
and used generic hub cards, not Stitch Category Hub tactile cards; 3D was
present but not unified as child-friendly wonderland; 7 activities missing:
`more-less`, `count-by-tens`, `trace-number-name`, `matching`,
`odd-one-out`, `pattern`, `shape-match`.

Fixed: `src/app/play/page.tsx` now shows **all 25/25** activities organized
by Wonder World with child-friendly Stitch language:
- Fixed `WonderArchipelago3D` (`ANIMATION_48`) full-screen archipelago
  (fog, point light, 3 biome islands, rainbow, 20 stars) + wonder-pill header
- `Featured Wonder Worlds` (6 `WonderWorlds` cards)
- `All Wonder Adventures` â€” 25 tiles grouped: Numbers & Math (8), Words (2),
  Write & Create (3), Think & Solve (7), Shapes & Visual (3), Discover &
  Puzzles (2), each with soft gradient, rounded-2xl, tactile shadow,
  category pill â€” 3D wonderland backdrop, Stitch Category Hub cards
  (6 hubs from `1b8480cd` HTML: Math Kingdom, Language Nest, Logic Grove,
  Rainbow Studio, Nature Savannah, Wooden Playroom, plus Shapes extra link)
  with `0_5px_0` tactile shadow.
All tiles `href` to `/learn/<category>/<id>` or `/play/<game>` and adapt
to age via `complexity.ts`; `BrandLogoâ†’/play` retained.

Docker-first MCP: `services/mcp/` unified shim (`Dockerfile` node:20-alpine
non-root, `HEALTHCHECK wget /health`) runs as 3 roles via `PROVIDER`
(`tutor-mcp:3001`, `oer-mcp:3002`, `ncert-mcp:3003`) + `qdrant:6333` (
`qdrant/qdrant:v1.9.4`). `docker-compose.yml` adds `learnzzy` bridge
network, service DNS (`http://tutor-mcp:3001`), private `expose` + host
`127.0.0.1:` mapping, volumes `tutor-data/oer-data/ncert-data/qdrant-data`,
`depends_on: service_healthy` chain, `docker-compose.prod.yml` hides ports
and adds log rotation. `.env.example` documents gateway URLs, `scripts/
docker-health.mjs` + `npm run docker:health` verifies web/MCP/qdrant health
and capabilities. Education Gateway unchanged â€” still advisory-only,
fail-closed, private network, no browser exposure, `MCP_UNAVAILABLE` never
breaks child gameplay. Verified: `tsc` 0, `npm test` 190/190, `docker
compose config` OK, `next build` 0.

Stitch screens `1b8480cd` (Category Hub), `a1812dc1` (Living Wonder
Archipelago), `9fa2f565` (ANIMATION_48), `0025936d`/`3f8523` (level maps)
and `f66f9a`/`38d899`/`77cc88` (Clean Up / Dino / Starlight) fetched via
`curl -L` to `.stitch/...` and `public/images/stitch/`; Category Hub HTML
now mirrors hub cards exactly.

# 31. All 25 Validated â€” Big & Small Maths Fix â€” 2026-09-18 (Session 13)

Child report: `Big & Small` showed identical emojis at same size so
biggest/smallest was invisible and â€œall maths not rightsâ€, plus some All
Wonder Adventures tiles appeared wrong/not opening.

Root cause `src/lib/activityContent.ts:239` `genBigSmall`: `visual` was
`sizes.map(()=>emoji)` at uniform `text-4xl` â€” deterministic answer
`targetPos+1` was correct maths but visually indistinguishable; `visualMeta`
was missing so `ActivityPlayer` could not scale. Age-graded subtlety also
absent (4â€“5 obvious vs 8â€“9 subtle).

Fix: `ActivityContent` adds optional `visualMeta?: {sizes:number[];
wantBiggest:boolean}`; `genBigSmall` now shuffles `sizes` deterministically,
computes `targetPos` correctly, stores `visualMeta`, keeps `answer =
String(targetPos+1)` + `uniqueOptions` 1..n, and `visualLabel` sizes.
`ActivityPlayer.tsx:158` now renders `big-small` with scaled pills:
`base 0.7â†’1.8` (4â€“5) / `0.8â†’1.5` (6â€“7) / `0.9â†’1.3` (8â€“9) â†’ `fontSize` and
`1..n` position badges so maths is visible and correct. Guarded
`contentId` includes sizes for determinism.

Validation of all 25 `All Wonder Adventures`:
â€” `validate-adventures.mjs` checks `activityFor` + `generateActivityContent`
across `4-5/6-7/8-9` for 19 generic generators and 6 game-route hrefs:
`25 ok, 0 fail, no duplicate hrefs, all categories valid` (numbers 8, words
2, write 3, think 7, shapes 3, discover&puzzles 2). `GET
/api/activities/[id]/content` still best-effort via `globalLevel+masteryâ†’
effectiveLevelâ†’resolveComplexity` with `visualMeta` passthrough; `page.tsx`
tiles map 1:1 to registry. MCP not required for deterministic generation;
gateway fallback remains. Verified: `npm test` 190/190, `npx tsc --noEmit` 0.

# 32. Global Level + Personalized Session Planner -- 2026-09-18 (Session 14)

Objective: one GLOBAL learner level (1..6+), no per-game levels visible;
skill mastery remains internal; activity complexity = GLOBAL + mastery +
interest + history (deterministic, small jitter last).

Implemented: src/services/personalizedSessionPlanner.ts -- deterministic
hashSeed/mulberry32, computeSkillMastery from gameProgress, scoring
(interest+need+masteryGap - variety - recency), category-variety, top-stays
+ rest shuffled, masteryAdj +1/-1 -> effectiveLevel -> resolveComplexity.
src/services/personalizationService.ts now delegates to planner, all
LearningPlan.items.level = globalLevel. src/services/levelService.ts
checkPromotion uses overall completions/avg + distinct games, max 6,
config fallback. src/repositories/learners.ts level: 1..6+ (was 1..5),
gameLevels legacy only. src/app/api/activities/[id]/content computes
globalLevel + masteryAdj -> effectiveLevel (not stored skillLevelFor).
New GET /api/learners/[id]/session returns PersonalizedSessionPlan
(activities with complexity, learningGoals). UI: GamePlan,
ContinueLearning, HomeContinue, parent/progress now show Global
Level only. Verified: npm test 190/190, tsc 0, two Level 5 learners with different mastery get different activities/complexity.

# 33. Natural Human-Like Female Voice -- Root Cause -- 2026-09-18 (Session 15)

Inspection of speechSynthesis, SpeechSynthesisUtterance,
getVoices, voiceAssetService, voice.ts, audio.ts shows current
voice is window.speechSynthesis parametric (eSpeak / old Microsoft) with
only rate/pitch tweaks (0.82-0.88/0.97-1.05), no SSML prosody, no
pauseAfterMs wait, no neural model, no caching/preload -- voiceAssets
rows stay pending (KI-020). Result fails child-first test (robotic,
high-pitch fallback, no breath).

Decision: do NOT rely on speechSynthesis as primary. Next implementation
will use server ttsProvider (tts-1-hd warm nova) -> voiceAssets
audioUrl -> HTMLAudio preload, speechSynthesis only offline fallback; cache keys stay deterministic,
gameplay never waits for TTS.
