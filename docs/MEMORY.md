# Learnzzy — Project Memory

**Document:** Persistent Project Context  
**Version:** 1.1  
**Status:** Active  
**Last Updated:** 2026-09-18

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
