# Learnzzy — Architecture & Product Decisions

**Document:** Decision Log / Architecture Decision Record (ADR) Summary  
**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-09-13

---

## 1. Purpose

This document records the important product, architecture, technology, UX, AI, database, security, and operational decisions made for **Learnzzy**.

The purpose is to prevent important decisions from being lost across conversations, implementation sessions, coding agents, and future changes.

These decisions are the current source of truth unless a later decision explicitly supersedes them.

---

# 2. Product Decisions

## DEC-001 — Learnzzy Is a Learning Playground

**Decision:**  
Learnzzy will be positioned as a small, magical, child-friendly learning playground rather than a conventional educational portal or complex game platform.

**Reason:**
- Children should want to play immediately.
- The interface should feel fun and lightweight.
- Learning should happen naturally through interaction.

**Principle:**

> Play. Think. Learn.

**Status:** Active

---

## DEC-002 — MVP Has Five Core Games

**Decision:**  
The initial MVP will contain five games:

1. Addition / Numbers
2. Subtraction / Fly Away
3. Clean Up
4. Picture Puzzle
5. Shadow Sketch

**Reason:**  
Five simple game types provide enough variety to validate the platform without overbuilding the first release.

**Status:** Active

---

## DEC-003 — Games Must Be Modular

**Decision:**  
Each game must be implemented as an independent module on top of a shared game framework.

**Reason:**
- New games should be added without rewriting the platform.
- Shared gameplay infrastructure can be reused.
- Game-specific rules remain isolated.

**Status:** Active

---

# 3. UX Decisions

## DEC-010 — Child UX Is Visual-First

**Decision:**  
Child-facing screens will use minimal text and obvious visual interactions.

**Reason:**  
Young children should be able to understand what to tap without requiring an adult to explain the screen.

**Acceptance principle:**

> Can a five-year-old understand what to tap without needing an adult to explain the screen?

**Status:** Active

---

## DEC-011 — One Primary Task Per Screen

**Decision:**  
Gameplay screens should focus on one primary learning task.

**Reason:**  
Reduces cognitive load and makes interactions easier for young children.

**Status:** Active

---

## DEC-012 — Large Touch Targets

**Decision:**  
Primary interactions must use large, touch-friendly controls.

**Platforms:**
- Android
- iPhone
- iPad
- tablets
- desktop

**Status:** Active

---

## DEC-013 — Portrait and Landscape

**Decision:**  
The application must support both portrait and landscape layouts.

**Reason:**  
The platform is intended for phones, tablets, iPads, and desktop devices.

**Status:** Active

---

## DEC-014 — Positive Failure Experience

**Decision:**  
Incorrect answers should provide gentle feedback rather than punishment.

**Reason:**  
The platform is designed for learning, not failure avoidance or competition.

**Status:** Active

---

## DEC-015 — No Child Social Features in MVP

**Decision:**  
The MVP will not include:

- public child profiles;
- child-to-child chat;
- public comments;
- social feeds.

**Reason:**  
Minimize privacy and safety risks and keep the product focused.

**Status:** Active

---

# 4. PWA Decisions

## DEC-020 — PWA-First

**Decision:**  
Learnzzy will be built as a Progressive Web App.

**Required capabilities:**
- installability;
- manifest;
- service worker;
- cached app shell;
- cached game assets;
- offline gameplay where practical;
- background event synchronization.

**Status:** Active

---

## DEC-021 — Offline-Friendly Architecture

**Decision:**  
Previously downloaded/validated game content should remain usable when connectivity is temporarily unavailable where technically practical.

**Reason:**  
Children should not experience a broken game because of a temporary network interruption.

**Status:** Active

---

# 5. Frontend Technology Decisions

## DEC-030 — Next.js

**Decision:**  
Use Next.js for the web application.

**Reason:**
- modern React architecture;
- PWA support;
- routing;
- server-side capabilities;
- suitable foundation for both child and admin experiences.

**Status:** Active

---

## DEC-031 — TypeScript

**Decision:**  
Use TypeScript across the application.

**Reason:**
- safer contracts;
- better maintainability;
- shared types;
- improved coding-agent reliability.

**Status:** Active

---

## DEC-032 — Phaser 3

**Decision:**  
Use Phaser 3 as the game engine.

**Reason:**
- appropriate for lightweight 2D games;
- supports animation and touch interaction;
- reusable game framework;
- keeps game logic separate from normal application UI.

