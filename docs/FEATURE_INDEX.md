# Learnzzy — Feature Index

**Document:** Master Feature & Capability Index  
**Version:** 1.0  
**Status:** Active / Implementation Reference  
**Last Updated:** 2026-09-13

---

## 1. Purpose

This document is the single navigation index for Learnzzy product features.

It maps:

- Product capabilities
- Child-facing features
- Five MVP games
- Gameplay infrastructure
- PWA capabilities
- Content and asset systems
- AI services
- Agent workforce
- Admin capabilities
- Analytics
- Security and privacy
- Offline/synchronization
- Performance
- SEO
- Deployment
- Testing
- Future capabilities

to the relevant backlog IDs and source documents.

This document is an **index**, not the detailed specification for every feature.

Detailed behavior must remain in the appropriate source-of-truth document.

---

# 2. Source-of-Truth Hierarchy

When documents appear to conflict, use this hierarchy:

```text
DECISIONS.md
     ↓
BUSINESS_RULES.md
     ↓
DATABASE.md / API.md / ARCHITECTURE.md
     ↓
UI.md / UI_UX.md / UI_LIBRARY.md
     ↓
BACKLOG.md
     ↓
FEATURE_INDEX.md
```

`FEATURE_INDEX.md` provides navigation and feature coverage. It does not override architecture or business rules.

---

# 3. Product Summary

Learnzzy is a small, magical, child-friendly learning playground.

Core principle:

> Play. Think. Learn.

The product is designed around:

- Immediate play.
- Visual-first interaction.
- Simple learning activities.
- Five core MVP games.
- Anonymous child gameplay.
- Deterministic game logic.
- Pre-generated validated content.
- Dynamic content variation.
- Asynchronous AI.
- Agentic administration.
- PWA-first delivery.
- Mobile/iPad/desktop support.
- Strong privacy and safety controls.

---

# 4. Feature Status Legend

| Status | Meaning |
|---|---|
| `MVP` | Required for the initial production MVP |
| `P1` | Important post-foundation/core feature |
| `P2` | Planned enhancement |
| `P3` | Longer-term capability |
| `FOUNDATION` | Shared technical foundation |
| `GUARDRAIL` | Mandatory rule/control |
| `FUTURE` | Explicitly outside current MVP |

Backlog status such as `TODO`, `READY`, `IN_PROGRESS`, `REVIEW`, or `DONE` remains authoritative in `BACKLOG.md`.

This index does not claim an implementation is complete merely because the feature is listed.

---

# 5. MVP Feature Map

| Area | Feature | Priority | Backlog / Reference |
|---|---|---:|---|
| Product | Learning playground experience | MVP | DEC-001 |
| Product | Five core games | MVP | DEC-002 |
| Child UX | Visual-first interface | MVP | DEC-010 |
| Child UX | One primary task per screen | MVP | DEC-011 |
| Child UX | Large touch targets | MVP | DEC-012 |
| Child UX | Portrait + landscape | MVP | DEC-013 |
| Child UX | Positive failure | MVP | DEC-014 |
| PWA | Installable PWA | MVP | LZ-020, LZ-024 |
| Games | Addition / Numbers | MVP | LZ-050–LZ-053 |
| Games | Subtraction / Fly Away | MVP | LZ-060–LZ-063 |
| Games | Clean Up | MVP | LZ-070–LZ-073 |
| Games | Picture Puzzle | MVP | LZ-080–LZ-083 |
| Games | Shadow Sketch | MVP | LZ-090–LZ-093 |
| Gameplay | Shared Phaser framework | FOUNDATION | LZ-040–LZ-043 |
| Gameplay | Anonymous sessions | MVP | LZ-100 |
| Gameplay | Structured events | MVP | LZ-101 |
| Data | MongoDB data layer | MVP | LZ-110–LZ-113 |
| Content | Structured content schemas | MVP | LZ-120 |
| Content | Content pools | MVP | LZ-122–LZ-124 |
| AI | AI service abstraction | P1/MVP dependency | LZ-130–LZ-133 |
| Agents | Agent infrastructure | MVP | LZ-140–LZ-145 |
| Agents | Content Agent | MVP | LZ-150–LZ-155 |
| Agents | Quality & Safety Agent | MVP | LZ-160–LZ-164 |
| Agents | Academic Agent (Validated Learning Plans) | MVP | LZ-330–LZ-334 |
| Agents | Voice Character Engine (cached, 5×11×5) | MVP | LZ-335–LZ-337 |
| Learning | Dynamic visual themes + cross-domain combos | MVP | LZ-338–LZ-339 |
| UX | Living Wonder Worlds banner cards + guide/feedback bits (Stitch 12–20, retrieved 2026-09-18) | MVP | LZ-031–LZ-033, LZ-345 |
| Learning | Learning World categories (numbers/words/think/create/discover/puzzles, category-first `/play`) | MVP | LZ-346, DEC-188 |
| Learning | Generic activity engine (10 deterministic generators + ComplexityProfile + registry + activities content API + ActivityPlayer) | MVP | LZ-347–LZ-349, DEC-188 |
| Learning | Age-adaptive complexity (age changes the problem; per-skill ±1 via existing skillLevels) | MVP | LZ-350, DEC-188 |
| Assets | Stitch scene postcards (clean-up/puzzle/sketch WebP, lazy) | MVP | LZ-170–LZ-173, LZ-345 |
| Assets | Asset pipeline | MVP | LZ-170–LZ-173 |
| Admin | Admin authentication | MVP | LZ-200–LZ-203 |
| Admin | Admin dashboard | MVP | LZ-210–LZ-212 |
| Admin | Agent Command Center | MVP | LZ-220–LZ-223 |
| Admin | Content management/review | MVP | LZ-230–LZ-233 |
| Analytics | Gameplay analytics | MVP | LZ-250–LZ-253 |
| Observability | System health | MVP | LZ-260–LZ-263 |
| Offline | Offline shell + sync | MVP | LZ-270–LZ-273 |
| Security | API/input validation | MVP | LZ-280–LZ-285 |
| QA | Unit/API/E2E/responsive/accessibility testing | MVP | LZ-290–LZ-295 |
| Performance | Bundle/assets/CDN/API optimization | MVP | LZ-300–LZ-304 |
| SEO | Public metadata/sitemap/robots | P1 | LZ-310–LZ-312 |
| Deployment | Production deployment | MVP | LZ-320–LZ-326 |

