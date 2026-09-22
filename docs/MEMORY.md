# Learnzzy — Project Memory

**Document:** Persistent Project Context  
**Version:** 1.1  
**Status:** Active  
**Last Updated:** 2026-09-22 — Dynamic Non-Monotonous Engine Phase 2 & 3 (Session 27b)

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
   ↓
Next.js
   ↓
Game
   ↓
Deterministic Services
   ↓
Validated Content
```

Background path:

```text
Admin / Scheduler
   ↓
BullMQ
   ↓
Agent Worker
   ↓
AI
   ↓
Validation
   ↓
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

Words & Phonics uses the same architecture: deterministic server-side generators and
validators, adaptive age-band complexity, generic ActivityPlayer renderers, and existing
game-event/academic result reporting. `src/lib/words.ts` is the single source for seeded
word families and family validation; do not create per-activity word pools. MCP may advise
complexity but cannot score or block gameplay.

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
  ↓
validating
  ↓
approved
  ↓
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
Gateway output is advisory only — it annotates learning plans but never
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

Learning follows LEARN → PRACTICE → PLAY → RECALL → REVIEW → MASTER with no
stage skips and no multi-level jumps from a single result. Complexity is
per-skill; interest boosts priority but never overrides review/need.

Voice is prepared-per-language (en/hi/bn/ta/te), never live-translated:
`src/lib/voice.ts` defines Teddy/Bunny/Owl/Monkey/Parrot × 11 events;
`voiceAssets` caches (character, event, locale, text-hash) → audioUrl;
gameplay uses cached audio or instant device speechSynthesis and never calls
external TTS inline. Voice never blocks play; text always works.

Visual themes (10 deterministic objects) vary presentation only — the
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
        ↓
Generate only if needed
        ↓
Validate
        ↓
Optimize
        ↓
Object Storage
        ↓
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
 ↓
Home
 ↓
Choose game
 ↓
Play
 ↓
Celebrate
 ↓
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
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
REVIEW
   ↓
DOCUMENT
   ↓
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

# 23. Implementation Reconciliation — 2026-09-14

The latest supplied OpenCode session records the following as implemented and verified: MongoDB content/session/event repositories and indexes; seeded 100+100 active addition/subtraction pool items; pool-first gameplay content with deterministic fallback; client-side pool re-validation; Phaser visual stages for Addition and Subtraction; PWA icon/installability fixes; five registered agents with persisted lifecycle; BullMQ/Redis with in-process fallback; AI abstraction with usage/budget/mock support; admin authentication and protected admin operations; Docker Compose/Nginx baseline; and a passing verification suite including 17 tests in the latest pool/game session.

Important status rule: documentation must not claim that all five game renderers are complete merely because all five games are listed in the MVP. The latest session specifically identifies Clean Up renderer work as next and physical-device validation as still outstanding.

## Parent Experience

Parent login, secure parent-child linking, parent dashboard, activity, progress, rewards, insights, and learning plans are part of the approved architecture but are not yet verified as implemented in the supplied session evidence.

The parent relationship must use an explicit secure pairing/approval mechanism. Child name + age and parent name are profile information, not authentication.

# 24. Academic Engine Reconciliation — 2026-09-17

Implemented and verified (unit 156/156, typecheck, lint, production build
with 81 routes): Academic Orchestrator + `academic-agent` + Validated
Learning Plan APIs + Voice Character Engine (5 × 11 × 5) with `voiceAssets`
cache + dynamic visual themes + 5 cross-domain combos + numbers/vocabulary
catalog growth + parent academic rollup + admin academic panel. Provenance
rule: NCERT mock returns foundational-stage rows explicitly marked
non-official (`learnzzy-native`) — never claim CBSE alignment.

Status rule: do not claim live-Mongo E2E, real TTS binary generation,
Playwright academic coverage, or Stitch validation — all four remain open
(see KNOWN_ISSUES KI-019/KI-020 and NEXT_SESSION).

# 25. Living Wonder Reconciliation — 2026-09-17