**Status:** Active

---

## DEC-033 — Tailwind CSS + Reusable UI Library

**Decision:**  
Use Tailwind CSS together with a centralized reusable component library.

**Reason:**
- consistent visual language;
- faster implementation;
- responsive design;
- shared child/admin components where appropriate.

**Status:** Active

---

# 6. Database Decisions

## DEC-040 — MongoDB Is the Primary Database

**Decision:**  
MongoDB is the authoritative application database.

**Reason:**
- flexible structured content documents;
- natural fit for different game payloads;
- supports evolving game types;
- suitable for content, sessions, events, agents, configuration, and operational records.

**Important:**  
MongoDB replaces the previously considered relational database direction.

**Status:** Active

---

## DEC-041 — MongoDB Stores Structured Data, Not Normal Binary Assets

**Decision:**  
Images, audio, and other large binary assets will be stored in S3-compatible object storage.

MongoDB stores asset metadata and references.

**Reason:**
- lower database size;
- easier CDN delivery;
- better asset lifecycle management;
- better separation of concerns.

**Status:** Active

---

## DEC-042 — Repository/Data Access Boundary

**Decision:**  
Application code should access MongoDB through repositories/data-access services.

**Architecture:**

```text
UI / Game
    ↓
API
    ↓
Application Service
    ↓
Repository
    ↓
MongoDB
```

**Reason:**  
Prevents database logic from spreading throughout the application.

**Status:** Active

---

## DEC-043 — Zod + Deterministic Validation

**Decision:**  
Use schema validation such as Zod together with deterministic business rules.

**Reason:**  
Schemas protect data structure; deterministic rules protect learning correctness.

**Status:** Active

---

# 7. Game Logic Decisions

## DEC-050 — Deterministic Game Engine

**Decision:**  
Game state and core game behavior must be deterministic.

The application code—not an LLM—controls:

- arithmetic;
- answer correctness;
- scoring;
- animations;
- touch events;
- drag/drop;
- drawing;
- timers;
- game state;
- completion.

**Status:** Active

---

## DEC-051 — Never Use LLM for Arithmetic

**Decision:**  
LLMs must never calculate the authoritative answer for addition or subtraction.

Example:

```text
correctAnswer = operandA + operandB
```

or:

```text
correctAnswer = startCount - removedCount
```

**Reason:**  
Mathematical correctness must be deterministic and testable.

**Status:** Active / Non-negotiable

---

## DEC-052 — Browser Is Not Authoritative

**Decision:**  
The client must not be trusted as the source of truth for protected:

- scores;
- rewards;
- difficulty;
- progression;
- correctness.

**Reason:**  
Client-side state can be manipulated.

**Status:** Active / Non-negotiable

---

# 8. AI Architecture Decisions

## DEC-060 — AI Is a Supporting Intelligence Layer

**Decision:**  
AI supports the platform but does not operate the game engine.

AI may:
- generate learning content;
- generate variations;
- create themes;
- recommend difficulty;
- manage asset metadata;
- validate age suitability;
- analyze aggregate learning signals;
- replenish content pools.

**Status:** Active

---

## DEC-061 — No LLM in the Gameplay Critical Path

**Decision:**  
Children must never need to wait for an LLM to answer a normal game interaction.

**Reason:**
- latency;
- reliability;
- cost;
- predictable gameplay;
- offline support.

**Status:** Active / Non-negotiable

---

## DEC-062 — AI Model Abstraction

**Decision:**  
AI providers/models must be accessed through an abstraction layer.

Initial preferred models:

```text
GPT-5 nano
GPT-5 mini
```

**Reason:**  
Model choice should be configurable and replaceable without changing business logic.

**Status:** Active

---

## DEC-063 — Cost-Aware Model Routing

**Decision:**  
Use cheaper/smaller models for simple tasks and stronger models only when needed.

Example:

```text
Simple:
- classification
- tagging
- metadata
- lightweight validation

→ GPT-5 nano

Complex:
- rich content generation
- planning
- difficult recommendations
- complex agent tasks

→ GPT-5 mini
```

**Status:** Active

---

## DEC-064 — AI Keys Remain Server-Side

**Decision:**  
AI provider credentials must never be exposed to the browser.

**Status:** Active / Non-negotiable

---

# 9. AI Content Decisions

