# Learnzzy — System Architecture

## 1. Architecture Objective

Learnzzy should be architected as a **fast game platform with an AI content and agent layer**.

The child-facing application must not depend on real-time LLM calls.

### Core architecture principle

> Deterministic game engine + cached content + asynchronous AI workforce

## 2. High-Level Architecture

```text
                         INTERNET
                             |
                             v
                    +----------------+
                    |  Cloudflare/CDN |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    |     NGINX      |
                    +-------+--------+
                            |
                            v
                 +----------------------+
                 |     Next.js Web      |
                 |  Child PWA + Admin   |
                 +----------+-----------+
                            |
                            v
                 +----------------------+
                 |     API Layer        |
                 | Next.js / Node.js    |
                 +----------+-----------+
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
      +------------+  +------------+  +------------+
      | MongoDB |  |   Redis    |  |  Object    |
      |            |  |            |  |  Storage   |
      | Content    |  | Cache      |  | Images     |
      | Analytics  |  | Queues     |  | Audio      |
      | Config     |  | Jobs       |  | Assets     |
      +------------+  +------+-----+  +------------+
                             |
                             v
                    +-------------------+
                    |  Agent Workers     |
                    |      BullMQ        |
                    +---------+---------+
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
      +------------+    +------------+   +------------+
      |  Content   |    |   Asset    |   |  Quality   |
      |   Agent    |    |   Agent    |   |   Agent    |
      +------------+    +------------+   +------------+
             |                |                |
             +----------------+----------------+
                              |
                              v
                       +-------------+
                       | AI Provider |
                       | GPT models  |
                       +-------------+
```

## 3. Frontend Architecture

### Next.js

Next.js is responsible for:

- Application shell
- Routing
- SEO
- Public landing page
- Admin interface
- API integration
- PWA integration

### Phaser

Phaser is responsible for the interactive 2D game layer.

Use Phaser for:

- Object animations
- Game scenes
- Drag/drop
- Touch interaction
- Game state
- Lightweight game effects
- Game-specific rendering

Do not build the entire website inside Phaser.

The architecture is:

```text
Next.js
  |
  +-- Website UI
  |
  +-- Navigation
  |
  +-- Admin
  |
  +-- Game route
        |
        +-- Phaser Game
```

## 4. Game Plugin Architecture

Every game should implement a common interface.

Conceptually:

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

Initial implementations:

```text
games/
├── addition/
├── subtraction/
├── clean-up/
├── puzzle/
└── sketch/
```

Future games can be added without changing the core game framework.

## 5. Backend Architecture

The backend should expose a clean API.

Public examples:

```text
GET  /api/games
GET  /api/games/:id/content
POST /api/game-events
POST /api/session
POST /api/session/events
```

Admin examples:

```text
GET  /api/admin/agents
GET  /api/admin/agent-runs
GET  /api/admin/content
POST /api/admin/content/generate
POST /api/admin/content/:id/approve
POST /api/admin/content/:id/reject
GET  /api/admin/analytics
GET  /api/admin/system-health
```

AI provider credentials must only exist server-side.

## 6. Database Architecture

Use MongoDB.

Core entities:

```text
admins
games
game_configs

content_items
content_versions

assets
asset_versions
asset_tags

sessions
game_events

agents
agent_tasks
agent_runs
agent_events

difficulty_rules

system_settings
```

### Content

Use MongoDB documents for game-specific content. Keep common metadata as predictable document fields and use embedded objects/arrays where that improves retrieval and atomic updates.

Example:

```json
{
  "game": "addition",
  "difficulty": 1,
  "theme": "jungle",
  "question": {
    "a": 3,
    "b": 2,
    "answer": 5
  },
  "objects": {
    "type": "banana",
    "countA": 3,
    "countB": 2
  },
  "answers": [3, 4, 5, 6],
  "correctAnswer": 5
}
```

## 7. Content Validation

AI output must never be trusted directly.

Pipeline:

```text
AI Generated Content
        |
        v
Schema Validation
        |
        v
Deterministic Validation
        |
        v
Quality/Safety Validation
        |
        v
Approved
        |
        v
Production Content Pool
```

For mathematics, application code calculates the answer.

Example:

```text
a = 3
b = 2

expected = a + b

if generatedAnswer !== expected:
    reject()
```

## 8. Redis Architecture

Redis is used for:

- Cache
- Queues
- Job state
- Rate limiting
- Temporary session state where appropriate

BullMQ manages background jobs.

