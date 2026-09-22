# Learnzzy — Product & Engineering Backlog

## 1. Purpose

This backlog is the implementation roadmap for Learnzzy.

It is derived from the agreed product direction:

> **Learnzzy — Play. Think. Learn.**

Learnzzy is a PWA-first educational playground for children with five initial learning games and an asynchronous agentic AI workforce that manages learning content, assets, quality, analytics, and difficulty.

### Core technology direction

```text
Frontend       Next.js + TypeScript
Game Engine    Phaser 3
UI             Tailwind CSS + reusable UI library
Database       MongoDB
Validation     Zod + deterministic business rules
Cache          Redis
Jobs           BullMQ
AI             GPT-5 nano / GPT-5 mini
Assets         S3-compatible object storage
CDN            Cloudflare
Deployment     Docker + Nginx + VPS
Monitoring     Sentry + structured logs
```

---

# 2. Backlog Rules

## Current Implementation Note

As of 2026-09-13, the five-game MVP, content pool, AI abstraction, agent
registry/task lifecycle, retryable queue, content/quality/asset/analytics/
difficulty/personalization/QA handlers, admin authentication, protected admin
APIs, command center UI, Docker/Nginx deployment baseline, and the adaptive
personalized-learning layer (learner profiles, age bands, 15 level configs,
progress + promotion, server rewards, interest signals, deterministic
personalization engine + learning plans, learner setup/plan/sticker UI, admin
learner-insights/levels/QA endpoints, Education Gateway with Tutor/OER/NCERT
adapters (mock-first, disabled by default), concept model, advisory-only
planner hook, OER content grounding with provenance, parent auth + pairing +
parent/child dashboards, admin education diagnostics, Sentry wiring, Redis-backed
rate limiting, prod deploy assets, backup script, and QA instructions) are
implemented and verified with lint, typecheck, 104 automated tests, 84 Playwright
specs, production build, Docker-stack smoke checks, a live pairing-chain
proof, a root-caused/fixed sketch engine outage (`SKETCH_DOCKER_ROOT_CAUSE.md`),
the learning-progress/content-variety work documented in
`LEARNING_PROGRESS_ASSESSMENT.md`, and (2026-09-17) the Agentic Academic
Engine + multi-character voice learning layer: deterministic academic core
(`src/lib/academic.ts`: LEARN→MASTER stages, review-first ordering,
interest+need balance, §16 recommendations, no-jump decisions,
`validateAcademicPlan` gate), `academicEngine` orchestrator + 8th
`academic-agent`, learner `/academic/plan|recommendation|voice|result` APIs,
admin academic inspection, Voice Character Engine (5×11×5, `voiceAssets`
cache, never live TTS in gameplay), dynamic visual themes + 5 cross-domain
combos, numbers/vocabulary catalog growth (13 categories), parent academic
rollup, and admin academic panel — verified with 156 unit tests, typecheck,
lint, and production build (81 routes).
Remaining backlog items are production-hardening or explicitly listed in
`NEXT_SESSION.md`. Per-item `Status: TODO` below remains authoritative for
granular tracking; the paragraph above is a progress snapshot, not a claim
that every sub-item acceptance criterion is closed.

Current verified extension (2026-09-22): Words & Phonics (19 families, 30 activities) + Mini Mission Engine (5 templates, 20/20 Playwright) + Child Identity/Session/Stickers + Living Reward World (53 world events, 254/254) + Stitch Game Section (Number Adventure ff9f32f + Fly Away 1120c83d, explicit Next Level, 780×1768). Unit tests 254/254 green; typecheck/lint pass; Stitch HTML/screenshots under `.stitch/1495487808742926612/`. Broader browser, live-Mongo, TTS, device validation remain open.

Priority:

```text
P0 = Must have for MVP / blocking
P1 = Important for MVP
P2 = Post-MVP
P3 = Future
```

Status:

```text
TODO
READY
IN_PROGRESS
BLOCKED
REVIEW
DONE
```

Development rules:

1. Do not build agents before the deterministic game foundation works.
2. Do not make gameplay dependent on real-time AI.
3. Do not use an LLM for arithmetic, scoring, animation, or basic interaction.
4. Validate every AI-generated content object with schemas and deterministic rules.
5. Reuse existing repository infrastructure wherever practical.
6. Build mobile-first and verify iPad behaviour.
7. Keep child UX simple; backend complexity belongs behind the scenes.
8. Avoid unnecessary forms and child accounts in the MVP.
9. Do not expose AI keys or internal reasoning to the browser.
10. Every completed item must be tested before being marked DONE.

---

# 3. Epic Overview

```text
EPIC 01  Repository & Architecture Foundation
EPIC 02  Design System & UI Library
EPIC 03  PWA Foundation
EPIC 04  Child Home & Navigation
EPIC 05  Game Framework
EPIC 06  Addition Game
EPIC 07  Subtraction Game
EPIC 08  Clean Up Game
EPIC 09  Picture Puzzle Game
EPIC 10  Shadow Sketch Game
EPIC 11  Gameplay Events & Sessions
EPIC 12  MongoDB Data Layer
EPIC 13  Content Pool
EPIC 14  AI Service
EPIC 15  Agent Infrastructure
EPIC 16  Content Agent
EPIC 17  Quality & Safety Agent
EPIC 18  Asset Agent
EPIC 19  Analytics Agent
EPIC 20  Difficulty Agent
EPIC 21  Admin Authentication
EPIC 22  Admin Dashboard
EPIC 23  Agent Command Center
EPIC 24  Content Management
EPIC 25  Asset Management
EPIC 26  Analytics Dashboard
EPIC 27  System Health & Observability
EPIC 28  Offline & Sync
EPIC 29  Security & Privacy
EPIC 30  Testing & QA
EPIC 31  Performance
EPIC 32  SEO & Public Landing
EPIC 33  Deployment
EPIC 34  Post-MVP Expansion
EPIC 35  Agentic Academic Engine (LZ-330–LZ-339, DONE 2026-09-17 except live-Mongo E2E/TTS binaries/Playwright/Stitch)
EPIC 36  Living Wonder Visual Upgrade (LZ-340–LZ-345, DONE 2026-09-18 except parent-journey screenshot/physical devices; pixel parity intentionally not claimed per DEC-187; Docker image build verified)
EPIC 36c Words & Phonics First-Class Track (LZ-351, DONE 2026-09-19 except broader browser/device QA)
EPIC 36d Mini Mission Engine (DONE 2026-09-19 except live-Mongo/device/TTS/Stitch QA)
EPIC 36e Child Identity, Session Resume & Unique Sticker Rewards (DONE 2026-09-20 except live-Mongo/device/TTS/Stitch QA)
EPIC 36f Integrated Child Onboarding & Learner Identity (DONE 2026-09-20 except live-Mongo/device/TTS/Stitch QA)
EPIC 36g Fix Session / Welcome / Game Navigation (DONE 2026-09-20 except Playwright Home→Welcome→Play coverage)
EPIC 36h Unified Game Progression, Feedback & Celebration (DONE 2026-09-20 — 6/6 core games + ActivityPlayer/MissionPlayer, `useSkillLevel` per-game)
EPIC 36i Living Reward World (DONE 2026-09-21 — 53 world events, full-viewport cinematic, 6 plays + missions, worldBoost)
EPIC 36j Stitch Game Section — Number Adventure & Fly Away (DONE 2026-09-22 — Stitch 1495487808742926612 ff9f32f/1120c83d, explicit Next Level)
```