## DEC-070 — Content Is Generated Before Gameplay

**Decision:**  
AI-generated content is created asynchronously and stored before it is served to children.

**Reason:**  
Gameplay must remain fast and deterministic.

**Status:** Active

---

## DEC-071 — AI Output Is Untrusted

**Decision:**  
AI output is treated as a proposal until validated.

Pipeline:

```text
AI Generation
    ↓
Schema Validation
    ↓
Deterministic Validation
    ↓
Quality/Safety Validation
    ↓
Approval
    ↓
Active Content
```

**Status:** Active / Non-negotiable

---

## DEC-072 — Only Approved/Active Content Is Playable

**Decision:**  
Child gameplay can use only content that has passed the required validation and publication workflow.

**Status:** Active / Non-negotiable

---

## DEC-073 — Content Pools

**Decision:**  
Learnzzy will maintain content pools for each game/difficulty combination.

Initial planning targets:

```text
Addition       100
Subtraction    100
Clean Up        30
Puzzle          30
Sketch          30
```

These are configurable targets, not permanent limits.

**Status:** Active

---

## DEC-074 — Automatic Pool Refill

**Decision:**  
When a content pool falls below its configured threshold, a background task can trigger content generation.

Example:

```text
Pool = 17
Threshold = 30

        ↓

Content Agent generates 50

        ↓

Validation

        ↓

Approved content stored

        ↓

Pool increases
```

**Status:** Active

---

# 10. Asset Decisions

## DEC-080 — Reuse Assets Before Generating

**Decision:**  
The Asset Agent should search for a suitable existing approved asset before generating a new one.

**Reason:**
- cost reduction;
- consistency;
- lower latency;
- fewer assets to maintain.

**Status:** Active

---

## DEC-081 — Central Asset Storage

**Decision:**  
Use S3-compatible object storage for game images and other large assets, with CDN delivery.

**Status:** Active

---

## DEC-082 — Child-Safe Asset Style

**Decision:**  
Generated assets should follow a consistent style:

- friendly;
- modern;
- rounded;
- clean;
- child-safe;
- high readability;
- no unnecessary text;
- no watermark.

**Status:** Active

---

# 11. Agent Workforce Decisions

## DEC-090 — Agentic Backend

**Decision:**  
The backend will use an agentic workforce rather than a simple chatbot-only AI integration.

Initial agents:

```text
Content Agent
Quality & Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
```

**Status:** Active

---

## DEC-091 — Background Agent Execution

**Decision:**  
Long-running AI/agent tasks must run asynchronously.

Technology:

```text
Redis
+
BullMQ
```

**Reason:**
- reliable background processing;
- retries;
- queue management;
- separation from child gameplay.

**Status:** Active

---

## DEC-092 — Agent Least Privilege

**Decision:**  
Each agent receives only the permissions required for its role.

Agents must not receive unrestricted database or system access.

**Status:** Active / Non-negotiable

---

## DEC-093 — Agent Auditability

**Decision:**  
Agent tasks/runs must record operational information such as:

- task type;
- agent;
- status;
- timestamps;
- validation results;
- errors;
- output summary;
- usage/cost where available.

**Status:** Active

---

## DEC-094 — No Chain-of-Thought Storage/Exposure

**Decision:**  
The platform must not expose private chain-of-thought through admin screens, APIs, logs, or child interfaces.

Store operational summaries and results instead.

**Status:** Active / Non-negotiable

---

# 12. Admin Decisions

## DEC-100 — Protected Admin Area

**Decision:**  
Admin functionality requires authentication and authorization.

Primary routes:

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

**Status:** Active

---

## DEC-101 — Agentic Admin Command Center

**Decision:**  
The admin experience should be agentic rather than a traditional form-heavy CRUD interface.

Example:

> Create 50 Level 1 addition activities.

The system should interpret the command, validate it, authorize it, create a background task, execute the workflow, and show an operational summary.

**Status:** Active

---

## DEC-102 — Natural Language Must Not Become Raw Database Access

**Decision:**  
Admin natural-language commands must be converted into structured intents and executed through normal services/repositories.

Never:

```text
LLM → raw MongoDB query
```

Instead:

```text
Command
 ↓
Intent
 ↓
Validation
 ↓
Authorization
 ↓
Business Service
 ↓
Repository
 ↓
MongoDB
 ↓
Audit
```

**Status:** Active / Non-negotiable