---

# 6. Child Experience Features

## 6.1 Landing Page

**Route:**

```text
/
```

Capabilities:

- Learnzzy branding.
- “Play. Think. Learn.”
- Simple product explanation.
- Start Playing CTA.
- Child-safe visual language.
- Fast entry into gameplay.

**Backlog:** `LZ-030`

**References:**

- `PROJECT_DETAILS.md`
- `UI_UX.md`
- `UI.md`

---

## 6.2 Child Home

**Route:**

```text
/play
```

Five games:

```text
🔢 Numbers
🐦 Fly Away
🧹 Clean Up
🧩 Puzzle
✏️ Sketch
```

Capabilities:

- Large game cards.
- Minimal text.
- Visual game identity.
- Touch-friendly interaction.
- Active games only.
- Fast navigation.

**Backlog:** `LZ-031`

---

## 6.3 Child Navigation

Capabilities:

```text
Home
  ↓
Game selection
  ↓
Game
  ↓
Success / retry
  ↓
Completion
  ↓
Home
```

**Backlog:** `LZ-032`

---

## 6.4 Child-Friendly Copy

Examples:

```text
Count them!
How many?
Try again!
Great job!
You did it!
Let's play!
```

Rules:

- Short.
- Positive.
- Age appropriate.
- Low reading dependency.

**Backlog:** `LZ-033`

---

# 7. Game Feature Index

## 7.1 Addition / Numbers

**Route:**

```text
/play/addition
```

### Learning concept

Basic visual addition.

Example:

```text
🍎🍎🍎 + 🍎🍎

How many?

[3] [4] [5] [6]
```

### Features

- Visual object groups.
- Addition equation.
- Large answer buttons.
- Object appearance animation.
- Grouping animation.
- Combining animation.
- Correct-answer feedback.
- Retry.
- Completion celebration.
- Configurable difficulty.
- Deterministic answer validation.

### Difficulty

Initial backlog:

```text
Level 1: 1–5
Level 2: 1–10
Level 3: 1–20
```

### Backlog

```text
LZ-050 Addition Gameplay
LZ-051 Addition Animation
LZ-052 Addition Validation
LZ-053 Addition Difficulty
```

### Rules

- Correct answer = `a + b`.
- Visual quantities must match the equation.
- Generated answers are never trusted.
- LLM is never used as the arithmetic engine.

### References

- `BUSINESS_RULES.md`
- `ARCHITECTURE.md`
- `UI_UX.md`

---

# 8. Subtraction / Fly Away

**Route:**

```text
/play/subtraction
```

### Learning concept

Basic subtraction through visible objects leaving the scene.

Example:

```text
🐦🐦🐦🐦🐦

2 fly away.

How many left?
```

### Features

- Starting object group.
- Objects visibly fly away.
- Remaining objects are visually countable.
- Answer selection.
- Positive retry.
- Completion celebration.
- Configurable difficulty.
- Deterministic validation.