---

# 4. EPIC 01 — Repository & Architecture Foundation

## P0

### LZ-001 — Audit Existing Repository

**Status:** TODO  
**Priority:** P0

Inspect:

- frontend
- backend
- package manager
- existing routes
- authentication
- database
- deployment
- AI integrations
- existing UI components
- environment configuration

**Acceptance Criteria**

- Architecture documented.
- Existing reusable components identified.
- Existing deployment process documented.
- No working functionality is unnecessarily rewritten.

---

### LZ-002 — Establish Project Structure

**Status:** TODO  
**Priority:** P0

Create a clean modular structure for:

```text
app
components
games
server
repositories
services
agents
workers
lib
validation
config
tests
docs
```

---

### LZ-003 — Environment Configuration

**Status:** TODO  
**Priority:** P0

Create environment configuration for:

```text
MONGODB_URI
REDIS_URL
AI_PROVIDER
AI_MODEL
AI_API_KEY
OBJECT_STORAGE_*
SENTRY_*
```

Secrets must never be committed.

---

### LZ-004 — Error Handling Foundation

**Status:** TODO  
**Priority:** P0

Create:

- standard API errors
- request IDs
- logging
- frontend error boundary
- child-safe error messages
- admin diagnostic errors

---

# 5. EPIC 02 — Design System & UI Library

## P0

### LZ-010 — Design Tokens

Create centralized tokens for:

- colours
- typography
- spacing
- radius
- shadows
- motion
- breakpoints
- z-index

---

### LZ-011 — Core UI Components

Implement:

```text
Button
IconButton
Card
Badge
Dialog
Modal
Toast
Input
Select
Tabs
Skeleton
Progress
```

---

### LZ-012 — Child Components

Implement:

```text
GameCard
GameHeader
GameShell
GameCanvas
AnswerButton
StarCounter
GameProgress
Celebration
Hint
HomeButton
```

---

### LZ-013 — Admin Components

Implement:

```text
AdminShell
AdminSidebar
MetricCard
AgentCard
AgentStatus
CommandCenter
ContentCard
ContentReview
ActivityFeed
SystemHealth
```

---

### LZ-014 — Accessibility

Verify:

- keyboard navigation
- focus states
- screen-reader labels
- contrast
- touch targets
- reduced motion
- no colour-only feedback

---

# 6. EPIC 03 — PWA Foundation

## P0

### LZ-020 — PWA Manifest

Implement:

- app name
- icons
- theme
- standalone display
- start URL
- appropriate metadata

---

### LZ-021 — Service Worker

Implement caching for:

- application shell
- static resources
- core game assets

---

### LZ-022 — Responsive Foundation

Support:

- mobile
- tablet
- iPad
- desktop
- portrait
- landscape

---

### LZ-023 — Safe Area Support

Implement device safe-area insets.

---

### LZ-024 — Installability

Verify PWA installation on supported browsers/devices.

---

# 7. EPIC 04 — Child Home & Navigation

## P0

### LZ-030 — Public Landing Page

Create:

- Learnzzy branding
- Play. Think. Learn.
- product explanation
- Start Playing CTA

---

### LZ-031 — Child Home Screen

Display five games:

```text
🔢 Numbers
🐦 Fly Away
🧹 Clean Up
🧩 Puzzle
✏️ Sketch
```

---

### LZ-032 — Child Navigation

Implement:

- Home
- Game selection
- Game entry
- completion
- return to home

---

### LZ-033 — Child-Friendly Copy

Use short language:

```text
Count them!
How many?
Try again!
Great job!
You did it!
Let's play!
```

---

# 8. EPIC 05 — Game Framework

## P0

### LZ-040 — Phaser Integration

Integrate Phaser into the Next.js game route.

---

### LZ-041 — Game Definition Interface

Create a common interface for:

- metadata
- content
- rendering
- interaction
- validation
- scoring
- completion

---

### LZ-042 — Game Lifecycle

Implement:

```text
LOADING
READY
PLAYING
SUCCESS
RETRY
COMPLETED
ERROR
```

---

### LZ-043 — Game Resize System

Support:

- responsive canvas
- touch
- mouse
- pointer
- safe areas
- orientation changes

---

# 9. EPIC 06 — Addition Game

## P0

### LZ-050 — Addition Gameplay

Implement visual addition.

Example:

```text
🍎🍎🍎 + 🍎🍎

How many?

[3] [4] [5] [6]
```

---

### LZ-051 — Addition Animation

Implement:

- object appearance
- grouping
- combining
- answer interaction
- success

---

### LZ-052 — Addition Validation

Deterministically calculate:

```text
a + b
```

Never trust generated answer.

---

### LZ-053 — Addition Difficulty

Implement:

```text
Level 1: 1–5
Level 2: 1–10
Level 3: 1–20
```

---

# 10. EPIC 07 — Subtraction Game

## P0

### LZ-060 — Subtraction Gameplay

Example:

```text
🐦🐦🐦🐦🐦

2 fly away.

How many left?
```

---

### LZ-061 — Subtraction Animation

Birds/objects visibly leave the scene.

---

### LZ-062 — Subtraction Validation

Deterministically calculate:

```text
start - removed
```

---

### LZ-063 — Subtraction Difficulty

Implement configurable ranges.

---

# 11. EPIC 08 — Clean Up Game

## P1

### LZ-070 — Scene Renderer

Create a reusable scene renderer.

---

### LZ-071 — Interactive Objects

Support:

- target objects
- non-target objects
- positions
- tap interaction
- basket/collection animation

---

### LZ-072 — Scene Themes

Initial themes:

```text
Bedroom
Classroom
Playground
Garden
Park
Beach
```