---

## DEC-103 — Confirmation for Consequential Actions

**Decision:**  
Consequential/destructive actions should require explicit confirmation where configured.

Examples:
- bulk deletion;
- bulk disabling;
- major difficulty changes;
- critical system changes;
- large-scale publishing.

**Status:** Active

---

# 13. Analytics Decisions

## DEC-110 — Structured Gameplay Events

**Decision:**  
Gameplay behavior is captured through structured events.

Examples:

```text
session_started
game_started
question_shown
answer_submitted
answer_correct
answer_incorrect
retry_started
hint_used
game_completed
puzzle_piece_placed
puzzle_completed
drawing_started
drawing_completed
```

**Status:** Active

---

## DEC-111 — Events Are Append-Oriented

**Decision:**  
Historical gameplay events should not be silently rewritten.

Corrections should use additional events or controlled administrative mechanisms.

**Status:** Active

---

## DEC-112 — Aggregate Analytics

**Decision:**  
Analytics should focus on aggregate product/learning signals such as:

- completion rate;
- success rate;
- retry rate;
- attempts;
- hint usage;
- game popularity;
- content performance;
- difficulty performance.

**Status:** Active

---

## DEC-113 — Analytics Must Not Slow Gameplay

**Decision:**  
Analytics processing must happen asynchronously where possible.

Expensive aggregation must not run synchronously in the child gameplay request.

**Status:** Active

---

# 14. Privacy Decisions

## DEC-120 — No Mandatory Child Account

**Decision:**  
The MVP does not require children to create accounts.

**Reason:**  
Simpler onboarding and reduced collection of personal data.

**Status:** Active

---

## DEC-121 — Data Minimization

**Decision:**  
Do not unnecessarily collect:

- names;
- email;
- phone;
- precise location;
- photos;
- public child profiles.

**Status:** Active / Non-negotiable

---

## DEC-122 — No Public Child Activity

**Decision:**  
Child gameplay/activity must not be publicly exposed.

**Status:** Active

---

# 15. Reward Decisions

## DEC-130 — Educational Rewards Only

**Decision:**  
Rewards may include:

- stars;
- badges;
- milestones;
- celebration animations.

**Reason:**  
Encourage learning without manipulative engagement patterns.

**Status:** Active

---

## DEC-131 — No Gambling-Like Mechanics

**Decision:**  
Do not introduce:

- loot boxes;
- gambling mechanics;
- manipulative reward loops.

**Status:** Active

---

## DEC-132 — No Pay-to-Progress

**Decision:**  
Learning progress must not depend on payment or purchases in the MVP.

**Status:** Active

---

# 16. Security Decisions

## DEC-140 — Validate All External Input

**Decision:**  
All API, admin, event, and agent inputs must be schema validated.

**Status:** Active

---

## DEC-141 — Validate All AI Output

**Decision:**  
No AI-generated object may be used directly without validation.

**Status:** Active / Non-negotiable

---

## DEC-142 — Rate Limit Expensive Operations

**Decision:**  
Rate limit public APIs and especially expensive operations such as:

- AI generation;
- admin commands;
- content generation;
- event ingestion.

**Status:** Active

---

## DEC-143 — Least-Privilege Credentials

**Decision:**  
Application services, workers, agents, and database users should receive only required permissions.

**Status:** Active

---

# 17. Infrastructure Decisions

## DEC-150 — Redis for Cache and Jobs

**Decision:**  
Redis will be used for:

- caching;
- BullMQ queues;
- background jobs;
- short-lived coordination state where required.

**Status:** Active

---

## DEC-151 — BullMQ for Background Jobs

**Decision:**  
BullMQ will manage asynchronous jobs.

Initial job categories include:

```text
content generation
content validation
asset processing
analytics processing
difficulty analysis
pool refill
```

**Status:** Active

---

## DEC-152 — Cloudflare/CDN

**Decision:**  
Use CDN delivery for static/large assets where appropriate.

**Status:** Active

---

## DEC-153 — Docker + Nginx + VPS

**Decision:**  
Initial deployment direction:

```text
Docker
+
Nginx
+
VPS
```

**Reason:**  
Simple, controllable deployment architecture suitable for the MVP.

**Status:** Active

---

## DEC-154 — Monitoring

**Decision:**  
Use:

```text
Sentry
+
structured logging
+
health checks
```

for production observability.

**Status:** Active