### Backlog

```text
LZ-060 Subtraction Gameplay
LZ-061 Subtraction Animation
LZ-062 Subtraction Validation
LZ-063 Subtraction Difficulty
```

### Rule

```text
remaining = start - removed
```

### References

- `BUSINESS_RULES.md`
- `ARCHITECTURE.md`

---

# 9. Clean Up

**Route:**

```text
/play/clean-up
```

### Learning concept

Recognition, attention, classification, and interaction through cleaning scenes.

### Interactive scenes

Initial themes:

```text
Bedroom
Classroom
Playground
Garden
Park
Beach
```

### Features

- Reusable scene renderer.
- Target objects.
- Non-target objects.
- Object positions.
- Tap interaction.
- Collection/basket animation.
- Cleaned scene state.
- Completion reward.
- Multiple scene variations.

### Backlog

```text
LZ-070 Scene Renderer
LZ-071 Interactive Objects
LZ-072 Scene Themes
LZ-073 Completion
```

### References

- `BUSINESS_RULES.md`
- `UI_UX.md`
- `DATABASE.md`

---

# 10. Picture Puzzle

**Route:**

```text
/play/puzzle
```

### Learning concept

Visual reasoning, spatial awareness, and object/image reconstruction.

### Features

- Puzzle image.
- Piece generation.
- 4-piece mode.
- 6-piece mode.
- 9-piece mode.
- Drag and drop.
- Touch support.
- Mouse support.
- Stylus/pointer support.
- Snap-to-place.
- Gentle incorrect placement behavior.
- Completion animation.
- Stars/reward.

### Backlog

```text
LZ-080 Puzzle Engine
LZ-081 Drag & Drop
LZ-082 Snap Logic
LZ-083 Puzzle Completion
```

### References

- `BUSINESS_RULES.md`
- `UI_UX.md`
- `DATABASE.md`

---

# 11. Shadow Sketch

**Route:**

```text
/play/sketch
```

### Learning concept

Tracing, fine motor control, visual recognition, and drawing practice.

### Features

- Drawing canvas.
- Shadow/outline target.
- Tracing guide.
- Touch drawing.
- Mouse drawing.
- Stylus support.
- Pointer events.
- Clear.
- Done.
- Try Again.
- Deterministic initial evaluation.

### Evaluation signals

```text
Path coverage
Completion
Approximate accuracy
Stroke count
Duration
```

### Backlog

```text
LZ-090 Drawing Canvas
LZ-091 Guide Path
LZ-092 Drawing Evaluation
LZ-093 Drawing Controls
```

### Future enhancement

AI-assisted drawing evaluation is post-MVP.

---

# 12. Shared Game Framework

All games use a shared game architecture.

## Technology

```text
Next.js
   |
Game Route
   |
Phaser 3
```

Phaser handles:

- Interactive 2D scenes.
- Object animation.
- Drag/drop.
- Touch.
- Pointer input.
- Game state.
- Lightweight effects.

Next.js handles:

- Routing.
- Website UI.
- Navigation.
- Admin.
- API integration.
- PWA integration.

### Common GameDefinition

```text
GameDefinition
├── id
├── name
├── learningObjectives
├── difficultyLevels
├── contentSchema
├── createScene()
├── handleInteraction()
├── validate()
├── calculateScore()
└── complete()
```

### Lifecycle

```text
LOADING
READY
PLAYING
SUCCESS
RETRY
COMPLETED
ERROR
```

### Backlog

```text
LZ-040 Phaser Integration
LZ-041 Game Definition Interface
LZ-042 Game Lifecycle
LZ-043 Game Resize System
```

### References

- `ARCHITECTURE.md`
- `UI_LIBRARY.md`
- `UI_UX.md`

---

# 13. Gameplay Session Features

## Anonymous Gameplay

Children do not need an account for MVP.

Capabilities:

- Lightweight session ID.
- Session isolation.
- No unnecessary child PII.
- Configurable session expiration.

**Backlog:** `LZ-100`

---

## Gameplay Events

Supported events include:

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

Events support:

- Batch submission.
- Offline queue.
- Idempotent processing.
- Aggregate analytics.

**Backlog:** `LZ-101–LZ-103`

---

# 14. Rewards and Progress

Rewards are educational and positive.

Possible rewards:

- Stars.
- Animation.
- Positive feedback.
- Progress.
- Completion celebration.
- Milestones/badges where configured.

Incorrect answers should provide:

```text
Gentle feedback
Optional hint
Retry
Continue
```

Never use:

- Harsh punishment.
- Gambling-like mechanics.
- Pay-to-progress.
- Advertising as a progression requirement.

**Reference:** `BUSINESS_RULES.md`, reward rules.

---

# 15. Hint Features

Hints are configurable by game and difficulty.

Rules:

- Help reasoning.
- Avoid unnecessary answer revelation.
- Track hint usage as an analytics event.
- Remain deterministic where possible.

**Reference:** `BUSINESS_RULES.md`

---

# 16. PWA Features

Learnzzy is PWA-first.

## Supported platforms

- Android.
- iPhone.
- iPad.
- Tablets.
- Desktop.
- Touch.
- Mouse/trackpad.

## Responsive modes

- Portrait.
- Landscape.

## PWA capabilities

- Manifest.
- Installability.
- Service worker.
- Cached application shell.
- Cached game assets.
- Offline-friendly gameplay where practical.
- Background event synchronization.

### Backlog

```text
LZ-020 PWA Manifest
LZ-021 Service Worker
LZ-022 Responsive Foundation
LZ-023 Safe Area Support
LZ-024 Installability
```

---

# 17. Content Platform

The content platform is responsible for delivering validated learning activities.

## Content capabilities

- Per-game schemas.
- Difficulty-specific content.
- Content status lifecycle.
- Content pools.
- Deterministic variations.
- AI-generated variations.
- Duplicate prevention.
- Content versioning.
- Automatic pool refill.
- Approved/active filtering.

## Content lifecycle

```text
draft
  ↓
validating
  ↓
approved
  ↓
active
```

Rejected/disabled content must not be playable.

### Backlog

```text
LZ-120 Content Schema
LZ-121 Content Status
LZ-122 Content Pool
LZ-123 Pool Threshold
LZ-124 Deterministic Content Generator
```

### References

- `DATABASE.md`
- `BUSINESS_RULES.md`
- `AGENTIC_IMPLEMENTATION_PLAN.md`

---

# 18. Dynamic Content Variation

Learnzzy should feel fresh without requiring an LLM during every play.

Variation can come from:

- Deterministic generators.
- Multiple approved activities.
- Theme variation.
- Object variation.
- Difficulty variation.
- AI-generated pre-approved content.
- Content pool selection.

Core rule:

> Content variation happens before gameplay or through fast deterministic selection, not through synchronous LLM generation.

---

# 19. MongoDB Data Features

MongoDB is the primary authoritative database.

It stores:

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

### Capabilities

- Persistent application state.
- Content repository.
- Game configuration.
- Sessions.
- Event storage.
- Agent state.
- AI usage tracking.
- Auditability.
- Difficulty recommendations.

### Backlog

```text
LZ-110 MongoDB Connection
LZ-111 Collections
LZ-112 MongoDB Indexes
LZ-113 Repository Layer
```

### Core rule

MongoDB is authoritative; Redis is not.

---

# 20. Redis and Background Jobs

Redis supports:

- Cache.
- BullMQ.
- Background jobs.
- Short-lived coordination/state.

BullMQ supports:

```text
content-generation
quality-validation
asset-processing
analytics
difficulty-analysis
pool-refill
```

Workers must support:

- Retry.
- Exponential backoff.
- Idempotency.
- Job status.
- Failure handling.
- Structured logging.

---

# 21. AI Service

AI is a supporting intelligence layer.

## AI capabilities

```text
generateStructuredContent
classify
summarize
recommendDifficulty
```

## Model routing

Supported configurable model classes:

```text
GPT-5 nano
GPT-5 mini
```

The exact provider/model mapping is configurable.

## AI rules

AI must not be used for:

- Arithmetic correctness.
- Gameplay scoring.
- Basic game state.
- Immediate answer validation.
- Animation.
- Collision detection.
- Critical gameplay interaction.

AI output is untrusted until validated.

### Backlog

```text
LZ-130 AI Provider Abstraction
LZ-131 Model Routing
LZ-132 Structured Output
LZ-133 Token Usage
```

---

# 22. Agent Workforce

Initial workforce:

```text
Content Agent
Quality & Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
Personalization Agent
QA Agent
Academic Agent
```

## Content Agent

Creates structured learning content.

```text
LZ-150 Addition Generator
LZ-151 Subtraction Generator
LZ-152 Cleaning Generator
LZ-153 Puzzle Generator
LZ-154 Sketch Generator
LZ-155 Automatic Pool Refill
```

## Quality & Safety Agent

Validates:

- Schema.
- Mathematics.
- Age suitability.
- Logical correctness.
- Consistency.
- Duplicates.
- Safety.

```text
LZ-160–LZ-164
```

## Asset Agent

Capabilities:

- Asset registry.
- Asset reuse.
- Image generation pipeline.
- Optimization.
- CDN storage.

```text
LZ-170–LZ-173
```

## Analytics Agent

Capabilities:

- Event aggregation.
- Game performance analysis.
- Content performance.
- Operational recommendations.

```text
LZ-180–LZ-183
```

## Difficulty Agent

Capabilities:

- Difficulty rules.
- Performance analysis.
- Difficulty recommendations.
- Approval workflow for major changes.

```text
LZ-190–LZ-192
```

---

# 23. Agent Execution Architecture

```text
Admin / Scheduler
       |
       v
Agent Task
       |
       v
BullMQ
       |
       v
Worker
       |
       v
Agent
       |
       v
Validation
       |
       v
MongoDB
```

Agent operations must be:

- Asynchronous.
- Auditable.
- Observable.
- Permission-limited.
- Retryable.
- Idempotent.

No agent should have unrestricted destructive access.

---

# 24. Admin Authentication

Admin-only functionality includes:

```text
/admin/login
/admin/*
/api/admin/*
```

Capabilities:

- Secure login.
- Secure session.
- Authorization.
- Login rate limiting.
- Protected administrative APIs.

### Backlog

```text
LZ-200 Admin Login
LZ-201 Secure Session
LZ-202 Authorization
LZ-203 Login Rate Limiting
```

---

# 25. Admin Dashboard

**Route:**

```text
/admin
```

Dashboard should provide visibility into:

- Games.
- Content.
- Agents.
- System health.
- Recent activity.
- Agent status.
- Latest tasks.

### Backlog

```text
LZ-210 Admin Shell
LZ-211 Dashboard Overview
LZ-212 Agent Overview
```

---

# 26. Agent Command Center

**Route:**

```text
/admin/agents
```

The admin interface is agentic rather than form-heavy.

Example commands:

```text
Create 50 Level 1 addition activities.

Find why puzzle completion is lower this week.

Refill the subtraction content pool.

Show me failed agent tasks.
```

Flow:

```text
Natural Language
       ↓
Intent Router
       ↓
Structured Task
       ↓
Permission Check
       ↓
Confirmation if required
       ↓
Agent Execution
       ↓
Result Summary
       ↓
Audit Log
```

Natural language must never become unrestricted database access.

### Backlog

```text
LZ-220 Command Input
LZ-221 Command Router
LZ-222 Confirmation Workflow
LZ-223 Command History
```

---

# 27. Content Management

**Routes:**

```text
/admin/content
/admin/content/[id]
```

Capabilities:

- Content list.
- Filter by game.
- Filter by difficulty.
- Filter by status.
- Filter by theme.
- Search.
- Preview.
- Approve.
- Reject.
- Disable.
- Regenerate.
- Version content.

### Backlog

```text
LZ-230 Content List
LZ-231 Content Preview
LZ-232 Approve/Reject
LZ-233 Content Versioning
```

---

# 28. Asset Management

**Route:**

```text
/admin/assets
```

Capabilities:

- Asset library.
- Asset preview.
- Asset approval.
- Duplicate detection.
- Version awareness.
- Storage/CDN metadata.

### Backlog

```text
LZ-240 Asset Library
LZ-241 Asset Preview
LZ-242 Asset Approval
LZ-243 Duplicate Detection
```

---

# 29. Analytics

Analytics must focus on aggregate product/learning behavior.

Metrics include:

- Game starts.
- Completion rate.
- Success rate.
- Accuracy.
- Retry rate.
- Average attempts.
- Hint usage.
- Game popularity.
- Content performance.
- Difficulty performance.
- Response time.
- AI usage/cost.

### Backlog

```text
LZ-250 Game Analytics
LZ-251 Content Analytics
LZ-252 Difficulty Analytics
LZ-253 AI Cost Analytics
```

No unnecessary child profiling.

---

# 30. Difficulty Management

Difficulty is configurable.

Features:

- Difficulty rules.
- Performance analysis.
- Too easy detection.
- Appropriate difficulty detection.
- Too difficult detection.
- Recommendations.
- Admin approval for major changes.

The Difficulty Agent recommends; deterministic rules/configuration remain authoritative.

---

# 31. System Health & Observability

Capabilities:

```text
GET /health
GET /api/health
```

Admin system health should cover:

```text
API
MongoDB
Redis
BullMQ
Object Storage
AI Provider
```

Monitoring:

- Sentry.
- Structured logs.
- Health checks.
- Agent metrics.
- Queue depth.
- AI usage.
- Application errors.

### Backlog

```text
LZ-260 Health Endpoint
LZ-261 API Health
LZ-262 Admin System Health
LZ-263 Error Monitoring
```

