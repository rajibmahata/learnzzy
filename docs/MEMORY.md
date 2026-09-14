# Learnzzy — Project Memory

**Document:** Persistent Project Context  
**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-09-13

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

The workforce has seven agents (personalization + QA added). Learners carry
optional nicknames, age bands, levels, progress, interests, and rewards;
promotion needs 3+ completions at 80%+ with max +1 level.

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