---

# 18. Performance Decisions

## DEC-160 — Fast Startup

**Decision:**  
Prioritize:

- small initial bundle;
- code splitting;
- lazy loading;
- optimized images;
- CDN;
- cached content.

**Status:** Active

---

## DEC-161 — No Synchronous AI Generation

**Decision:**  
There must be no unnecessary synchronous AI generation during gameplay.

**Status:** Active / Non-negotiable

---

## DEC-162 — Prefetch Content

**Decision:**  
The client should receive enough validated content to continue gameplay without waiting for content generation.

**Status:** Active

---

# 19. Development Decisions

## DEC-170 — Build Deterministic Foundation First

**Decision:**  
Build and validate the game foundation before implementing the agent workforce.

Recommended order:

```text
Foundation
 ↓
UI Library + PWA
 ↓
Game Framework
 ↓
Five Games
 ↓
MongoDB + Content Pool
 ↓
AI Service
 ↓
Agent Infrastructure
 ↓
Agents
 ↓
Admin Command Center
 ↓
Analytics + Difficulty
 ↓
Security + Performance
 ↓
Production
```

**Reason:**  
AI must improve a functioning deterministic platform rather than become a dependency for basic gameplay.

**Status:** Active

---

## DEC-171 — Reuse Existing Infrastructure

**Decision:**  
Where an existing repository/infrastructure component is suitable, reuse it rather than unnecessarily replacing it.

**Status:** Active

---

## DEC-172 — Every Completed Feature Must Be Tested

**Decision:**  
A backlog item is not considered complete until its relevant tests and validation are complete.

**Status:** Active

---

# 20. Documentation Decisions

## DEC-180 — Documentation Is Part of the Architecture

**Decision:**  
Important architecture and product decisions must be documented in Markdown files.

Current core documentation set:

```text
PROJECT_DETAILS.md
ARCHITECTURE.md
BUSINESS_RULES.md
DATABASE.md
UI.md
UI_UX.md
UI_LIBRARY.md
API.md
AGENTIC_IMPLEMENTATION_PLAN.md
BACKLOG.md
DECISIONS.md
```

**Status:** Active

---

## DEC-181 — Business Rules Are Not Prompt-Only

**Decision:**  
Business rules must exist in application/domain logic and documentation, not only inside AI prompts.

**Reason:**  
Prompts are not a reliable source of deterministic system behavior.

**Status:** Active / Non-negotiable

---

# 21. Explicit Non-Decisions

The following are intentionally **not locked** yet and should remain configurable or be decided later:

### Child identity model

MVP:

```text
anonymous session
```

Future parent/child account architecture remains open.

### Exact difficulty thresholds

The levels:

```text
Easy
Medium
Hard
```

are agreed, but exact numeric ranges remain configurable.

### Exact reward values

Star/badge/reward values remain configurable.

### Exact content-pool thresholds

Initial targets exist, but operational thresholds should be configuration-driven.

### Exact AI provider implementation

The architecture uses an AI abstraction layer so providers/models can change without changing business logic.

### Exact analytics warehouse

MongoDB is sufficient for the initial scale. A dedicated analytics platform can be introduced later if volume requires it.

### Exact authentication provider

Admin authentication is required, but the specific identity provider is not permanently locked by this document.

---

# 22. Superseding Decisions

When an architectural or product decision changes:

1. Do not silently edit the old decision.
2. Create a new decision ID.
3. Reference the decision being superseded.
4. Explain why it changed.
5. Update affected documentation.
6. Update implementation and tests.

Example:

```text
DEC-040 — MongoDB as Primary Database
Status: Superseded by DEC-200

DEC-200 — New Database Strategy
Status: Active
Supersedes: DEC-040
Reason: ...
```

---

# 23. Decision Change Rules

A new decision should be recorded when it materially changes:

- technology;
- database;
- architecture;
- security;
- privacy;
- game mechanics;
- AI behavior;
- agent permissions;
- data model;
- deployment;
- user experience;
- product scope;
- operational behavior.

Minor implementation details do not need a new decision record unless they have long-term architectural impact.

---

# 24. Current Technology Baseline

The currently agreed technical direction is:

```text
Frontend       Next.js + TypeScript
Game Engine    Phaser 3
UI             Tailwind CSS + reusable component library
Database       MongoDB
Validation     Zod + deterministic business rules
Cache          Redis
Jobs           BullMQ
AI             GPT-5 nano / GPT-5 mini
Assets         S3-compatible object storage
CDN            Cloudflare
Deployment     Docker + Nginx + VPS
Monitoring     Sentry + structured logging
```

This baseline should be treated as the default implementation direction unless a new decision supersedes one of these choices.

---

# 25. Master Architecture Decision

The most important Learnzzy decision is:

> **Keep the child experience deterministic, fast, simple, and safe while placing sophisticated AI and agentic automation behind the scenes.**

In practical terms:

```text
                    CHILD
                      |
                      v
                 Learnzzy PWA
                      |
                      v
                  Game Engine
                      |
                      v
             Validated Game Content
                      |
              +-------+-------+
              |               |
              v               v
           MongoDB          Redis
                              |
                           BullMQ
                              |
                              v
                       AI Agent Workers
                              |
                 +------------+------------+
                 |            |            |
                 v            v            v
              Content      Quality       Asset
               Agent        Agent        Agent
                 |
                 +----------------------+
                                        |
                                        v
                                 Validated Content
                                        |
                                        v
                                    MongoDB
```

The child should experience:

> **“I want to play this!”**

while the backend quietly performs the complex work of content generation, validation, analytics, asset management, difficulty analysis, and operational automation.

---

# 26. Final Guardrails

Unless explicitly superseded by a future approved decision:

1. MongoDB remains the primary database.
2. LLMs do not run the game engine.
3. LLMs do not perform authoritative arithmetic.
4. Gameplay does not wait for AI.
5. Browser state is not authoritative for protected results.
6. AI-generated content must be validated.
7. Only approved/active content is playable.
8. AI keys remain server-side.
9. Agents operate with least privilege.
10. Consequential agent/admin actions require authorization and appropriate confirmation.
11. Private chain-of-thought is never exposed.
12. Child PII collection is minimized.
13. No public child social features in MVP.
14. No gambling-like learning mechanics.
15. No intrusive gameplay advertising in MVP.
16. Background AI processing uses queues/jobs.
17. Business rules live in deterministic application logic.
18. Architecture decisions must be documented when materially changed.

---

## DEC-182 - Per-Skill Adaptive Levels

**Decision:**
Each game/skill carries its own adaptive level (`gameLevels` on the learner
doc, defaulting to foundation level 1). The global learner `level` remains
the journey/unlock authority; per-skill levels drive content complexity only.

**Reason:**
- Strength in one skill must never inflate or punish an unrelated skill.
- A result must never promote twice (global + skill) in a single step.
- Rolling history (3+ completions at 80%+ to promote, repeated weakness to
  reduce, +1/-1 steps, floor 1, ceiling 5) keeps adaptation forgiving and
  deterministic.

**Status:** Active (2026-09-16)

---

## DEC-183 — Academic Orchestrator Is Advisory-Only

**Decision:**
The Academic Orchestrator (`src/services/academicEngine.ts`) answers "what
should this learner learn next?" as a Validated Learning Plan. Tutor/OER/
NCERT output via the Education Gateway may nominate a known concept, but
stage, complexity, ordering, score, rewards, and progression are decided by
deterministic Learnzzy logic (`src/lib/academic.ts`) and gated by
`validateAcademicPlan`. Every gateway call is failure-isolated: MCP failures
never stop gameplay.

**Reason:**
- Keeps the "no LLM/MCP in the gameplay critical path" invariant (DEC-061)
  while allowing intelligent personalization.
- A single authority gate makes advisory output auditable and testable.

**Status:** Active (2026-09-17)

---

## DEC-184 — Voice Is Prepared, Cached, Never Live in Gameplay

**Decision:**
Voice content is prepared per language (en/hi/bn/ta/te), keyed
(character, event, locale, text-hash), and cached in `voiceAssets`.
Gameplay resolves cached audio or falls back instantly to device
speechSynthesis; no external TTS call happens in the request path, and
voice never blocks play.

**Reason:**
- Instant playback for children; zero per-interaction cost/latency.
- Text always works when audio is unavailable.

**Status:** Active (2026-09-17)

---

## DEC-185 — Visual Theme and Difficulty Are Independent Axes

**Decision:**
Dynamic visual themes vary presentation only; the Difficulty Engine owns
the numbers. Theme selection is a pure function of (seed, activityType)
and `verifyThemeMath` proves answers are invariant under theme changes.
Cross-domain combos (fruit+addition, bird+classification, …) resolve to
validated games and concepts.