Queues:

```text
content-generation
content-validation
asset-generation
asset-validation
analytics-analysis
difficulty-analysis
```

## 9. AI Architecture

AI is isolated behind an AI service abstraction.

Conceptually:

```text
AIService
├── generateStructuredContent()
├── classify()
├── summarize()
├── recommendDifficulty()
└── generateAssetPrompt()
```

The rest of the application must not directly depend on provider-specific SDK calls.

This makes it possible to change models/providers later.

## 10. AI Model Routing

Use task-based routing.

Example:

```text
Simple classification
        |
        v
GPT-5 nano

Structured content generation
        |
        v
GPT-5 mini

Complex planning/reasoning
        |
        v
Configured stronger model when justified
```

The model should be configurable.

## 11. Agent Worker Architecture

Agents execute asynchronously.

```text
Admin / System Trigger
        |
        v
Agent Task
        |
        v
Redis Queue
        |
        v
Agent Worker
        |
        +--> AI
        |
        +--> Database
        |
        +--> Asset Storage
        |
        v
Agent Run Result
```

Agents must be idempotent where possible.

Repeated jobs must not create uncontrolled duplicates.

## 12. Asset Architecture

Images and other large assets should be stored outside MongoDB.

Recommended:

```text
AI Asset Agent
      |
      v
Image Generation
      |
      v
Safety / Quality Check
      |
      v
Image Optimization
      |
      v
Object Storage
      |
      v
CDN
```

MongoDB stores asset metadata and references; binary assets remain in object storage.

## 13. Child Gameplay Architecture

The child flow should be:

```text
Open PWA
   |
   v
Load Cached Application
   |
   v
Select Game
   |
   v
Fetch Ready Content
   |
   v
Start Phaser Scene
   |
   v
Play
   |
   v
Validate Locally
   |
   v
Show Feedback
   |
   v
Record Event
   |
   v
Next Activity
```

No synchronous LLM call should exist in this path.

## 14. Offline Architecture

Cache:

- App shell
- JavaScript
- CSS
- Core game engine
- Selected content
- Common assets
- Sounds

When offline:

```text
Offline
  |
  v
Cached Game
  |
  v
Gameplay
  |
  v
Local Event Queue
  |
  v
Connection Restored
  |
  v
Synchronize Events
```

## 15. Security Boundaries

```text
Browser
  |
  | public/admin API
  v
Backend
  |
  +-- MongoDB
  +-- Redis
  +-- Object Storage
  +-- AI Provider
```

Never expose:

- AI API keys
- Database credentials
- Redis credentials
- Storage secrets

to the browser.

## 16. Admin Architecture

Admin UI communicates with protected APIs.

```text
Admin Login
    |
    v
Authentication
    |
    v
Admin Session
    |
    v
Protected Admin API
    |
    +-- Agents
    +-- Content
    +-- Assets
    +-- Analytics
    +-- Settings
```

Use role/permission checks before consequential actions.

## 17. Observability

Track:

- API latency
- frontend errors
- worker errors
- agent execution
- AI usage
- token consumption
- content generation
- content rejection
- queue depth
- database health

Never expose internal chain-of-thought in admin interfaces. Show operational summaries only.

## 18. Deployment Architecture

Initial deployment can use Docker Compose.

```text
docker-compose
├── web
├── worker
├── postgres
├── redis
└── nginx
```

External:

```text
Cloudflare
S3-compatible storage
AI provider
Monitoring
```

The system should be deployable to the existing VPS without requiring Kubernetes for the MVP.

## 19. Scalability Strategy

Start simple.

For early traffic:

```text
1 VPS
+
Docker Compose
+
MongoDB
+
Redis
+
Worker
```

As traffic grows:

```text
Load Balancer
      |
      +-- Web 1
      +-- Web 2
      |
      +-- Worker 1
      +-- Worker 2
      |
      v
Managed MongoDB
      |
      v
Managed Redis
      |
      v
Object Storage + CDN
```

Do not introduce distributed infrastructure before it is required.

## 20. Architectural Rules

1. Gameplay must remain deterministic.
2. AI must be asynchronous whenever possible.
3. Content must be schema validated.
4. Mathematical answers must be calculated by code.
5. AI keys must remain server-side.
6. Child UX must remain simple.
7. Admin complexity belongs behind the scenes.
8. Content must be cacheable.
9. Agents must be observable.
10. New games must be modular.
11. Existing infrastructure should be reused.
12. Do not over-engineer the MVP.

