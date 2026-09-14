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