Visual layer only; architecture unchanged. Character system
(`src/lib/characters.ts` + `CharacterGuide`: 8 purposeful friends, 8
states) guides all 6 plays. Per-round visual themes flow pool → stage →
Phaser (apple/bird sprite defaults preserved; math never reads the theme).
Mute preference (`learnzzy.soundMuted.v1`) gates every voice call. `/play`
is a world selector; landing has CSS-only sky drift. Sketch guides are
pure vector (no image-asset failure mode). Stitch screens 12–20 were
followed from specs only — pixel parity NOT claimed (DEC-186, KI-021).

# 26. Stitch Retrieval + Attractiveness Pass — 2026-09-18
Stitch screens 12–20 are now fetched live, not speculated: `list_screens`
+ `get_screen` over the Stitch MCP (key from `STITCH_API_KEY`; note the
Windows curl.exe single-quote trap — request bodies must go in `@file`
form), then `curl -L` downloads. Cache holds 7 HTML + 9 screenshots; the 3
art boards ship as optimized 640px WebP postcards
(`public/assets/learnzzy/games/{clean-up,puzzle,sketch}/scene.webp`,
36–54KB, lazy `<img>`). Worlds without Stitch art use gradient scenes,
never invented imagery.

Presentation facts live in `src/lib/worlds.ts` + `WonderBits.tsx`
(`GuideCard`/`StepperTrail`/`QuestFeedbackBar`/`ClueButton`); registry,
character ids/mappings, voice scripts, game-copy functions, and e2e
contracts are untouched. Deliberate deviations (DEC-187): live WebGL
Shader rejected for battery/perf, subtraction host stays Teddy, Clean Up
mechanics unchanged, Stitch names display-only. Verified: unit 174/174,
typecheck, lint, build, Playwright child/sketch/discover/adaptive/
learning-journey, screenshot review of `/play` + addition + clean-up,
production `docker build` OK (invoke `docker.exe` by full path — bare
`docker` is shadowed per KI-022).

# 27. Worksheet-Inspired Learning Playground — 2026-09-18

/play is category-first: 6 Learning World cards (numbers/words/think/
create/discover/puzzles, `lib/categories.ts`) → `/learn/[category]` →
16 activities (`lib/activityRegistry.ts`). Ten new activities (count,
order, before-after, shape-count, big-small, word-family, word-match,
trace-write, pattern, find-object) run on one generic engine: deterministic
generators (`lib/activityContent.ts`, no LLM, exactly-one-correct,
rotated positions/visuals) + reusable `ComplexityProfile`
(`lib/complexity.ts`, spec §27 baseline, timePressure always 0) +
`GET /api/activities/[id]/content` (learner skill-level lookup
best-effort, works without Mongo) + `ActivityPlayer` (hints teach
thinking, read-aloud, completion via existing game-events +
`academic/result`). Shipped engines linked, never duplicated (DEC-188).
Characters guide meaningfully (Teddy/Owl/Bunny/Monkey/Parrot states);
LEARN→REVIEW staging via instruction + hints before scoring. Verified:
unit 182/182, typecheck, lint, `next build` 76 routes.

# 28. Animal Wonderland Rich + Home Learning World — 2026-09-18 (Session 10)

Landing (/) validated against new Stitch screens with `curl -L`:
`d14a9b61423...` (Animal Wonderland Child-First 3D Play Home) + `4b8445bd...`
(Three.js ANIMATION_45 Rich) under `.stitch/1495487808742926612/` and
`public/images/stitch/home-child-first-v2.png`. These validate
`f929a9c4a` + `b933...` (§4): copy/sections/badges identical; Rich scene
adds 5 candy mushrooms + 5 bobbing counting apples + 15 deterministic
warm stars + 4-bird formation + tap `jumpBoost` burst + snappier camera.
Updated `src/components/child/AnimalWonderland3D.tsx` (camera 4.5/20,
mushrooms, apples, 15 stars, 4 birds, `pointerdown` jump, deterministic
seeds, reduced-motion static frame) + `src/styles/globals.css` motion.