---

# 32. Offline & Synchronization

Capabilities:

```text
Cached game shell
Cached ready-to-play content
Local event queue
Background synchronization
Event deduplication
```

### Backlog

```text
LZ-270 Cache Game Shell
LZ-271 Cache Content
LZ-272 Local Event Queue
LZ-273 Synchronization
```

Offline behavior must not falsely claim that server-side operations completed.

---

# 33. Security & Privacy

Security features:

- Request validation.
- AI output validation.
- Server-side AI secrets.
- Rate limiting.
- Admin authentication.
- Authorization.
- Audit logs.
- Child privacy review.
- Minimal PII.
- Secure deployment.
- No public child activity.

### Backlog

```text
LZ-280 API Validation
LZ-281 AI Output Validation
LZ-282 Secret Protection
LZ-283 Rate Limiting
LZ-284 Child Privacy Review
LZ-285 Audit Logs
```

---

# 34. Testing & QA

Required test areas:

## Unit

- Arithmetic.
- Validation.
- Difficulty.
- Rewards.
- Schemas.

## API

- Public APIs.
- Admin APIs.

## Agents

- Task creation.
- Execution.
- Retry.
- Failure.
- Approval.
- Idempotency.

## Game E2E

All five games.

## Responsive

- Android.
- iPhone.
- iPad.
- Desktop.

## Accessibility

- Keyboard.
- Touch.
- Reduced motion.
- Automated accessibility checks.

### Backlog

```text
LZ-290 Unit Tests
LZ-291 API Tests
LZ-292 Agent Tests
LZ-293 Game E2E Tests
LZ-294 Responsive Tests
LZ-295 Accessibility Tests
```

---

# 35. Performance Features

Capabilities:

- Small initial bundle.
- Code splitting.
- Route splitting.
- Lazy loading.
- Optimized images.
- CDN delivery.
- Fast content retrieval.
- Fast session creation.
- Efficient event submission.
- Content prefetching.
- No synchronous AI in gameplay.

### Backlog

```text
LZ-300 Bundle Optimization
LZ-301 Game Asset Optimization
LZ-302 CDN
LZ-303 API Performance
LZ-304 No AI in Gameplay Path
```

---

# 36. SEO & Public Website

Public website capabilities:

- Metadata.
- Title.
- Description.
- Open Graph.
- Favicon.
- PWA metadata.
- Sitemap.
- Robots.

### Backlog

```text
LZ-310 Metadata
LZ-311 Sitemap
LZ-312 Robots
```

SEO applies primarily to the public-facing website, not the child gameplay experience.

---

# 37. Deployment Features

Production deployment includes:

```text
Cloudflare
   ↓
Nginx
   ↓
Next.js
   ↓
MongoDB / Redis / Object Storage
   ↓
BullMQ Workers
   ↓
AI Agents
```

Capabilities:

- Docker.
- Web container.
- Worker container.
- Secure MongoDB.
- Secure Redis.
- Nginx.
- HTTPS.
- Environment variables.
- Secrets.
- Monitoring.
- Backups.
- Logs.
- Health checks.
- Rollback.
- Staging.
- Production.

### Backlog

```text
LZ-320 Docker
LZ-321 Worker Deployment
LZ-322 MongoDB Configuration
LZ-323 Redis Configuration
LZ-324 Nginx
LZ-325 Production Environment
LZ-326 Deployment Verification
```

### Reference

`DEPLOYMENT.md`

---

# 38. API Feature Index

## Public APIs

```text
GET  /api/games
POST /api/sessions
GET  /api/games/{gameId}/content
POST /api/game-events
POST /api/game-events/batch
POST /api/sync/events
```

## Admin APIs

```text
GET  /api/admin/dashboard
GET  /api/admin/agents
POST /api/admin/agents/{agentId}/run
GET  /api/admin/agent-tasks/{taskId}
GET  /api/admin/agent-runs

GET  /api/admin/content
GET  /api/admin/content/{contentId}
POST /api/admin/content/{contentId}/approve
POST /api/admin/content/{contentId}/reject
POST /api/admin/content/{contentId}/regenerate
POST /api/admin/content/{contentId}/disable
POST /api/admin/content/generate
GET  /api/admin/content/pools
POST /api/admin/content/pools/{gameId}/refill

Asset endpoints
Analytics endpoints
Difficulty endpoints
POST /api/admin/commands

GET /health
GET /api/health
```

Detailed API contracts belong in `API.md`.

---

# 39. Page / Route Index

## Public

```text
/
```

## Child

```text
/play
/play/addition
/play/subtraction
/play/clean-up
/play/puzzle
/play/sketch
/play/complete
```

