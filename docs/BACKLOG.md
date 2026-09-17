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
and the learning-progress/content-variety work documented in
`LEARNING_PROGRESS_ASSESSMENT.md`.
Remaining backlog items are production-hardening or explicitly listed in
`NEXT_SESSION.md`. Per-item `Status: TODO` below remains authoritative for
granular tracking; the paragraph above is a progress snapshot, not a claim
that every sub-item acceptance criterion is closed.

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

# 42. Post-MVP Backlog

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

# 43. Product Guardrails

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

# 44. Final Definition of MVP

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

# 45. Backlog Execution Principle

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