**Reason:**
- Variety without risking mathematical correctness.
- New domains can be added without rewriting the game engine.

**Status:** Active (2026-09-17)

---

## DEC-186 — Stitch Is Visual Reference; Code Is Truth

**Decision:**
Stitch screens guide visual/UX language only. When Stitch artifacts cannot
be retrieved (no MCP tooling, expired URLs), implementation proceeds from
the written screen specifications + existing Playful Wonder tokens, reusing
Learnzzy components. Pixel parity is never claimed without inspecting the
actual Stitch screen. No Stitch-generated code replaces Learnzzy game logic,
scoring, progression, APIs, or security boundaries.

**Reason:**
- Protects the deterministic architecture from visual-reference churn.
- Keeps claims honest when retrieval is blocked.

**Status:** Active (2026-09-17)

---

## DEC-187 — Stitch Deviations: Shader, Hosts, Mechanics, Names

**Decision:**
After live-retrieving Stitch screens 12–20 (2026-09-18), four deliberate
deviations from the fetched designs, per the DEC-186 hierarchy:
1. The `Shader` WebGL simplex-noise background is NOT shipped as live
   WebGL — continuous fragment-shader rendering conflicts with documented
   PWA performance/battery rules; calm CSS ambient motion instead.
2. Breeze Valley keeps Teddy as guide (Stitch shows Bella) — the tested
   `characterForGame("subtraction") === "teddy"` mapping wins.
3. Clean Up keeps tap-to-tidy mechanics (Stitch shows basket sorting) —
   presentation aligned only, no mechanic rewrite.
4. Stitch display names ("Bella Bunny", "Prof. Hoot", "Pip the Puppy") are
   labels only; `characters.ts` roster/ids/roles are unchanged. Fetched art
   ships as optimized lazy WebP; worlds without Stitch art use gradients,
   never invented imagery.

**Reason:**
- Honors performance, test contracts, and prior mechanic decisions over
  visual-reference fidelity.
- Keeps every deviation explicit and reviewable instead of silent drift.

**Status:** Active (2026-09-18)

---

## DEC-188 — Category-First Learning Playground, Generic Activity Engine

**Decision:**
/play is now category-first (7 Learning World cards → /learn/[category] →
activities). Ten worksheet-inspired activities run on one generic engine:
pure deterministic generators (`lib/activityContent.ts`) + reusable
`ComplexityProfile` (`lib/complexity.ts`, spec §27 baseline) + registry
(`lib/activityRegistry.ts`) + `GET /api/activities/[id]/content` + one
`ActivityPlayer`. Shipped game engines (addition/subtraction/clean-up/
puzzle/sketch/discover) are linked, never duplicated. Results flow through
existing `game_events` + `POST academic/result`, so per-skill `skillLevels`,
parent dashboards, and the academic engine work with zero new contracts.
MCP/gateway untouched (advisory-only, fail-closed per DEC-183).

**Reason:**
- Worksheet patterns become interaction + story + character + complexity
  without forking 16 game engines or breaking tested progression.
- Complexity lives in one module (never hard-coded in components), so age
  changes the actual problem and performance moves ±1 level safely.

**Status:** Active (2026-09-18)

---

## DEC-189 — Home Is Category-Primary + Animal Wonderland Rich (Stitch d14a/4b84)

**Decision:**
Landing (/) is now category-primary per spec §2/§3 while preserving Stitch
child-first hierarchy (DEC-186/187): hero → CTA → `HomeContinue`
personalized Good-morning + plan-first Continue card → 7-category
`CATEGORIES` grid → secondary 5-tile quick shortcuts → games gallery.
`BrandLogo` (all 26 headers) navigates `→ /play` (the playground) not `/`.
Stitch `d14a9b61` + `4b8445bd` (ANIMATION_45 Rich) fetched via `curl -L`
validate `f929a9c4`/`b933` (identical copy; Rich delta is 5 mushrooms + 5
apples + 15 stars + 4 birds + tap jump burst). Trace-write correctness is
hardened: `answerIndex` now tracks shuffle, enforced by
`options[answerIndex]==answer` across bands/generators.

**Reason:**
- Spec §2 mandates category as primary navigation; Stitch hero is retained
  but no longer competes with it. Personalized `HomeContinue` fulfills
  spec §26 "not a random list" without new APIs.