Landing is now category-primary per spec §2/§3 while keeping Stitch
hierarchy: hero → giant CTA → personalized `HomeContinue` ("Good
morning, N! Ready to explore?" + plan-first Continue card, `GET
/api/learners/.../plan` best-effort) → Learning World category grid
(7 `CATEGORIES`, `lib/categories.ts`, `tactile` cards, `→` affordance)
→ quick-play shortcuts (5 Stitch tiles, secondary) → games gallery →
voice board → parent safety. `BrandLogo` (every header) now `→ /play`
(`src/components/brand/BrandLogo.tsx:3`).

Bug + hygiene fixes: `genTraceWrite` had `answerIndex: 0` regardless of
shuffle → `options.indexOf(answer)` with tightened
`tests/activity-content.test.ts:18` (`options[answerIndex]==answer` for
every generator/band + expanded trace-write loop); `resolveComplexity`
dead `nudge` branching removed (no behavior change, `itemCount +1 @L4+`
only). Verified: `tsc --noEmit` 0, `eslint` 0, `npm test` 189/189 (was
182, now 47 suites), `next build` 0 (82 routes shown, First Load 148kB).

# 29. Calm Warm Female Voice Companion — 2026-09-18 (Session 11)

Voice is now a calm, warm, friendly female learning companion per spec:
moderate speed (0.82–0.88), soft volume (0.85), clear articulation, short
sentences, natural pauses (800ms default `pauseAfterMs` in `VoiceScript`),
low-medium energy — "I'm learning with a friendly teacher," never shouting.
Updated `src/lib/voice.ts` (13 events + `VoiceScript` {characterId,eventType,
text,ageBand,language,emotion,speakingRate,volumeProfile,pauseAfterMs},
`createVoiceScript`, `getVoiceProfile`, `addition/subtraction/ordering/
tracingTeaching` calm lines, 5-locale soft scripts), `src/lib/audio.ts`
(calm `CHARACTER_VOICES` 0.82–0.88 / pitch 0.97–1.05, throttle 900ms thinking
gap, volume 0.85, rate/pitch clamped moderate/soft), `src/lib/characters.ts`
`STATE_LINES` calm ("Wonderful. You got it.", "Not quite. Let's look
carefully.", "Take your time."). TTS remains cached (`voiceAssets`) + device
speech fallback; voice never blocks gameplay; mute respected; thinking moments
(2–4s quiet) honored by caller gating. Verified: `tsc` 0, `npm test` 190/190
(+1 calm-quality test), `next build` 0.

# 30. Organized Wonder Play + Docker-First MCP — 2026-09-18 (Session 12)

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
- `All Wonder Adventures` — 25 tiles grouped: Numbers & Math (8), Words (2),
  Write & Create (3), Think & Solve (7), Shapes & Visual (3), Discover &
  Puzzles (2), each with soft gradient, rounded-2xl, tactile shadow,
  category pill — 3D wonderland backdrop, Stitch Category Hub cards
  (6 hubs from `1b8480cd` HTML: Math Kingdom, Language Nest, Logic Grove,
  Rainbow Studio, Nature Savannah, Wooden Playroom, plus Shapes extra link)
  with `0_5px_0` tactile shadow.
All tiles `href` to `/learn/<category>/<id>` or `/play/<game>` and adapt
to age via `complexity.ts`; `BrandLogo→/play` retained.

Docker-first MCP: `services/mcp/` unified shim (`Dockerfile` node:20-alpine
non-root, `HEALTHCHECK wget /health`) runs as 3 roles via `PROVIDER`
(`tutor-mcp:3001`, `oer-mcp:3002`, `ncert-mcp:3003`) + `qdrant:6333` (
`qdrant/qdrant:v1.9.4`). `docker-compose.yml` adds `learnzzy` bridge
network, service DNS (`http://tutor-mcp:3001`), private `expose` + host
`127.0.0.1:` mapping, volumes `tutor-data/oer-data/ncert-data/qdrant-data`,
`depends_on: service_healthy` chain, `docker-compose.prod.yml` hides ports
and adds log rotation. `.env.example` documents gateway URLs, `scripts/
docker-health.mjs` + `npm run docker:health` verifies web/MCP/qdrant health
and capabilities. Education Gateway unchanged — still advisory-only,
fail-closed, private network, no browser exposure, `MCP_UNAVAILABLE` never
breaks child gameplay. Verified: `tsc` 0, `npm test` 190/190, `docker
compose config` OK, `next build` 0.

Stitch screens `1b8480cd` (Category Hub), `a1812dc1` (Living Wonder
Archipelago), `9fa2f565` (ANIMATION_48), `0025936d`/`3f8523` (level maps)
and `f66f9a`/`38d899`/`77cc88` (Clean Up / Dino / Starlight) fetched via
`curl -L` to `.stitch/...` and `public/images/stitch/`; Category Hub HTML
now mirrors hub cards exactly.

# 31. All 25 Validated — Big & Small Maths Fix — 2026-09-18 (Session 13)

Child report: `Big & Small` showed identical emojis at same size so
biggest/smallest was invisible and “all maths not rights”, plus some All
Wonder Adventures tiles appeared wrong/not opening.

Root cause `src/lib/activityContent.ts:239` `genBigSmall`: `visual` was
`sizes.map(()=>emoji)` at uniform `text-4xl` — deterministic answer
`targetPos+1` was correct maths but visually indistinguishable; `visualMeta`
was missing so `ActivityPlayer` could not scale. Age-graded subtlety also
absent (4–5 obvious vs 8–9 subtle).

Fix: `ActivityContent` adds optional `visualMeta?: {sizes:number[];
wantBiggest:boolean}`; `genBigSmall` now shuffles `sizes` deterministically,
computes `targetPos` correctly, stores `visualMeta`, keeps `answer =
String(targetPos+1)` + `uniqueOptions` 1..n, and `visualLabel` sizes.
`ActivityPlayer.tsx:158` now renders `big-small` with scaled pills:
`base 0.7→1.8` (4–5) / `0.8→1.5` (6–7) / `0.9→1.3` (8–9) → `fontSize` and
`1..n` position badges so maths is visible and correct. Guarded
`contentId` includes sizes for determinism.

Validation of all 25 `All Wonder Adventures`:
— `validate-adventures.mjs` checks `activityFor` + `generateActivityContent`
across `4-5/6-7/8-9` for 19 generic generators and 6 game-route hrefs:
`25 ok, 0 fail, no duplicate hrefs, all categories valid` (numbers 8, words
2, write 3, think 7, shapes 3, discover&puzzles 2). `GET
/api/activities/[id]/content` still best-effort via `globalLevel+mastery→
effectiveLevel→resolveComplexity` with `visualMeta` passthrough; `page.tsx`
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


# 34. Global Level Journey + Auto-Next + Interactive Feedback � 2026-09-19 (Session 16)

Exercise flow redesigned as ONE continuous journey: all games share GLOBAL Level (1..6) visible as "LEVEL N" on every screen (ActivityPlayer, AdditionPlay, SubtractionPlay). No per-game levels visible; skill mastery stays internal via evaluateSkill.

Flow: Exercise starts -> Child solves -> Answer submitted -> Server validates -> Correct? YES -> SUCCESS (green) : NO -> RETRY (red, sad) -> Feedback -> Next enabled -> 10s countdown (progress bar + Next in Xs) -> Automatic next exercise (setTimeout 10000, cancel on manual Next/unmount). Implemented in ActivityPlayer (countdown state + useEffect) and Addition/Subtraction plays (globalLevel from getCachedProfile, difficulty = ceil(global/2), goNext + startCountdown).

Complexity: GLOBAL + AGE BAND + LEARNER PERFORMANCE + SKILL MASTERY + INTEREST + RECENT -> Activity Complexity. Age bands provide safe boundaries (4-5 simple, 6-7 intermediate, 8-9 advanced) but do not alone determine exercise. MCP (Tutor) advisory for complexity via Education Gateway (recommendNextActivity, 800ms timeout, validated: schema, age-band, global-level, skill, bounds, safety, game capability) with deterministic fallback (PersonalizationService + age rules). MCP failure never blocks child (catch -> fallback).

Files: src/components/child/ActivityPlayer.tsx (LEVEL N badge, success/retry UI, countdown), src/app/play/addition/AdditionPlay.tsx + subtraction (globalLevel, countdown, difficulty from global), src/app/api/activities/[id]/content (globalLevel+masteryAdj+mcpAdj -> effectiveLevel), src/services/personalizedSessionPlanner.ts, src/services/levelService.ts (overall promotion). Verified: npm test 190/190, tsc 0.


# 35. Mini Mission Engine (Additive Deterministic Layer) - 2026-09-19 (Session 18)

Five approved mission templates (remember-find, sort-group, build-word,
change-one-thing, find-difference), deterministic age-band planner,
ActivityRenderer primitives, server-owned validation, mission
attempts/evidence/parent projections, five Mongo collections + indexes,
Today's Adventure on landing, `/missions/[missionId]` route. Server derives
stars from accuracy; planner penalizes recent templates; skills endpoint adds
`missionSkills`. Verified: 213 unit tests, typecheck, lint, build, mission
Playwright 20/20 x4 viewports. Open: live-Mongo E2E, devices, TTS, Stitch.


# 36. Child Identity, Unique Stickers, Celebration, Puzzle Clarity - 2026-09-20 (Session 19)

Identity is learnerId (nickname display-only). `learnzzy.activeLearnerId` +
device learner list + ChildSelector + welcome-back greeting; per-learner
session ids; learnerId stamped on every event (per-event wins). Server picks
every sticker (claim endpoint, unique claimId, $addToSet, collection-complete
never duplicates); progress owns stars via completionId idempotency (legacy
rewards mirror fixed: no more star double-count). ~50-emoji catalog, milestones
5/10/25/50 derived from count, per-learner cache + reconcile in 6 games +
activities + missions, server-backed Sticker Garden, parent recentSticker. One
"Great job!" + balloon-burst celebration everywhere (reduced-motion safe).
Puzzle: selection ring, pulsing homes, placed glow, global-level difficulty
4/6/9 + LEVEL badge, live progress, praise. Verified: 231 unit tests,
typecheck, lint, build, identity+puzzle e2e 28 passed (16 DB-gated skip
offline), missions 20/20. Open: live-Mongo claim/isolation/idempotency E2E,
devices, admin catalog UI, Stitch.

# 37. Fix Learnzzy Session / Welcome / Game Navigation - 2026-09-20 (Session 22)

Home → Welcome → Play preserves the selected game via `?next=` (sanitized to
internal `/play`/`/learn` only). `/welcome` now reads `next` via
`useSearchParams` + `Suspense` and passes it to `ChildSelector` (Continue
now `router.push(next)` instead of `"/"`) and `LearnerSetup` (post-creation
also `router.push(next)` with shared guarded create). All Home entry points
(Tiles, Gallery, speech bubbles, Starlight Trace, Discovery World, footer,
`HomeContinue`) updated to `/welcome?next=/play/<game>`. Session isolation
remains via authoritative `learnerId`/`activeLearnerId` with no default
player fallback; returning learner and 2-learner isolation verified.
Verified: typecheck, 248 unit tests, build (lint skipped for speed), manual
Playwright Home→Welcome→Play for all 5 games.

# 38. Unified Game Progression, Feedback & Celebration - 2026-09-20 (Session 23)

Shared `GameResult` (`CORRECT/INCORRECT/COMPLETED`, `isGameComplete`) +
`createRoundTransition` guard (`idle→feedback→advancing→done` rejecting double
taps and `Next` before `feedback`) and `useRoundStatus` hook (single timer +
`countdown` + `advanceNow` race-safe, `autoAdvanceMs` `null` for missions).
Per-game skill levels via `useSkillLevel` (reads `skillLevelFor` from cached
profile, live refresh on `learnzzy:rewards`) — `LEVEL {skill}` badge now
per-game, not forced global, with difficulty `ceil(level/2)` so 5- and 8-year-
olds get different challenges at same global. `RoundFeedback` (one green/red
banner) replaces 4 different UIs; `Celebration` now shows `Level X ✓ Completed
↓ Level Y ★ Next` or `keep practicing` via `levelProgress`. `learnerSync`
returns `{claim, promotion, skill}` and caches `gameLevels` locally;
`recordGameResult` + `maybeAdjustSkill` remain server-authoritative (3 @80%+
to promote, 5 @<50% to ease). Integrated into all 6 core games
(Addition/Subtraction/Clean Up/Puzzle/Sketch/Discovery) + `ActivityPlayer`/
`MissionPlayer` use same `GameResult` contract with `reconcileSticker` and
server `completionId`/`claimId` idempotency. Home image boxes + titles now also
link via `/welcome?next=`; Discovery right/wrong both use `RoundFeedback`.
Verified: typecheck, 248 unit tests, build, manual per-game levels differ and
`Next` never fires before feedback.

# 39. Child-Friendly Voice — Real Audio Fix - 2026-09-20 (Session 24)

Voice was one generic warm-adult `speechSynthesis` voice everywhere
(`rate 0.82–0.88 / pitch 0.97–1.05`, `pickCalmFemaleVoice`, `pitch ≤1.1`
clamp, no `characterId`, no sound). Replaced with 9 child-friendly
`COMPANION_CHILD` profiles (Bunny 1.18/0.92 … Butterfly 1.22/0.96), child-voice-
first selection (`child/young/kid` → companion hints → warm female), pitch
clamp `1.35` + `playCompanionSound` (Web Audio per-companion chime/pop/twinkle
`correct/encourage/celebrate`) triggered via `speakWithCharacter(..., {characterId})`,
and more playful `companion.ts` drift (`±0.025 / ±0.04` within `0.82–0.99 /
1.05–1.28`). All 6 games + `Celebration`/`MissionPlayer` now pass
`characterId` so the sound is friend-specific; `companion.test.ts` bounds
updated. Still deterministic, offline, no LLM. Verified: typecheck, 248/248,
build, manual Home image + Discovery `Great job!` + balloon.

# 40. Living Reward World — 2026-09-21 (Session 25)

Additive data-driven world on top of server-authoritative rewards, no second
system. `src/lib/worldRewards.ts` — 53 `WorldRewardEvent` configs covering
every `STICKER_CATEGORIES` id (jungle walk `rex🦖/lion/tiger/elephant`,
ocean sail `boat⛵/dolphin/waterfall`, sky fly `butterfly/bird/dragon`,
garden grow `sunflower/tree/apple`, space launch `rocket/planet`, magical
`rainbow/unicorn/castle` etc.) + smart `CATEGORY_FALLBACK` that keeps the
child's actual `emoji`/`category` when a specific config is missing.
`src/components/child/WorldReward.tsx` — `fixed inset-0` full-viewport
cinematic (not `max-w-game` clipped), environment gradients,
RIGHT→LEFT walk/sail/fly `translateX±55vw` with scale/dust/waves/sparkles,
3–8s, `prefers-reduced-motion` safe (no translate, fade only),
`CharacterGuide` curious→surprised→celebrating + `praiseFor` + child-
friendly voice per companion. Integrated into all 6 plays
(`addition/subtraction/clean-up/puzzle/sketch/discover`) + `MissionPlayer`
(`Celebration` remains fallback); `stickers.ts` `rex` added.
`personalizedSessionPlanner.ts` now gently boosts `learningThemes/
gameAffinity` from owned world rewards (`worldBoost ≤0.35`, interest/need
still dominate). Tests: `tests/worldRewards.test.ts` 6 deterministic tests
(rex jungle, boat ocean, seed variant, missing fallback). Verified:
typecheck, 254/254, build green; per-learner `learnzzy.rewards.v1.{id}`
+ `rewardClaims.claimId` unique + `completionId` idempotency preserved;
offline/duplicate/reload safe.

# 41. Stitch Game Section — Number Adventure & Fly Away — 2026-09-22 (Session 26)

Stitch project `1495487808742926612` screens `ff9f32f8720b4cd79c61ae60c0ee43dd`
(Number Adventure — Addition, 780×1768) + `1120c83d47414ff09ad1245b5b84998c`
(Fly Away — Subtraction) fetched via `stitch_get_screen` + `curl.exe -L`
to `.stitch/1495487808742926612/{id}/screen.html` + `screenshot.png`.
`src/app/play/addition/AdditionPlay.tsx` + `subtraction/SubtractionPlay.tsx`
restyled to Stitch while keeping deterministic `useGameRounds`/
`additionGame.validate`/`subtractionGame.validate`/`reportGameCompletion`/
`WorldReward` (no gameplay rewrites, no second session):
addition — quest sub-header (home + `Number Adventure` pill + stars + `LEVEL`),
stepper trail (`check`/active `2`/pending/`lock`), `COUNT THEM!` prompt +
`Read aloud` pill, two `bg-surface-container-lowest` apple groups with count
badges + pulsating `add` plus + `arrow_downward` + tactile 4-pad grid
(`h-20` `shadow-[0_6px_0_#d5e3fc]`, correct `bg-tertiary-fixed`), feedback bar
(`lightbulb` + `star`) + **prominent Next** (`w-full h-14 rounded-full
bg-primary shadow-[0_5px_0_#004395]` → `Next Level →` / `Complete Level 🎉`
+ progress `h-2` + `LEVEL • Round X of 5`, cancels 10s auto-next on tap);
subtraction — `Sunny Meadow` stage (`primary-fixed` gradient, `Sunny Sky`
chip, `↗ −2 Flew Away` pill, dashed flight trails SVG, `Bye bye! 💨`
bouncing departing birds, wooden perch `bg-secondary` with numbered remaining
birds + `Still Perched!` bubble, math strip `5 Birds − 2 Flew = ?`, 4-pad
grid with `birds` labels, encouragement footer `touch_app +1 Star`) + same
**prominent Next Level** (progress + `arrow_forward`). `GameShell`/
`CharacterGuide` untouched; logic, scoring, pools, agents unchanged.
Verified: typecheck, 254/254; `src/app/play/addition` + `subtraction` visually
match Stitch screenshots; explicit Next guarantees child can continue next
level without waiting for auto-advance.

# 42. Game Complete — Try Again → Continue Harder — 2026-09-22 (Session 26b)

On `done` with `isTryAgain = mistakeRounds.size > 0`, `src/app/play/addition/AdditionPlay.tsx` + `subtraction/SubtractionPlay.tsx` now show an explicit **Continue** that redirects to the next level and makes the game harder, even after a retry/low-accuracy run (child still feels progression, not stuck). `src/components/child/WorldReward.tsx` extended with `continueLabel?: string` (world cinematic now shows `Continue — Try Harder 💪` on retry vs `Continue → Next Level` on success, `onContinue` + `onReplay` both present). `handleContinueHarder` bumps `GLOBAL LEVEL` (`Math.min(6, prev+1)`, persisted to `learnzzy.learner.v1.level` + `learnzzy.globalLevel.v1`), clears `mistakeRounds`/`hintOpens`, resets `round/picked/feedback/done/reward` and `reload()`s with `difficulty = ceil(globalLevel/2)` → strictly harder numbers/birds (e.g. 1–5 → 1–10 → 1–20). `Celebration` fallback shows `Good try! Keep going!` + fixed bottom `Continue` (`LEVEL {n} → {n+1} • Harder!` + `arrow_forward`). Per-round `Next Level` (`feedback !== "idle"` → `h-2` progress + `Next Level →` / `Complete Level 🎉`, `startCountdown(goNext)` 10s cancellable) remains for stepping. Verified: typecheck, 254/254; `WorldReward` `prefers-reduced-motion` and `isSoundMuted` preserved; no second reward/session; deterministic `validate` unchanged.

# 43. Phase 2 Core Engine — Learning Adventure World — 2026-09-22 (Session 27)

Additive scalable world architecture without rewriting `activityRegistry`/`personalizedSessionPlanner`. `src/lib/learningWorlds.ts` — 15 `LearningWorld` (`colors,animals,birds,insects,nature,dinosaurs,ocean,words,numbers,thinking,creative,robots,fruits,space,stories`) each `mechanics[]` distinct, `validateWorlds()`. `src/lib/learningActivities.ts` — `LearningActivity {id,type:GAME|MISSION|DISCOVERY|STORY|CREATIVE|EXTERNAL_STORY, world, category, skill, ageBands, difficulty, mechanics, theme, estimatedDuration, rewardTags, safetyStatus, provenance, status, href, title, icon}` Zod `learningActivitySchema`, `LEARNING_ACTIVITY_REGISTRY = ACTIVITY_REGISTRY→legacyToLearning + 9 representative new` (`color-detective, animal-safari, butterfly-garden, memory-mission, rex-color-adventure STORY, robot-path, fruit-sorting, draw-a-monster CREATIVE, ext-ocean-wonders EXTERNAL_STORY` curated), `validateLearningActivities()`. `src/lib/activityVarietyEngine.ts` — `ActivityFingerprint`, `repetitionPenalty` (recency-weighted 0..3), `isBoringRepeat` (3-in-a-row same world/mechanic), `varietyJitter` deterministic. `src/lib/learningAdventureEngine.ts` — `recommendNextActivity({learnerId,ageBand,globalLevel,skill,recentPerformance,recentMistakes,completed/abandoned,recent fingerprints/gameTypes/mechanics/themes,interests,unlockedRewardIds,contentAvailability,cognitiveLoad})` → `NextLearningActivity {activity,reason,priority,explainability,href}` scoring `interest + need + masteryGap - varietyPenalty - boringExtra - cognitivePenalty + worldBoost≤0.35 + recentMistakeBoost + struggleBoost + jitter`, age/status/pool filtered, `EXTERNAL_STORY` only when approved, falls back to deterministic local on gateway/MCP failure (`recommendNextActivitySafe`). `src/lib/activitySelector.ts` — `selectNextAdventureActivity` + `selectHomeAdventures` (3, no duplicates, world-varied). `src/components/learner/DynamicAdventureHome.tsx` + `src/app/api/learners/[learnerId]/next-adventure/route.ts` — `🌟 Today's Adventure — Rex needs your help! [START ADVENTURE]` + `Recommended for you` 3 varied world cards (`DISCOVER•PLAY•THINK•CREATE•EXPLORE`), fallback deterministic. Tests: `tests/learning-adventure.test.ts` 9 tests (15 worlds, covers all worlds, 6 types, external curated, age filter, variety penalizes repeats, boring detection). Verified: typecheck, 263/263 (254+9), build green.

# 44. Phase 3 Dynamic Non-Monotonous Engine � Balloon & Many Experiences � 2026-09-22 (Session 27b)

Same skill via many experiences per spec �2: addition now has 6 distinct mechanics with same additionGame.validate (math unchanged) � balloon-pop-addition (Balloon Pop), dinosaur-eggs (nest 3+2), fruit-basket-addition (drag), rocket-fuel (fuel cells->launch), bee-garden-count, treasure-hunt � each world/theme/mechanics/rewardTags distinct, added to learningActivities.ts NEW_ACTIVITIES (now 15 representative + 6 addition variants, total 21 new, LEARNING_ACTIVITY_REGISTRY = 25 legacy + 21 = 46). src/lib/balloonMechanic.ts � reusable Balloon {id,payload,payloadKind:"number"|"color"|"letter"|"reward", color, size, speed, x, delayMs} + generateBalloons({payloadKind,count,targetColor/targetLetter,difficulty,seed}) deterministic mulberry32 + BALLOON_COLOR_BG + balloonForTheme (colors->RED, words->B, numbers->5) + validateBalloonPop + shuffle; src/components/child/BalloonStage.tsx � relative h-64 overflow-hidden bg-gradient with absolute bottom-0 balloons animate-bounce per speed/delay, popped -> scaled, onPop callback, tactile 44px+. src/lib/dynamicActivityEngine.ts � chooseDynamicActivity (activity+mechanic+theme+environment+difficulty+content+reward+celebration) picks environment via worldToEnv avoiding immediate repeat (Jungle/Ocean/Space/Garden/Farm/Dinosaur Valley/Rainbow Sky etc.), mechanic not recently used, difficulty from explainability, content {activityId,mechanic,theme,environment,difficulty,seed}, reward via worldRewards, celebration map (balloon-burst/dinosaur-walk/boat-sail/butterfly-fly/robot-roll), MCP via educationGateway recommendNextActivity {learnerId,ageBand,currentLevel,recentGameIds,focusConceptIds} + searchEducationalContent advisory-only (Zod+age+safety validated, MCP_UNAVAILABLE -> deterministic local, child never waits, no URL). src/app/page.tsx already hosts DynamicAdventureHome (Phase 2). Tests: tests/dynamic-activity.test.ts 6 tests (pop N, pop RED, theme helper, addition many mechanics, env dynamic, same skill via different worlds) -> 269/269 (263+6). Verified: typecheck, 269/269, build green; addition math still a+b, subtraction still start-removed, no second progression/reward/parent system, mobile/PWA full-viewport, prefers-reduced-motion safe.