---

### LZ-073 — Completion

Show cleaned scene and reward.

---

# 12. EPIC 09 — Picture Puzzle

## P1

### LZ-080 — Puzzle Engine

Support:

```text
4 pieces
6 pieces
9 pieces
```

---

### LZ-081 — Drag & Drop

Support:

- touch
- mouse
- stylus/pointer

---

### LZ-082 — Snap Logic

Correct pieces snap into place.

Incorrect pieces gently return.

---

### LZ-083 — Puzzle Completion

Animate completed picture and award stars.

---

# 13. EPIC 10 — Shadow Sketch

## P1

### LZ-090 — Drawing Canvas

Support:

- touch
- mouse
- stylus
- pointer events

---

### LZ-091 — Guide Path

Render simple tracing guides.

---

### LZ-092 — Drawing Evaluation

Initial deterministic evaluation:

- path coverage
- completion
- approximate accuracy
- stroke count
- duration

---

### LZ-093 — Drawing Controls

Implement:

```text
Clear
Done
Try Again
```

---

# 14. EPIC 11 — Gameplay Events & Sessions

## P0

### LZ-100 — Anonymous Session

Create lightweight session identifiers.

No child PII.

---

### LZ-101 — Event Model

Support:

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

---

### LZ-102 — Event Batching

Batch events before sending to the server.

---

### LZ-103 — Offline Event Queue

Queue events locally when offline.

---

# 15. EPIC 12 — MongoDB Data Layer

## P0

### LZ-110 — MongoDB Connection

Create reliable connection handling.

---

### LZ-111 — Collections

Create data access for:

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
```

---

### LZ-112 — MongoDB Indexes

Implement indexes for:

```text
content(gameId, difficulty, status)
content(gameId, status, createdAt)
gameEvents(sessionId, createdAt)
gameEvents(gameId, event, createdAt)
agentTasks(status, createdAt)
agentRuns(agentId, startedAt)
```

Review indexes using actual query patterns.

---

### LZ-113 — Repository Layer

Keep MongoDB access behind repositories.

Routes must not contain raw database logic.

---

# 16. EPIC 13 — Content Pool

## P0

### LZ-120 — Content Schema

Create Zod schemas for each game.

---

### LZ-121 — Content Status

Support:

```text
draft
pending_validation
approved
rejected
disabled
```

---

### LZ-122 — Content Pool

Create per-game/difficulty pools.

---

### LZ-123 — Pool Threshold

Example:

```text
minimum = 30
target = 100
batch = 50
```

Make configurable.

---

### LZ-124 — Deterministic Content Generator

Create non-AI variations where practical.

---

# 17. EPIC 14 — AI Service

## P1

### LZ-130 — AI Provider Abstraction

Create:

```text
AIService
```

with operations such as:

```text
generateStructuredContent
classify
summarize
recommendDifficulty
```

---

### LZ-131 — Model Routing

Support configurable models:

```text
GPT-5 nano
GPT-5 mini
```

Do not hard-code a model into business logic.

---

### LZ-132 — Structured Output

Require validated structured output.

---

### LZ-133 — Token Usage

Record:

- model
- request count
- input tokens
- output tokens
- estimated cost
- task type

---

# 18. EPIC 15 — Agent Infrastructure

## P0

### LZ-140 — Agent Interface

Create standard agent contract.

---

### LZ-141 — Agent Registry

Register:

```text
Content Agent
Quality Agent
Asset Agent
Analytics Agent
Difficulty Agent
```

---

### LZ-142 — Agent Task Model

States:

```text
PENDING
RUNNING
WAITING_APPROVAL
COMPLETED
FAILED
CANCELLED
```

---

### LZ-143 — BullMQ Integration

Create queues and workers.

---

### LZ-144 — Retry System

Use exponential backoff with a maximum retry count.

---

### LZ-145 — Agent Observability

Track:

- execution time
- status
- items processed
- errors
- AI usage
- cost

---

# 19. EPIC 16 — Content Agent

## P0

### LZ-150 — Addition Generator

Generate structured addition content.

---

### LZ-151 — Subtraction Generator

Generate structured subtraction content.

---

### LZ-152 — Cleaning Generator

Generate scene configurations.

---

### LZ-153 — Puzzle Generator

Generate puzzle definitions.

---

### LZ-154 — Sketch Generator

Generate sketch/tracing definitions.

---

### LZ-155 — Automatic Pool Refill

Trigger generation when a pool falls below its threshold.

---

# 20. EPIC 17 — Quality & Safety Agent

## P0

### LZ-160 — Schema Validation

Reject invalid AI output.

---

### LZ-161 — Mathematical Validation

Verify addition/subtraction using application code.

---

### LZ-162 — Content Quality

Check:

- age suitability
- logical correctness
- consistency
- duplicates

---

### LZ-163 — Safety Validation

Reject unsafe or inappropriate generated content/assets.

---

### LZ-164 — Validation Report

Store validation results with content versions.

---

# 21. EPIC 18 — Asset Agent

## P1

### LZ-170 — Asset Registry

Track:

```text
assetId
type
theme
gameCompatibility
status
storageReference
hash
createdAt
```

---

### LZ-171 — Asset Reuse

Always search existing assets before generation.

---

### LZ-172 — Image Generation Pipeline

Implement:

```text
Request
 ↓
Generate
 ↓
Validate
 ↓
Optimize
 ↓
Store
 ↓