- Validated Rich scene keeps 3D delight performant (tap burst, not always-on WebGL).

**Status:** Active (2026-09-18)

---

## DEC-190 — Calm Warm Female Voice Companion

**Decision:**
Voice is a calm, warm, friendly female learning companion: moderate speed
(0.82–0.88), soft volume (0.85), clear articulation, short sentences,
natural pauses (800ms `pauseAfterMs`), low-medium energy — "I'm learning
with a friendly teacher," never shouting. `VoiceScript`
{characterId,eventType,text,ageBand,language,emotion,speakingRate,
volumeProfile,pauseAfterMs} + `createVoiceScript`/`getVoiceProfile` +
13 calm events (INTRO/INSTRUCTION/LEARN/DEMONSTRATE/QUESTION/THINKING/
HINT/CORRECT/GENTLE_RETRY/EXPLANATION/DISCOVERY/LEVEL_PROGRESS/REWARD) in
5 locales share one warm quality; character personality (Teddy warm math,
Owl calm thinking, etc.) varies but quality stays soft+moderate+clear.
`CHARACTER_VOICES` 0.82–0.88 / pitch 0.97–1.05; TTS cached (`voiceAssets`) +
device `speechSynthesis` fallback, throttle 900ms to protect 2–4s thinking
time, mute + `prefers-reduced-motion` respected, never blocks gameplay.

**Reason:**
- Spec mandates calm over game-announcer; moderate+soft is comprehensible
  for 4–5 and pleasant after 10 minutes.
- Cached scripts (not per-click TTS) keep cost/latency zero.

**Status:** Active (2026-09-18)

---

## DEC-192 — Docker-First MCP (Private Network, Qdrant, Health)

**Decision:**
Tutor/OER/NCERT run as unified `services/mcp` shim (`node:20-alpine`,
non-root, `HEALTHCHECK`, `/health`/`/capabilities`/`/metrics`, Bearer auth,
`/data` volumes) on private `learnzzy` bridge + `qdrant:6333`
(`qdrant/qdrant:v1.9.4`). `docker-compose.yml` service DNS
(`http://tutor-mcp:3001` etc.), host `127.0.0.1:` mapping, `depends_on:
service_healthy` chain, `docker-compose.prod.yml` hides host ports and adds
log rotation. Gateway (`gateway.ts`, `config.ts` fail-closed) is sole
entry, private, validated, cached, with `npm run docker:health` and admin
`/api/admin/education/health` now showing `lastSuccess/lastFailure`.

**Reason:**
- Local/VPS parity, no MCP ports public, MCP failure never breaks child;
  shim satisfies documented REST contracts without inventing ports/auth.

**Status:** Active (2026-09-18)

---

## DEC-191 — All 25 Activities on Organized Wonder Play (Stitch Category Hub)

**Decision:**
`/play` now surfaces **all 25** `activityRegistry` activities organized by
Wonder World (Numbers 8, Words 2, Write 3, Think 7, Shapes 3, Discover &
Puzzles 2) in `All Wonder Adventures` with Stitch Category Hub 6-hub cards
(`1b8480cd` gradients/tactile shadows) and `WonderArchipelago3D`
(`a1812/9fa2` ANIMATION_48) wonderland. Missing 7 tiles added: `more-less`,
`count-by-tens`, `trace-number-name`, `matching`, `odd-one-out`, `pattern`,
`shape-match`. Tiles remain age-adaptive via `complexity.ts` and child-friendly.

**Reason:**
- Gaps: play showed 18/25 and generic hubs; spec requires complete, organized,
  child-friendly wonderland, not random grid.
- Grouping by World preserves Stitch hierarchy and Learnzzy complexity.

**Status:** Active (2026-09-18)

---

# 27. Decision Ownership

The decision log should be reviewed whenever:

- a major feature is introduced;
- the technology stack changes;
- the database model changes;
- an agent gains a new capability;
- privacy/security requirements change;
- a game mechanic changes;
- production architecture changes.

**Source of truth hierarchy:**

```text
Product Decisions
       ↓
Business Rules
       ↓
Architecture Decisions
       ↓
Database/API/UI Specifications
       ↓
Implementation
       ↓
Tests
```

If implementation conflicts with an active documented decision, the conflict must be resolved explicitly rather than silently choosing one.