# 56. Implementation Reconciliation — 2026-09-14

This section records the verified implementation state from the latest OpenCode session. It takes precedence over older aspirational status statements in this document.

## Verified implemented baseline

```text
Next.js + TypeScript
Tailwind UI foundation
PWA shell + manifest + service worker
Phaser 3 lazy integration for addition/subtraction
MongoDB repositories + indexes
Redis/BullMQ with local in-process fallback
Deterministic content pool + seed
AI abstraction + mock/configurable model routing
Eight-agent registry/task/run/event persistence (academic-agent added 2026-09-17)
Admin authentication + protected admin APIs
Admin dashboard/command center baseline (+ academic panel 2026-09-17)
Docker Compose + Nginx deployment baseline
Academic Orchestrator + Validated Learning Plan APIs (2026-09-17)
Voice Character Engine + voiceAssets cache (2026-09-17)
```

The current verified gameplay implementation is strongest for Addition and Subtraction. The remaining games/content/renderers must be treated according to the latest repository audit and must not be marked complete merely because they exist in the product roadmap.

## Current runtime data flow

```text
Child Play
   |
   v
GET /api/games/{gameId}/content
   |
   v
MongoDB active pool
   |
   +--> validated pool content
   |
   +--> deterministic server fallback if necessary
   |
   v
Client round validation
   |
   v
Phaser visual stage + DOM controls
   |
   v
Game events
```

The pool client treats server content as untrusted and re-validates mathematical constraints before a round is used.

## Current resilience model

Gameplay does not require MongoDB, Redis, AI, or workers to be available at runtime. When configured, Redis/BullMQ provides durable background processing; local development has an in-process retrying fallback.

## Parent architecture status

The Parent Experience is now an architectural requirement but is **not verified as implemented** in the supplied current-session evidence.

Planned relationship:

```text
Parent Account
     |
     v
Secure Pairing
     |
     v
parentChildLinks
     |
     v
Learner Profile
     |
     +--> Activity
     +--> Progress
     +--> Rewards
     +--> Learning Signals
     +--> Learning Plan
```

Do not implement parent access using child name + age as authorization. Pairing must be an explicit secure relationship.

## QA status

Automated verification currently includes lint, typecheck, unit tests, production build, API smoke checks, content validation, and pool behavior. Physical-device validation remains outstanding for real touch, iPad orientation, PWA installation, offline behavior, accessibility assistive technologies, and low-end performance.

The Test & QA Agent remains a planned extension unless verified in the repository.

# 57. Academic Engine Reconciliation — 2026-09-17

Supersedes the agent-count statement in §56 (five → eight) for the
workforce only; all §56 precedence rules still apply.

```text
Child Game → Gameplay Events → Analytics → Learning Signals
    → Academic Orchestrator (deterministic core + advisory Tutor/OER/NCERT)
    → Validated Learning Plan (academicPlans)
    → Content Pool → Game → Result → Parent Dashboard (academic rollup)
```

Invariants (DEC-183/184/185, BR-260–266): MCP advisory-only with
failure-isolated gateway calls; LEARN→MASTER with no skips/jumps;
voice prepared-per-language and cached, never live in gameplay; visual
theme independent of difficulty. New collections: `academicPlans`,
`voiceAssets`. New routes: learner `/academic/plan|recommendation|voice|
result` + `GET /api/admin/academic/plans`. Living Wonder layer (2026-09-18):
`lib/worlds.ts` + `WonderBits.tsx` presentation bits, 3 optimized Stitch
scene postcards in `public/assets/`; deviations in DEC-187. Learning
Playground layer (2026-09-18, DEC-188): category-first `/play` (6 Learning
Worlds) → `/learn/[category]` → 16 activities; 10 worksheet-inspired
activities share one generic engine (`lib/categories.ts`,
`lib/complexity.ts` §27 baseline, `lib/activityRegistry.ts`,
`lib/activityContent.ts` deterministic generators) served by
`GET /api/activities/[activityId]/content` and rendered by one
`ActivityPlayer`; shipped engines linked, never duplicated; completions
reuse game-events + `academic/result` (no new collections/routes for
adaptation, parent, or academic flow). Verified: 182
unit tests, typecheck, lint, production build (76 routes), Docker image build.
Open: Playwright `/learn` pass, live-Mongo E2E (KI-019), TTS binaries (KI-020),
Playwright academic pass, parent-journey screenshot re-fetch, physical devices.