## Admin

```text
/admin/login
/admin
/admin/agents
/admin/agents/[id]
/admin/content
/admin/content/[id]
/admin/assets
/admin/analytics
/admin/difficulty
/admin/system
/admin/settings
```

---

# 40. Shared UI Feature Index

## Core UI

```text
Button
IconButton
Card
Badge
Dialog
Modal
Tooltip
Tabs
Input
Select
Progress
Skeleton
Toast
```

## Child UI

```text
GameCard
GameHeader
AnswerButton
StarCounter
GameProgress
Celebration
GameShell
GameCanvas
HomeButton
```

## Admin UI

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

Detailed component rules belong in `UI_LIBRARY.md`.

---

# 41. Safety Guardrails Index

The following are non-negotiable:

```text
NO LLM per click
NO LLM arithmetic
NO unnecessary child login
NO advertising during gameplay
NO public child profiles
NO child-to-child public chat
NO uncontrolled destructive agents
NO unvalidated AI content
NO unoptimized on-demand image generation
```

Always:

```text
Deterministic game logic
Structured content
Schema validation
Deterministic validation
Quality/safety checks
Safe asset pipeline
Background AI jobs
Caching
Mobile-first design
PWA support
Secure admin
Observability
AI cost tracking
```

---

# 42. Privacy Features

MVP should avoid unnecessary collection of:

- Names.
- Email.
- Phone.
- Precise location.
- Photos.
- Public profiles.

Do not expose child activity publicly.

Analytics should be aggregate-oriented and privacy-minimized.

---

# 43. Asset Feature Index

Asset system capabilities:

```text
Asset registry
Asset reuse
Asset generation
Asset validation
Asset optimization
Asset versioning
Duplicate detection
Object storage
CDN delivery
```

Preferred pipeline:

```text
Search existing asset
       ↓
Reuse if suitable
       ↓
Generate only if needed
       ↓
Validate
       ↓
Optimize
       ↓
Store
       ↓
CDN
```

Child-facing visual style:

```text
friendly modern children's educational illustration
simple rounded shapes
clean background
soft playful composition
high readability
child-safe
no text
no watermark
```

---

# 44. Content Safety Feature Index

AI-generated content must pass:

```text
Schema Validation
       ↓
Deterministic Validation
       ↓
Quality Validation
       ↓
Safety Validation
       ↓
Approval
       ↓
Active
```

Only active content is available to children.

---

# 45. Core Architecture Feature Index

The platform architecture is:

```text
Child PWA
    |
Next.js
    |
Deterministic Services
    |
+---+-------------+
|                 |
MongoDB         Redis
|                 |
|              BullMQ
|                 |
|              Workers
|                 |
|             AI Agents
|                 |
+--------+--------+
         |
   Validated Content
         |
     Object Storage
```

The child runtime must remain independent from live AI.

---

# 46. Feature Dependencies

```text
Foundation
    |
    +--> PWA
    |
    +--> UI Library
    |
    +--> Game Framework
             |
             +--> Addition
             +--> Subtraction
             +--> Clean Up
             +--> Puzzle
             +--> Sketch
             |
             +--> Sessions/Events
                         |
                         v
                    MongoDB Layer
                         |
                         v
                    Content Pools
                         |
                         v
                    AI Service
                         |
                         v
                  Agent Infrastructure
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
         Content     Quality       Assets
          Agent       Agent        Agent
             |           |           |
             +-----------+-----------+
                         |
                         v
                    Admin Platform
                         |
              +----------+----------+
              |          |           |
              v          v           v
          Analytics  Difficulty   System Health
```

---

# 47. MVP Feature Boundary

The following are inside the MVP:

```text
✓ Five games
✓ Anonymous gameplay
✓ Responsive child UI
✓ PWA
✓ Deterministic gameplay
✓ MongoDB
✓ Redis
✓ Content pools
✓ Structured content
✓ AI content generation
✓ Content validation
✓ Content Agent
✓ Quality/Safety Agent
✓ Asset pipeline
✓ Admin authentication
✓ Admin dashboard
✓ Agent visibility
✓ Agent Command Center
✓ Content review
✓ Basic analytics
✓ Difficulty analysis foundation
✓ Offline application shell
✓ Event synchronization
✓ Security controls
✓ Testing
✓ Production deployment
```

---

# 48. Explicitly Outside MVP

These are future capabilities unless separately approved:

- Parent dashboard.
- Teacher dashboard.
- Native mobile wrappers.
- Classroom functionality.
- Teacher-created learning journeys.
- Advanced recommendation system.
- Advanced AI tutoring.
- Multi-region infrastructure.
- More educational subjects.
- More languages/localization at scale.
- Advanced adaptive learning.
- AI drawing evaluation.
- Theme packs.
- Offline content packs.
- Richer accessibility beyond MVP baseline.

Future games may include:

```text
Memory Match
Shape Matching
Pattern Completion
Sorting
Word Recognition
Colour Matching
Counting Objects
Sequence Games
Simple Science
```

---

# 49. Cross-Feature Non-Negotiable Rules

## Gameplay

- Deterministic.
- Fast.
- Visual-first.
- Browser not authoritative.
- No live LLM dependency.

## Content

- Structured.
- Validated.
- Approved before activation.
- Reusable.
- Versioned.

## AI

- Server-side.
- Asynchronous.
- Cost-controlled.
- Model-configurable.
- Never the final authority for learning correctness.

## Agents

- Background.
- Least privilege.
- Auditable.
- Retryable.
- Confirm consequential operations.

## Data

- MongoDB authoritative.
- Redis supporting.
- Object storage for binaries.
- Minimal PII.

## Admin

- Authenticated.
- Authorized.
- Agentic.
- Confirmation for consequential actions.
- Audited.

## Deployment

- Health checked.
- Observable.
- Backed up.
- Rollback capable.
- Production secrets protected.

---

# 50. Feature Completion Rule

A feature is **not DONE** simply because code exists.

A feature is complete only when applicable:

```text
Implementation
    ↓
Business Rules
    ↓
Schema/API validation
    ↓
Tests
    ↓
Security review
    ↓
Performance review
    ↓
UX/accessibility review
    ↓
Documentation
    ↓
Verification
```

The backlog remains the authoritative source for implementation status.

---

# 51. Documentation Cross-Reference

| Document | Primary Responsibility |
|---|---|
| `PROJECT_DETAILS.md` | Product vision, scope, MVP |
| `ARCHITECTURE.md` | System architecture |
| `DECISIONS.md` | Architecture/product decisions |
| `BUSINESS_RULES.md` | Product/domain rules |
| `DATABASE.md` | MongoDB/data model |
| `API.md` | API contracts |
| `UI_UX.md` | UX behavior and flows |
| `UI.md` | Visual design system |
| `UI_LIBRARY.md` | Reusable components |
| `BACKLOG.md` | Implementation tasks/status |
| `AGENTIC_IMPLEMENTATION_PLAN.md` | Agent workforce implementation |
| `DEPLOYMENT.md` | Production infrastructure/deployment |
| `FEATURE_INDEX.md` | Feature navigation/index |

---

# 52. Feature-to-Document Matrix

| Feature Area | Business Rules | Architecture | Database | API | UI/UX | Agents | Deployment |
|---|---:|---:|---:|---:|---:|---:|---:|
| Addition | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subtraction | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clean Up | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Puzzle | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sketch | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sessions | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Events | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Content Pools | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI Service | ✓ | ✓ | ✓ | — | — | ✓ | ✓ |
| Agent Workforce | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Academic Engine | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Voice Engine | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Offline | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Security | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Deployment | ✓ | ✓ | — | — | — | ✓ | ✓ |

---

# 53. Future Feature Intake

Every new feature should be evaluated against:

1. Does it support the learning-playground vision?
2. Does it improve learning or child experience?
3. Does it preserve visual simplicity?
4. Does it preserve deterministic gameplay?
5. Does it introduce unnecessary child data?
6. Does it introduce an LLM dependency into gameplay?
7. Does it require a new business rule?
8. Does it affect MongoDB schemas?
9. Does it affect APIs?
10. Does it affect agent permissions?
11. Does it affect deployment?
12. Does it require a new decision record?
13. Does it require new tests?
14. Does it require new documentation?

If architecture or product behavior changes materially, create a new decision in `DECISIONS.md` and update this index.

---

# 54. Final Product Feature Principle

Learnzzy is intentionally asymmetric:

```text
CHILD EXPERIENCE
----------------
Simple
Fast
Visual
Friendly
Deterministic
Safe


BACKEND
----------------
Structured
Automated
Observable
Agentic
AI-assisted
Scalable
```

The platform should hide complexity from the child.

The sophistication belongs behind the experience:

```text
             CHILD
               |
               v
        Simple Game UI
               |
               v
      Deterministic Engine
               |
               v
      Validated Content Pool
               ^
               |
       AI + Agent Workforce
               |
      Admin Command Center
```

**The defining feature of Learnzzy is not that it uses AI.**

The defining feature is:

> **Children get a simple, delightful learning playground while AI and agents continuously improve the content, assets, analytics, and operations in the background.**