CDN
```

---

### LZ-173 — Image Optimization

Use suitable modern formats such as WebP/AVIF where supported.

---

# 22. EPIC 19 — Analytics Agent

## P1

### LZ-180 — Event Aggregation

Aggregate gameplay events.

---

### LZ-181 — Game Performance Analysis

Track:

- starts
- completions
- accuracy
- response time
- difficulty

---

### LZ-182 — Content Performance

Identify high/low-performing content.

---

### LZ-183 — Agent Recommendation

Generate operational recommendations.

Do not expose child diagnosis or unnecessary personal profiling.

---

# 23. EPIC 20 — Difficulty Agent

## P1

### LZ-190 — Difficulty Rules

Create configurable rules.

---

### LZ-191 — Performance Analysis

Identify:

- too easy
- appropriate
- too difficult

---

### LZ-192 — Recommendation Workflow

Produce recommendations.

Major changes require admin approval.

---

# 24. EPIC 21 — Admin Authentication

## P0

### LZ-200 — Admin Login

Create:

```text
/admin/login
```

---

### LZ-201 — Secure Session

Use secure server-side authentication/session handling.

---

### LZ-202 — Authorization

Protect:

```text
/admin/*
/api/admin/*
```

---

### LZ-203 — Login Rate Limiting

Prevent brute-force attempts.

---

# 25. EPIC 22 — Admin Dashboard

## P1

### LZ-210 — Admin Shell

Implement:

- sidebar
- header
- responsive navigation

---

### LZ-211 — Dashboard Overview

Show:

- games
- content
- agents
- system health
- recent activity

---

### LZ-212 — Agent Overview

Show agent status and latest tasks.

---

# 26. EPIC 23 — Agent Command Center

## P1

### LZ-220 — Command Input

Support natural-language admin commands.

---

### LZ-221 — Command Router

Map commands to structured tasks.

---

### LZ-222 — Confirmation Workflow

Consequential operations must use:

```text
Propose
 ↓
Explain
 ↓
Approve
 ↓
Execute
```

---

### LZ-223 — Command History

Store command/task history.

Do not store unnecessary sensitive information.

---

# 27. EPIC 24 — Content Management

## P1

### LZ-230 — Content List

Filters:

```text
Game
Difficulty
Status
Theme
Search
```

---

### LZ-231 — Content Preview

Preview the actual child experience where possible.

---

### LZ-232 — Approve/Reject

Support:

```text
Approve
Reject
Disable
Regenerate
```

---

### LZ-233 — Content Versioning

Never blindly overwrite production content.

---

# 28. EPIC 25 — Asset Management

## P2

### LZ-240 — Asset Library

Browse assets.

---

### LZ-241 — Asset Preview

Show generated artwork.

---

### LZ-242 — Asset Approval

Support approval/rejection.

---

### LZ-243 — Duplicate Detection

Use hashes/metadata to reduce duplicate generation.

---

# 29. EPIC 26 — Analytics Dashboard

## P1

### LZ-250 — Game Analytics

Charts:

- starts
- completion
- accuracy
- response time

---

### LZ-251 — Content Analytics

Show high/low-performing content.

---

### LZ-252 — Difficulty Analytics

Show performance by difficulty.

---

### LZ-253 — AI Cost Analytics

Show:

- requests
- tokens
- estimated cost
- cost by agent

---

# 30. EPIC 27 — System Health & Observability

## P1

### LZ-260 — Health Endpoint

```text
GET /health
```

---

### LZ-261 — API Health

```text
GET /api/health
```

---

### LZ-262 — Admin System Health

Check:

```text
API
MongoDB
Redis
BullMQ
Object Storage
AI Provider
```

---

### LZ-263 — Error Monitoring

Integrate Sentry or equivalent.

---

# 31. EPIC 28 — Offline & Sync

## P1

### LZ-270 — Cache Game Shell

Cache essential game resources.

---

### LZ-271 — Cache Content

Cache selected ready-to-play content.

---

### LZ-272 — Local Event Queue

Store events while offline.

---

### LZ-273 — Synchronization

Sync when connection returns.

Use client event IDs for deduplication.

---

# 32. EPIC 29 — Security & Privacy

## P0

### LZ-280 — API Validation

Validate all incoming requests.

---

### LZ-281 — AI Output Validation

Validate every AI response.

---

### LZ-282 — Secret Protection

Ensure no secrets reach the browser.

---

### LZ-283 — Rate Limiting

Protect:

- sessions
- events
- admin APIs
- AI generation

---

### LZ-284 — Child Privacy Review

Minimize child-related data collection.

---

### LZ-285 — Audit Logs

Record consequential admin actions.

---

# 33. EPIC 30 — Testing & QA

## P0

### LZ-290 — Unit Tests

Cover:

- arithmetic
- validation
- difficulty
- rewards
- schemas

---

### LZ-291 — API Tests

Cover all public/admin endpoints.

---

### LZ-292 — Agent Tests

Test:

- task creation
- execution
- retry
- failure
- approval
- idempotency

---

### LZ-293 — Game E2E Tests

Test all five games.

---

### LZ-294 — Responsive Tests

Verify:

```text
Android
iPhone
iPad
Desktop
```

---

### LZ-295 — Accessibility Tests

Run automated and manual checks.

---

# 34. EPIC 31 — Performance

## P0

### LZ-300 — Bundle Optimization

Implement:

- code splitting
- lazy loading
- route splitting

---

### LZ-301 — Game Asset Optimization

Optimize images and audio.

---

### LZ-302 — CDN

Serve large assets through CDN.

---

### LZ-303 — API Performance

Measure:

- content retrieval
- event submission
- session creation

---

### LZ-304 — No AI in Gameplay Path

Audit all gameplay flows and ensure no unnecessary synchronous AI request exists.

---

# 35. EPIC 32 — SEO & Public Landing

## P1

### LZ-310 — Metadata

Implement:

- title
- description
- Open Graph
- favicon
- PWA metadata

---

### LZ-311 — Sitemap

Create sitemap.

---

### LZ-312 — Robots

Create robots.txt.

---

# 36. EPIC 33 — Deployment

## P0

### LZ-320 — Docker

Create production Docker configuration.

---

### LZ-321 — Worker Deployment

Deploy:

```text
web
worker
```

---

### LZ-322 — MongoDB Configuration

Configure production MongoDB securely.

---

### LZ-323 — Redis Configuration

Configure production Redis securely.

---

### LZ-324 — Nginx

Configure:

- HTTPS
- reverse proxy
- compression
- security headers

---

### LZ-325 — Production Environment

Configure:

- environment variables
- secrets
- monitoring
- backups
- logs

---

### LZ-326 — Deployment Verification

Verify:

```text
/
health
/api/health
child gameplay
admin login
agents
MongoDB
Redis
PWA
```

---

# 37. MVP Milestones

## Milestone 1 — Foundation

Complete:

```text
LZ-001
LZ-002
LZ-003
LZ-004
LZ-010
LZ-011
LZ-012
LZ-020
LZ-021
```

Outcome:

> Running application foundation + design system + PWA shell.

---

## Milestone 2 — Game Framework

Complete:

```text
LZ-030
LZ-031
LZ-032
LZ-040
LZ-041
LZ-042
LZ-043
```

Outcome:

> Child can navigate into a functional game framework.

---

## Milestone 3 — Five Games

Complete:

```text
LZ-050–LZ-053
LZ-060–LZ-063
LZ-070–LZ-073
LZ-080–LZ-083
LZ-090–LZ-093
```

Outcome:

> Five polished learning games work without AI.

---

## Milestone 4 — Data & Content

Complete:

```text
LZ-100–LZ-103
LZ-110–LZ-113
LZ-120–LZ-124
```

Outcome:

> MongoDB-backed sessions, events, and structured content pools.

---

## Milestone 5 — AI Foundation

Complete:

```text
LZ-130–LZ-133
LZ-140–LZ-145
```

Outcome:

> AI service and background agent infrastructure.

---

## Milestone 6 — Agentic Content

Complete:

```text
LZ-150–LZ-155
LZ-160–LZ-164
LZ-170–LZ-173
```

Outcome:

> Autonomous content generation, validation, and asset management.

---

## Milestone 7 — Admin

Complete:

```text
LZ-200–LZ-203
LZ-210–LZ-212
LZ-220–LZ-223
LZ-230–LZ-233
```

Outcome:

> Secure AI-powered admin control center.

---

## Milestone 8 — Adaptive Platform

Complete:

```text
LZ-180–LZ-183
LZ-190–LZ-192
LZ-250–LZ-253
```

Outcome:

> Analytics-driven content and difficulty recommendations.

---

## Milestone 9 — Production Hardening

Complete:

```text
LZ-260–LZ-263
LZ-270–LZ-273
LZ-280–LZ-285
LZ-290–LZ-295
LZ-300–LZ-304
LZ-320–LZ-326
```

Outcome:

> Production-ready Learnzzy platform.

---

# 38. Recommended First Sprint

Do not start with all agents.

First sprint should focus on the child experience and technical foundation:

```text
1. Repository audit
2. Project structure
3. MongoDB connection
4. Design tokens
5. Core UI library
6. PWA shell
7. Child home
8. Phaser integration
9. GameDefinition interface
10. Addition game
```

The first visible success should be:

> Open Learnzzy → see five games → tap Numbers → play a complete animated addition activity.

---

# 39. Second Sprint

```text
1. Subtraction
2. Clean Up
3. Puzzle
4. Sketch
5. Game completion
6. Stars
7. Session/events
8. Mobile/iPad refinement
9. Accessibility
10. Offline shell
```

---

# 40. Third Sprint

```text
1. Content schemas
2. MongoDB content repository
3. Content pool
4. Deterministic content generation
5. AI service abstraction
6. GPT-5 nano/mini integration
7. Content Agent
8. Quality Agent
```

---

# 41. Fourth Sprint

```text
1. Asset Agent
2. Admin authentication
3. Admin dashboard
4. Agent dashboard
5. Content review
6. Agent Command Center
7. Analytics
8. Difficulty Agent
```

---

# 42. EPIC 35 — Agentic Academic Engine (2026-09-17)

## P1

### LZ-330 — Academic Orchestrator + Validated Learning Plan

**Status:** DONE  
Build `src/lib/academic.ts` + `src/services/academicEngine.ts` answering
"what should this learner learn next?" via the Education Gateway with
failure-isolated, advisory-only MCP use and a `validateAcademicPlan`
authority gate. Acceptance: spec-shaped plan validates; CoT/banned/jump
inputs rejected; gateway outage still yields a deterministic plan.

### LZ-331 — Academic Agent + Inspection

**Status:** DONE  
Register 8th least-privilege `academic-agent` (queue `academic-plan`),
`academicPlans` persistence, `GET /api/admin/academic/plans` + dashboard
panel. Acceptance: single + cohort tasks log operational summaries only.

### LZ-332 — Learn→Master Stages + Recommendations

**Status:** DONE  
Stage machine (no skips), review-first ordering, interest+need balance,
`GET .../academic/recommendation` (§16 shape), `POST .../academic/result`
→ continue/practice/review/+1/new-concept. Acceptance: 22 focused unit
tests green.

### LZ-333 — Parent Academic Reporting

**Status:** DONE  
`academic {learned/mastered/practicing, streakDays, nextActivity}` in
insights/progress + Progress page card. Acceptance: parent-safe reasons
only, no reasoning leakage.

### LZ-334 — Knowledge + Curriculum Grounding

**Status:** DONE  
`numbers`/`words` categories, prepared hi/bn/ta/te names, OER +4
summaries, NCERT foundational Grade-1 rows explicitly marked
non-official. Acceptance: catalog tests green (13 categories).

### LZ-335 — Voice Character Engine

**Status:** DONE  
5 characters × 11 events × 5 locales in `src/lib/voice.ts` (prepared
scripts, Parrot ladder). Acceptance: per-locale scripts resolve without
live translation; cache keys deterministic.

### LZ-336 — Voice Caching

**Status:** DONE  
`voiceAssets` cache + `resolveVoiceAsset` (never live TTS in request
path), client `speakWithCharacter`, Discovery best-effort character
voice. Acceptance: miss returns instant text; audio never blocks play.

### LZ-337 — Voice API

**Status:** DONE  
`POST .../academic/voice` (Zod-validated, rate-limited). Acceptance:
returns script + asset resolution for all 11 events × 5 locales.

### LZ-338 — Dynamic Visual Themes

**Status:** DONE  
`src/lib/visualThemes.ts` (10 themes) + content-agent object widening.
Acceptance: `verifyThemeMath` holds for every theme; math unchanged.

### LZ-339 — Cross-Domain Combos

**Status:** DONE  
5 combos resolving to validated games/concepts. Acceptance: each combo
maps to an allowlisted gameId with ≥1 known concept.

Remaining (NOT DONE, see KI-019/KI-020): live-Mongo E2E, TTS binary
generation pipeline, Playwright academic pass, Stitch validation.

---

# 43. EPIC 36 — Living Wonder Visual Upgrade (2026-09-17)

Visual/UX only: game logic, scoring, pools, agents, and APIs untouched.
Stitch screens 12–20 retrieved live 2026-09-18 (LZ-345, KI-021 RESOLVED);
pixel parity intentionally NOT claimed per DEC-186/DEC-187.

## P1

### LZ-340 — Character System + Guides

**Status:** DONE  
`src/lib/characters.ts` (8 purposeful friends, 8 states, aria labels) +
`CharacterGuide` + calm CSS loops (reduced-motion neutralized); integrated
into all 6 plays + `Celebration` (optional prop). Acceptance: 13 focused
unit tests green; states follow §8 mapping.

### LZ-341 — Number Orchard / Breeze Valley Themes

**Status:** DONE  
Pool `objects.type` passthrough (inline allowlist, pool-client stays
@/-free) + deterministic per-round fallback; stages + Phaser scenes take
optional emoji (apple/bird sprite defaults byte-identical); theme nouns in
aria labels. Acceptance: math paths untouched; canvas boots in e2e;
`verifyThemeMath` holds.

### LZ-342 — Voice Preference + Read-Aloud

**Status:** DONE  
Persisted mute (`learnzzy.soundMuted.v1`) honored by every voice call;
GameShell + Play Home toggles persist; addition/subtraction Read-aloud are
working mute-aware buttons. Acceptance: muted → `speak*` returns false and
stops active speech.

### LZ-343 — Worlds Selector + Landing Sky

**Status:** DONE  
`WonderWorlds` world cards on `/play` (names/taglines/hrefs preserved);
CSS-only SkyDrift landing hero. Acceptance: existing play-home e2e green
across 4 viewports; animations calm + reduced-motion safe.

### LZ-344 — Sketch Starlight + Asset Trace

**Status:** DONE  
Traced full asset lifecycle: guides are pure vector `guidePath` + Phaser
Graphics (zero image/URL references — no broken-image bug class); CSS-only
Starlight frame + Starlight-gold crayon (evaluation-blind). Acceptance:
sketch e2e green; trace documented in CURRENT_SESSION.md.

Remaining (NOT DONE): parent-journey screenshot re-fetch (expired URL),
physical devices. Pixel parity intentionally NOT claimed (DEC-187);
Docker production image build verified 2026-09-18
(`learnzzy:stitch-check` via explicit `docker.exe` path).

### LZ-345 — Stitch 12–20 Live Retrieval + Attractiveness Pass

**Status:** DONE (2026-09-18)  
Stitch MCP unblocked (`STITCH_API_KEY`; `@file` bodies for Windows
curl.exe): `list_screens` + 10× `get_screen`, then `curl -L` → 7 HTML + 9
screenshots in `docs/stitch_learnzzy_educational_kids_playground/`; 3 art
boards → 640px WebP postcards (`public/assets/learnzzy/games/…`,
36–54KB, lazy). New `src/lib/worlds.ts` (5 tests) + `WonderBits.tsx`
(`GuideCard`/`StepperTrail`/`QuestFeedbackBar`/`ClueButton`) + 3 calm CSS
keyframes; restyled Worlds selector, Play Home Pip/Spin, Addition,
Subtraction, Clean Up, Puzzle, Sketch — presentation only, mechanics/
scores/pools/agents/voice/e2e contracts untouched. Acceptance: unit
174/174, typecheck, lint, build, Playwright child/sketch/discover/
adaptive/learning-journey green; screenshot review of `/play` + addition +
clean-up; `docker build` green. Deviations: DEC-187; KI-021 RESOLVED.

---

# 43b. EPIC 36b — Worksheet-Inspired Learning Playground (2026-09-18)

Category-first playground (DEC-188): 6 Learning Worlds on `/play` →
`/learn/[category]` → 16 activities. Ten new activities share one generic
engine; shipped game engines linked, never duplicated. Results reuse
game-events + `academic/result` (no new contracts).

## P1

### LZ-346 — Learning World Categories + Registry

**Status:** DONE (2026-09-18)  
`src/lib/categories.ts` (6 categories with guide characters + skill lines)
+ `src/lib/activityRegistry.ts` (16 activities; shipped engines link via
`href`, new ones via `generator`) + `/learn/[category]` pages + category
cards on `/play` (`WonderWorlds` untouched). Acceptance: category is the
primary nav; no activity duplicated as a loose home card.

### LZ-347 — Complexity Model (§27 Baseline)

**Status:** DONE (2026-09-18)  
`src/lib/complexity.ts`: reusable `ComplexityProfile` + per-skill-family
baseline matrix (counting 1–10/1–50/1–100+, ordering 3/4–5/5–6 nums,
phonics letters/words/sentences, puzzles 4/9/16 pieces, …);
`timePressure` always 0; never hard-coded in components. Acceptance:
age changes the actual problem; `normalizeAgeBand` falls back to 6-7.

### LZ-348 — Deterministic Activity Generators

**Status:** DONE (2026-09-18)  
`src/lib/activityContent.ts`: 10 pure generators (count, order,
before-after, shape-count, big-small, word-family AN/EN/AT/AP/OG/IT,
word-match, trace-write, pattern AB/AAB/ABC, find-object) with stable
content IDs, exactly-one-correct + unique options, rotated
answer positions/visuals, teaching hints + explanations + voice lines.
Acceptance: post-conditions enforced (null on violation); 5 focused unit
tests green.

### LZ-349 — Activities API + Generic Player

**Status:** DONE (2026-09-18)  
`GET /api/activities/[activityId]/content` (ageBand + learner skill
lookup best-effort + `recentIds` exclusion; `409 USE_GAME_ROUTE` for
shipped engines) + `ActivityPlayer` (CharacterGuide states, hint ladder,
read-aloud, friendly offline state, completion via game-events +
`academic/result`) + `/learn/[category]/[activity]` routes. Acceptance:
unit 182/182, typecheck, lint, `next build` 76 routes green.

### LZ-350 — Adaptation + Parent/Gateway Wiring

**Status:** DONE (2026-09-18)  
No new contracts: completions flow through existing `skillLevels`
(per-skill ±1, rolling, never one-mistake drops) into parent
progress/insights and the advisory-only academic engine; MCP/gateway
untouched (fail-closed). Acceptance: pre-existing skill/adaptive suites
green; LEARN→REVIEW staging via instruction + hints before scoring.

Remaining (NOT DONE): broader Playwright `/learn` pass beyond the focused Words
mobile-320 coverage,
live-Mongo E2E (KI-019), TTS binaries (KI-020), physical devices, Stitch
validation of category/activity surfaces.

---

# 43c. EPIC 36c - Words & Phonics First-Class Track (2026-09-19)

Words & Phonics expands the generic Learning Playground without introducing a
parallel game engine. The shared `src/lib/words.ts` data model owns 19 seeded
word families, family validation, age-band complexity, and deterministic session
mixing. The registry and `/play` expose seven activities: word family/missing
letter, picture match, jumble, builder, family sorting, listening, and rhyme
discovery.

## P1

### LZ-351 - Words & Phonics Engine

**Status: DONE (2026-09-19)**

Added five deterministic generators (`word-jumble`, `word-builder`, `word-sort`,
`word-listen`, `word-discovery`), three generic player kinds (`build-order`,
`sort-choice`, `listen-choice`), reusable letter-tile/basket/listening controls,
registry metadata, seven `/play` tiles, and `tests/words-phonics.test.ts`.
Existing word-family and picture-match generators now use the same family data.
Acceptance: 213/213 unit tests, typecheck, lint, production build, and focused
mobile-320 Playwright coverage 4/4.

Remaining: broader `/learn/words` Playwright coverage, live-Mongo E2E (KI-019),
neural TTS assets (KI-020), physical devices, and Stitch validation.

---

# 43d. EPIC 36d - Mini Mission Engine (2026-09-19)

The Mini Mission Engine adds deterministic 3-10 minute learning adventures on
top of the existing activity and progression systems. It does not replace the
generic activity registry, five shipped games, server scoring, or MCP safety
boundaries.

## P1

### LZ-352 - Deterministic Mini Missions

**Status: DONE (2026-09-19)**

Added five approved mission templates, deterministic age-band planning, shared
primitive rendering, server-owned validation, server-derived rewards, mission attempts and evidence,
learner/parent projections, Mongo indexes, Today's Adventure, and the mobile
mission route. Added unit coverage for validation/planning and 20/20 Playwright
coverage across mobile-320, mobile, tablet, and desktop. `MISSION_ENGINE.md`
documents the contract.

Remaining: live-Mongo E2E, physical devices, neural TTS binaries, and Stitch
validation.

---

# 43e. EPIC 36e - Child Identity, Session Resume & Unique Sticker Rewards (2026-09-20)

Four connected experiences on the existing learner/progression architecture —
no second session system, no duplicate reward store, `learnerId` authoritative
throughout.

## P1

### LZ-353 - Identity & Resume

**Status: DONE (2026-09-20)**

`learnzzy.activeLearnerId` canonical pointer + device learner list,
`ChildSelector` on `/welcome` ("Who's playing today?"), welcome-back greeting
on home, per-learner session ids, `learnerId` stamped on every game event
(per-event wins, batch fallback; `sessions.learnerId` bound on first sight).
Docs: `CHILD_SESSION.md`.

### LZ-354 - Server-Authoritative Unique Stickers

**Status: DONE (2026-09-20)**

~50-emoji catalog (`src/lib/stickers.ts`, 8 categories, rarity organizes
only), `POST .../rewards/claim` selecting unowned stickers (unique
`rewardClaims.claimId` index; `$addToSet`; collection-complete instead of
duplicates), progress `completionId` idempotency, milestones 5/10/25/50
derived from count, per-learner device cache with server hydration, reconcile
in all 6 games + activities + missions, server-backed Sticker Garden with
silhouettes, parent recent achievement. Legacy shared rewards key retired;
legacy rewards POST delegates to claim (also fixing historic star
double-count). Docs: `REWARD_SYSTEM.md`, `STICKER_SYSTEM.md`.

### LZ-355 - Celebration consistency

**Status: DONE (2026-09-20)**

`Celebration` gains per-character praise lines, calm voice (never blocking),
`prefers-reduced-motion` support, milestone + count display — same component
and congratulations pattern across games, activities, and missions.

### LZ-356 - Picture Puzzle clarity + levels

**Status: DONE (2026-09-20)**

Phaser scene: golden selection ring, pulsing empty homes while a piece is
selected, green placed-glow (all reduced-motion safe). React: global-level
difficulty (4/6/9 pieces, same rule as addition) with LEVEL badge, live
"🧩 X of N pieces home" status, 1️⃣-2️⃣ guidance, per-placement "Nice!" and
per-picture "Great job!", final Celebration unchanged. Unit + e2e coverage.

Remaining: live-Mongo E2E (claim uniqueness/isolation/idempotency specs exist
and skip gracefully offline), physical devices, admin catalog UI, Stitch
validation of selector/garden/celebration surfaces.

---

# 43f. EPIC 36f - Integrated Child Onboarding & Learner Identity (2026-09-20)

Single-page progressive onboarding on the existing setup/learner/session/parent-link systems:
displayName + nickname (+ideas), 10-character companion picker (roster 8→12:
fox, panda, butterfly, lion) + companion naming, age (bands unchanged),
optional parent link (existing code/approve/revoke flow), welcome finale with
one-time sticker. `PATCH /api/learners/[id]` allowlist keeps `learnerId`
stable. Parent views show name/nickname/companion.

## P1

### LZ-357 - Onboarding single page + identity model + PATCH

**Status: DONE (2026-09-20)**

`CHILD_ONBOARDING.md`, `LEARNER_IDENTITY.md`, `PARENT_LINK.md`,
`SESSION_MODEL.md`. One scrollable `/welcome` with progressive unlock (locked
teasers, gentle scroll, shared guarded create). Unit (identity helpers,
12-character roster) + single-page Playwright flow + create/PATCH API specs
(DB-gated where server persistence is required). Full suite green; missions
20/20.

Remaining: live-Mongo onboarding E2E, QR pairing (no infra), admin catalog UI,
Stitch validation of the onboarding page (narrow + wide).

---

# 43g. EPIC 36g - Fix Session / Welcome / Game Navigation (2026-09-20)

Home → Welcome → Play with preserved `gameId` via `?next=` (sanitized), fixed
`ChildSelector` Continue bug (`/` → `next`), updated all Home entry points
(Tiles, Gallery, bubbles, sketch, discover, footer, `HomeContinue`) and
`LearnerSetup` post-creation to use `next` with shared guarded create. No new
learner/session architecture; authoritative `learnerId` isolation preserved.

## P1

### LZ-358 - Welcome next routing + Home entry points

**Status: DONE (2026-09-20)**

Welcome now `useSearchParams` + `Suspense` with sanitized `next`; ChildSelector
and LearnerSetup accept `next` and navigate there; Home entry points all use
`/welcome?next=/play/<game>`; `HomeContinue` also via welcome. Verified
typecheck, 248 unit tests, build; manual Home→Welcome→Play for all 5 games,
2-learner isolation, returning learner.

Remaining: Playwright Home→Welcome→Play coverage for all games + Stitch
validation of updated Home links.

---

# 43h. EPIC 36h - Unified Game Progression, Feedback & Celebration (2026-09-20)

Shared `GameResult` + `createRoundTransition` guard + `useRoundStatus` hook
(single timer + `countdown` + `advanceNow`); per-game skill levels via
`useSkillLevel` (not forced global) with `LEVEL {skill}` badge + difficulty
`ceil(level/2)`; `RoundFeedback` (one banner) replaces 4 UIs; `Celebration`
now shows `Level X ✓ Completed ↓ Level Y ★ Next`; `learnerSync` returns
`{claim, promotion, skill}` and caches `gameLevels`; integrated into
all 6 core games (Addition/Subtraction/Clean Up/Puzzle/Sketch/Discovery) +
`ActivityPlayer`/`MissionPlayer` use same `GameResult` contract with server
`completionId`/`claimId` idempotency and `maybeAdjustSkill`
(3 @80%+ promote, 5 @<50% ease); Home game image boxes + titles now also link
via `/welcome?next=` (previously only `Play Now` did).

## P1

### LZ-359 - Shared result contract + per-game levels + unified UI

**Status: DONE (2026-09-20) — 6/6 core games**

Shared contract `lib/gameFlow.ts` + `lib/useRoundStatus.ts` + `lib/useSkillLevel.ts`
+ `WonderBits/RoundFeedback` + `Celebration` levelProgress + `learnerSync`
extension. All 6 core games now show per-game `LEVEL` and `RoundFeedback`
(`Great job!` + balloon / `Try again!` + sad, same for Discovery) + `Celebration`
level progress; `Sketch` double-award fixed; `ActivityPlayer` hook order fixed;
Home image boxes + titles also link. Verified typecheck, 248 unit tests,
build; manual per-game levels differ and `Next` never before `feedback`.

Remaining: Playwright for unified `Next` + level-progression + Home image box + Stitch validation.

---

# 43i. EPIC 36i - Living Reward World (2026-09-21)

Data-driven living world on top of server-authoritative rewards, no second system. `src/lib/worldRewards.ts` 53 `WorldRewardEvent` configs covering every sticker category (jungle walk `rex/9 animals`, ocean sail `boat/dolphin`, sky fly `butterfly/bird`, garden grow `sunflower`, space launch `rocket`, magical `rainbow` etc.) + smart `CATEGORY_FALLBACK` keeping child's actual emoji. `src/components/child/WorldReward.tsx` full-viewport cinematic (`fixed inset-0`, environment gradients, RIGHT→LEFT walk/sail/fly `translateX±55vw` with dust/waves/sparkles, 3–8s, `prefers-reduced-motion` safe). Integrated into all 6 plays + `MissionPlayer` (Celebration fallback); `stickers.ts` `rex` added; `personalizedSessionPlanner` `worldBoost ≤0.35`; `tests/worldRewards.test.ts` 6 tests.

## P1

### LZ-360 - World event catalog + cinematic + missions

**Status: DONE (2026-09-21)**

53 configs, `WorldReward` full-viewport, 6 plays + missions, `worldBoost`, per-learner `learnzzy.rewards.v1.{id}` + `rewardClaims.claimId` unique + `completionId` preserved. Verified typecheck, 254/254, build green; Playwright world-reward visual pending.

---

# 43j. EPIC 36j - Stitch Game Section — Number Adventure & Fly Away (2026-09-22)

Fetch Stitch project `1495487808742926612` screens `ff9f32f8720b4cd79c61ae60c0ee43dd` (Number Adventure — Addition) + `1120c83d47414ff09ad1245b5b84998c` (Fly Away — Subtraction) via `stitch_get_screen` + `curl.exe -L` to `.stitch/1495487808742926612/{id}/screen.html` + `screenshot.png` (780×1768 mobile). Restyle `src/app/play/addition/AdditionPlay.tsx` (quest sub-header, stepper trail, `COUNT THEM!` prompt + `Read aloud`, two pill apple groups + count badges + `add` plus + `arrow_downward`, tactile 4-pad grid, feedback bar + **prominent Next** `Next Level →` / `Complete Level 🎉` + progress `h-2`) + `src/app/play/subtraction/SubtractionPlay.tsx` (`Sunny Meadow` gradient, `Sunny Sky` chip, `↗ −2 Flew Away` pill, dashed trails, `Bye bye! 💨` birds, wooden perch with numbered birds + `Still Perched!`, math strip, `+1 Star` footer) + same prominent Next Level (progress + `arrow_forward`, cancels 10s auto-next). Deterministic `useGameRounds`/`validate`/`reportGameCompletion`/`WorldReward` unchanged, no second session.

## P1

### LZ-361 - Stitch screens ff9f32f + 1120c83d + explicit Next Level

**Status: DONE (2026-09-22)**

Both screens downloaded and rendered; addition `COUNT THEM!` + subtraction `Sunny Meadow` match Stitch visuals while keeping `AdditionStage`/`SubtractionStage` logic; explicit `w-full h-14 bg-primary` Next Level button appears after `feedback !== "idle"` (with `countdown` progress + `LEVEL • Round X of 5`) and calls `goNext` (cancels auto-next, advances round or `WorldReward` on completion). Verified typecheck, 254/254; build env network-dependent (fonts `ENOTFOUND` previously hung, now `curl.exe -L` proven).

---

# 44. Post-MVP Backlog

## P2

- Parent dashboard
- Teacher dashboard
- More games
- More languages
- Richer accessibility
- AI drawing evaluation
- More advanced adaptive learning
- Content localization
- Theme packs
- Offline content packs
- Better asset generation pipeline
- Parent-controlled settings

## P3

- Native wrappers if required
- Multi-region infrastructure
- Advanced recommendation system
- Classroom functionality
- Teacher-created learning journeys
- Additional educational subjects
- Advanced AI tutoring

---

# 45. Product Guardrails

These items are permanently important.

### Never do

```text
LLM call for every click
LLM arithmetic validation
Child-facing unnecessary login
Advertising inside gameplay
Public child profiles
Public child chat
Uncontrolled autonomous destructive agents
Unvalidated AI-generated content
Unoptimized image generation on demand
```

### Always do

```text
Deterministic game logic
Structured content
Schema validation
Content quality checks
Safe asset pipeline
Background AI jobs
Caching
Mobile-first design
PWA support
Secure admin
Operational observability
Cost tracking
```

---

# 46. Final Definition of MVP

Learnzzy MVP is ready for production review when:

```text
✓ Five games work
✓ Child can play without login
✓ Mobile works
✓ iPad works
✓ Desktop works
✓ PWA works
✓ Game mechanics are deterministic
✓ MongoDB is integrated
✓ Content pool exists
✓ AI can generate structured content
✓ AI content is validated
✓ Content Agent works
✓ Quality Agent works
✓ Asset pipeline works
✓ Admin authentication works
✓ Admin dashboard works
✓ Agent status is visible
✓ Content can be reviewed
✓ Basic analytics work
✓ Token usage is tracked
✓ Offline shell works
✓ API security is implemented
✓ Tests pass
✓ Production deployment works
```

---

# 47. Backlog Execution Principle

The coding agent should always work in this sequence:

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

Never mark an item complete simply because code was written.

A backlog item is DONE only when its acceptance criteria are verified.

The ultimate goal is not to build a technically impressive AI system.

The goal is to build:

> **A fast, delightful learning playground that children want to use, while AI quietly makes the learning world richer in the background.**
