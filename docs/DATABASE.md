# Learnzzy — Database Design & Data Model

**Document:** Database Architecture & MongoDB Data Model  
**Version:** 1.0  
**Status:** Draft / Implementation Source of Truth  
**Last Updated:** 2026-09-13

---

## 1. Purpose

This document defines the MongoDB database architecture for Learnzzy.

Learnzzy is a PWA-first educational game platform with five initial games, structured learning content, gameplay sessions/events, and an asynchronous AI agent workforce.

The database must support:

- fast child gameplay;
- pre-generated and validated learning content;
- dynamic content variation;
- game configuration and difficulty;
- anonymous gameplay sessions;
- gameplay analytics;
- AI agent tasks/runs;
- content and asset lifecycle;
- admin operations;
- auditability;
- offline event synchronization;
- future expansion to additional games.

The database must **not** become part of the real-time AI dependency of gameplay.

---

# 2. Database Technology

## Primary Database

**MongoDB**

MongoDB is the authoritative application database for:

- game definitions;
- game configuration;
- content;
- content versions;
- sessions;
- gameplay events;
- assets metadata;
- agents;
- agent tasks;
- agent runs;
- agent events;
- difficulty rules;
- difficulty recommendations;
- system settings;
- AI usage;
- admin/audit records.

## Supporting Infrastructure

```text
MongoDB
  ├── Application data
  ├── Content
  ├── Sessions
  ├── Events
  ├── Analytics source data
  ├── Agent state
  └── Configuration

Redis
  ├── Cache
  ├── BullMQ queues
  ├── Background jobs
  └── Short-lived locks/state

S3-compatible Object Storage
  ├── Images
  ├── Puzzle assets
  ├── Sketch assets
  ├── Audio
  └── Other binary files
```

Binary assets should not be stored directly in MongoDB unless a future requirement explicitly justifies GridFS or another storage mechanism.

---

# 3. Database Principles

## DB-001 — MongoDB Is Authoritative

MongoDB is the source of truth for persistent application state.

## DB-002 — Validate Before Persistence

All externally supplied data must pass schema validation before being persisted.

Recommended validation:

```text
Request
  ↓
Zod/schema validation
  ↓
Business-rule validation
  ↓
Authorization
  ↓
Service
  ↓
Repository
  ↓
MongoDB
```

## DB-003 — Business Rules Stay Outside the Database

MongoDB stores state and data.

Business rules must primarily live in deterministic application/domain services.

## DB-004 — AI Is Not the Database Authority

AI-generated data is considered untrusted until it passes:

1. schema validation;
2. deterministic validation;
3. quality/safety validation;
4. approval workflow where required.

## DB-005 — Gameplay Reads Must Be Fast

Child gameplay should use optimized queries and indexes.

Do not run expensive analytics or agent queries on the gameplay path.

## DB-006 — Event Data Is Append-Oriented

Gameplay events and important operational events should be treated as append-oriented records.

Do not silently rewrite historical gameplay events.

---

# 4. Database Naming Convention

Use:

- database: `learnzzy`
- collections: plural, lowercase camelCase or lowercase naming consistently;
- primary identifier: MongoDB `ObjectId` unless another identifier is explicitly required;
- external/public identifiers: generated opaque IDs;
- timestamps: UTC `Date`;
- status values: controlled enums;
- version numbers: integer;
- soft disable/archive where historical references matter.

Recommended collection naming:

```text
admins
games
gameConfigs
content
contentVersions
assets
assetVersions
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

---

# 5. Entity Relationship Overview

```text
                         ┌───────────────┐
                         │     games     │
                         └───────┬───────┘
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                     v                       v
              ┌─────────────┐        ┌──────────────┐
              │ gameConfigs │        │ difficultyRules│
              └─────────────┘        └──────────────┘
                     │
                     v
              ┌─────────────┐
              │   content   │
              └──────┬──────┘
                     │
              ┌──────┴─────────┐
              v                v
       ┌──────────────┐  ┌─────────────┐
       │contentVersions│  │   assets    │
       └──────────────┘  └──────┬──────┘
                                │
                         ┌──────v──────┐
                         │assetVersions│
                         └─────────────┘

       ┌────────────┐
       │  sessions  │
       └─────┬──────┘
             │
             v
       ┌────────────┐
       │ gameEvents │
       └────────────┘

       ┌────────────┐
       │   agents   │
       └─────┬──────┘
             │
       ┌─────┴──────────────┐
       v                    v
┌─────────────┐      ┌────────────┐
│ agentTasks  │─────>│ agentRuns  │
└─────────────┘      └─────┬──────┘
                            v
                      ┌────────────┐
                      │agentEvents │
                      └────────────┘

       ┌──────────────────────────┐
       │ difficultyRecommendations│
       └──────────────────────────┘

       ┌────────────┐     ┌────────────┐
       │  aiUsage   │     │ auditLogs  │
       └────────────┘     └────────────┘
```

---

# 6. Collection: `games`

Stores the canonical definition of every game.

## Example

```json
{
  "_id": "ObjectId",
  "gameId": "addition",
  "slug": "addition",
  "name": "Numbers",
  "displayName": "Numbers",
  "description": "Learn addition by counting objects.",
  "icon": "numbers",
  "engine": "phaser",
  "category": "math",
  "status": "active",
  "version": 1,
  "supportedModes": ["portrait", "landscape"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Initial game IDs

```text
addition
subtraction
clean-up
puzzle
sketch
```

## Rules

- `gameId` must be unique.
- A disabled game must not be offered to new child sessions.
- Game identity must be stable even if display text changes.
- Game-specific rules belong in game configuration/domain logic.

---

# 7. Collection: `gameConfigs`

Stores configurable game behavior.

## Example

```json
{
  "_id": "ObjectId",
  "gameId": "addition",
  "difficulty": "easy",
  "config": {
    "minOperand": 1,
    "maxOperand": 5,
    "maxAnswer": 10,
    "rounds": 5,
    "answerChoices": 3,
    "hintsEnabled": true,
    "rewardStars": 1
  },
  "version": 1,
  "status": "active",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Rules

- Configuration is server-controlled.
- Changes must be validated before activation.
- Historical configuration versions should remain auditable.
- Game code must not depend on undocumented magic numbers.

---

# 8. Collection: `content`

This is the primary content catalogue.

It represents a playable learning activity independent of a particular gameplay attempt.

## Common fields

```json
{
  "_id": "ObjectId",
  "contentId": "cnt_...",
  "gameId": "addition",
  "difficulty": "easy",
  "contentType": "addition_question",
  "status": "active",
  "version": 3,
  "source": "agent",
  "validation": {
    "schema": true,
    "deterministic": true,
    "quality": true,
    "safety": true
  },
  "payload": {},
  "assetIds": [],
  "tags": ["animals", "counting"],
  "usage": {
    "shown": 0,
    "completed": 0,
    "correct": 0,
    "incorrect": 0
  },
  "createdAt": "Date",
  "updatedAt": "Date",
  "approvedAt": "Date"
}
```

## Content statuses

```text
draft
validating
approved
active
rejected
disabled
```

Only `active` content is eligible for normal child gameplay.

---

# 9. Game-Specific Content Payloads

## Addition

```json
{
  "type": "addition_question",
  "operandA": 3,
  "operandB": 2,
  "correctAnswer": 5,
  "answerOptions": [4, 5, 6],
  "visualGroups": [
    {
      "count": 3,
      "assetIds": ["asset_1"]
    },
    {
      "count": 2,
      "assetIds": ["asset_1"]
    }
  ]
}
```

The answer must satisfy:

```text
correctAnswer = operandA + operandB
```

## Subtraction

```json
{
  "type": "subtraction_question",
  "startCount": 5,
  "removedCount": 2,
  "correctAnswer": 3,
  "answerOptions": [2, 3, 4]
}
```

The answer must satisfy:

```text
correctAnswer = startCount - removedCount
```

## Clean Up

```json
{
  "type": "clean_up_scene",
  "sceneAssetId": "asset_scene_1",
  "targets": [
    {
      "targetId": "target_1",
      "assetId": "asset_dirt_1",
      "interaction": "tap"
    }
  ],
  "completionRule": "all_targets_cleaned"
}
```

## Puzzle

```json
{
  "type": "picture_puzzle",
  "imageAssetId": "asset_image_1",
  "rows": 2,
  "columns": 2,
  "pieces": [
    {
      "pieceId": "p1",
      "correctPosition": 0
    },
    {
      "pieceId": "p2",
      "correctPosition": 1
    }
  ]
}
```

## Sketch

```json
{
  "type": "shadow_sketch",
  "outlineAssetId": "asset_outline_1",
  "difficulty": "easy",
  "validation": {
    "coverageThreshold": 0.6,
    "distanceTolerance": 0.25
  }
}
```

---

# 10. Collection: `contentVersions`

Stores historical versions of important content.

## Example

```json
{
  "_id": "ObjectId",
  "contentId": "cnt_123",
  "version": 3,
  "payload": {},
  "changeReason": "difficulty adjustment",
  "createdBy": {
    "type": "agent",
    "id": "difficulty-agent"
  },
  "validation": {
    "schema": true,
    "deterministic": true,
    "quality": true,
    "safety": true
  },
  "createdAt": "Date"
}
```

## Rules

- Do not overwrite historical versions.
- `contentId + version` must be unique.
- Active content references one current version.
- Version history must remain auditable.

---

# 11. Collection: `assets`

Stores metadata for binary assets.

Binary data should live in object storage.

## Example

```json
{
  "_id": "ObjectId",
  "assetId": "asset_123",
  "type": "image",
  "purpose": "game_object",
  "storage": {
    "provider": "s3",
    "bucket": "learnzzy-assets",
    "key": "games/addition/apple-123.webp"
  },
  "cdnUrl": "https://cdn.example/...",
  "mimeType": "image/webp",
  "width": 512,
  "height": 512,
  "sizeBytes": 45231,
  "status": "active",
  "source": "generated",
  "safety": {
    "checked": true,
    "safe": true
  },
  "tags": ["apple", "food", "object"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Rules

- MongoDB stores metadata, not normal image binaries.
- Every child-facing asset must pass required validation.
- Asset URLs should preferably use CDN delivery.
- Disabled assets must not be used by newly activated content.

---

# 12. Collection: `assetVersions`

Stores asset history.

```json
{
  "_id": "ObjectId",
  "assetId": "asset_123",
  "version": 2,
  "storageKey": "games/addition/apple-123-v2.webp",
  "changeReason": "optimization",
  "createdAt": "Date"
}
```

Asset replacement must not silently destroy the previous version.

---

# 13. Collection: `sessions`

Represents a child gameplay session.

No child account is required for the MVP.

## Example

```json
{
  "_id": "ObjectId",
  "sessionId": "sess_...",
  "clientSessionId": "opaque-client-id",
  "platform": "web",
  "device": {
    "type": "tablet",
    "orientation": "landscape"
  },
  "appVersion": "1.0.0",
  "startedAt": "Date",
  "lastActivityAt": "Date",
  "endedAt": null,
  "status": "active"
}
```

## Privacy Rules

Do not store unnecessary:

- name;
- email;
- phone;
- precise location;
- photos;
- public profile information.

Device information should be limited to what is operationally useful.

---

# 14. Collection: `gameEvents`

This is the primary gameplay telemetry collection.

## Example

```json
{
  "_id": "ObjectId",
  "eventId": "evt_...",
  "sessionId": "sess_...",
  "gameId": "addition",
  "contentId": "cnt_123",
  "event": "answer_submitted",
  "sequence": 12,
  "payload": {
    "answer": 5,
    "attempt": 1
  },
  "clientTimestamp": "Date",
  "serverTimestamp": "Date",
  "appVersion": "1.0.0",
  "source": "online"
}
```

## Event types

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
session_completed
puzzle_piece_placed
puzzle_completed
drawing_started
drawing_completed
```

Additional event types may be introduced through versioned event contracts.

## Rules

- `eventId` must be unique.
- Events are append-oriented.
- Client timestamps must not replace server timestamps.
- Server receives the authoritative ingestion timestamp.
- Event payloads must be schema validated.
- Events must be rate limited.
- Offline events require idempotent synchronization.

---

# 15. Collection: `agents`

Defines registered AI/automation agents.

## Example

```json
{
  "_id": "ObjectId",
  "agentId": "content-agent",
  "name": "Content Agent",
  "type": "content",
  "description": "Generates learning activities.",
  "status": "active",
  "permissions": [
    "content:create",
    "content:validate"
  ],
  "modelPolicy": {
    "preferredModel": "gpt-5-nano",
    "fallbackModel": "gpt-5-mini"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Initial agents

```text
content-agent
quality-safety-agent
asset-agent
analytics-agent
difficulty-agent
```

---

# 16. Collection: `agentTasks`

Represents requested agent work.

## Example

```json
{
  "_id": "ObjectId",
  "taskId": "task_...",
  "agentId": "content-agent",
  "type": "content_pool_refill",
  "priority": "normal",
  "status": "queued",
  "input": {
    "gameId": "addition",
    "difficulty": "easy",
    "quantity": 50
  },
  "requestedBy": {
    "type": "admin",
    "id": "admin_123"
  },
  "queue": "content-generation",
  "createdAt": "Date",
  "startedAt": null,
  "completedAt": null
}
```

## Task statuses

```text
queued
running
waiting
completed
failed
cancelled
```

---

# 17. Collection: `agentRuns`

Stores execution-level information for agent tasks.

## Example

```json
{
  "_id": "ObjectId",
  "runId": "run_...",
  "taskId": "task_...",
  "agentId": "content-agent",
  "attempt": 1,
  "model": "gpt-5-nano",
  "status": "completed",
  "startedAt": "Date",
  "completedAt": "Date",
  "result": {
    "generated": 50,
    "validated": 48,
    "rejected": 2
  },
  "usage": {
    "inputTokens": 10000,
    "outputTokens": 8000
  },
  "error": null
}
```

Do not store private chain-of-thought.

Store operational summaries instead.

---

# 18. Collection: `agentEvents`

Stores significant agent execution events.

```json
{
  "_id": "ObjectId",
  "runId": "run_123",
  "agentId": "content-agent",
  "event": "validation_completed",
  "level": "info",
  "message": "48 of 50 items passed validation.",
  "metadata": {},
  "createdAt": "Date"
}
```

Useful for the Admin Agent Command Center.

---

# 19. Collection: `difficultyRules`

Defines structured difficulty parameters.

## Example

```json
{
  "_id": "ObjectId",
  "gameId": "addition",
  "difficulty": "easy",
  "rules": {
    "minOperand": 1,
    "maxOperand": 5,
    "maxAnswer": 10,
    "answerChoices": 3
  },
  "status": "active",
  "version": 1,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Difficulty rules must be deterministic and testable.

---

# 20. Collection: `difficultyRecommendations`

Stores recommendations generated from aggregate analytics.

```json
{
  "_id": "ObjectId",
  "recommendationId": "rec_...",
  "gameId": "addition",
  "difficulty": "easy",
  "recommendation": {
    "change": "increase_max_operand",
    "currentValue": 5,
    "proposedValue": 7
  },
  "evidence": {
    "sampleSize": 1200,
    "successRate": 0.94,
    "completionRate": 0.91
  },
  "status": "pending_review",
  "createdBy": "difficulty-agent",
  "createdAt": "Date"
}
```

Possible statuses:

```text
pending_review
approved
rejected
applied
expired
```

Major learning-rule changes should not be silently applied.

---

# 21. Collection: `systemSettings`

Stores controlled application configuration.

## Example

```json
{
  "_id": "ObjectId",
  "key": "content_pool_threshold",
  "value": {
    "addition": 30,
    "subtraction": 30,
    "clean-up": 10,
    "puzzle": 10,
    "sketch": 10
  },
  "environment": "production",
  "version": 3,
  "updatedBy": "admin_123",
  "updatedAt": "Date"
}
```

Sensitive secrets must **not** be stored as normal application settings.

Use secure environment/secret management.

---

# 22. Collection: `aiUsage`

Tracks AI cost and operational usage.

## Example

```json
{
  "_id": "ObjectId",
  "requestId": "req_...",
  "taskId": "task_123",
  "runId": "run_123",
  "agentId": "content-agent",
  "provider": "openai",
  "model": "gpt-5-nano",
  "taskType": "content_generation",
  "usage": {
    "inputTokens": 10000,
    "outputTokens": 8000
  },
  "estimatedCost": 0.15,
  "status": "success",
  "createdAt": "Date"
}
```

This collection supports:

- cost dashboards;
- model routing decisions;
- budget monitoring;
- agent optimization;
- operational reporting.

---

# 23. Collection: `admins`

Stores administrator identity and authorization metadata.

## Example

```json
{
  "_id": "ObjectId",
  "adminId": "admin_123",
  "email": "admin@example.com",
  "role": "super_admin",
  "status": "active",
  "permissions": [
    "content:read",
    "content:approve",
    "content:disable",
    "agents:run",
    "settings:update"
  ],
  "lastLoginAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Passwords should not be stored in plaintext.

If external identity/authentication is used, MongoDB should store only the required identity mapping and authorization metadata.

---

# 24. Collection: `auditLogs`

Records consequential administrative/system actions.

## Example

```json
{
  "_id": "ObjectId",
  "auditId": "audit_...",
  "actor": {
    "type": "admin",
    "id": "admin_123"
  },
  "action": "content_bulk_disable",
  "target": {
    "type": "content",
    "ids": ["cnt_1", "cnt_2"]
  },
  "requestId": "req_123",
  "result": "success",
  "metadata": {},
  "createdAt": "Date"
}
```

Audit records should not contain unnecessary secrets or private reasoning.

---

# 24b. Collection: `parents`

Parent accounts. Children never sign in here.

```json
{
  "_id": "ObjectId",
  "parentId": "parent_...",
  "email": "parent@example.com",
  "name": "Optional",
  "passwordHash": "scrypt:learnzzy-parent-v1:...",
  "status": "active",
  "createdAt": "Date",
  "updatedAt": "Date",
  "lastLoginAt": "Date"
}
```

Passwords are scrypt hashes with a parent-specific salt (never plaintext,
never shared with admin credentials).

# 24c. Collection: `parentChildLinks`

Server-side authorization records. Only `active` links grant a parent
access to a learner.

```json
{
  "_id": "ObjectId",
  "parentId": "parent_...",
  "learnerId": "learner_...",
  "status": "pending | active | revoked",
  "createdAt": "Date",
  "activatedAt": "Date"
}
```

# 24d. Collection: `pairingCodes`

Short-lived single-use device-linking codes. Only SHA-256 hashes are
stored; plaintext codes exist only on screen.

```json
{
  "_id": "ObjectId",
  "codeHash": "sha256...",
  "parentId": "parent_...",
  "learnerId": "learner_... | null",
  "status": "open | pending | consumed | expired",
  "createdAt": "Date",
  "expiresAt": "Date",
  "usedAt": "Date"
}
```

# 24e. Collection: `educationProviderEvents`

Observability log for Education Gateway calls (no payloads, no secrets).

```json
{
  "_id": "ObjectId",
  "provider": "tutor-mcp | oer-mcp | ncert-mcp",
  "operation": "recommendNextActivity",
  "durationMs": 123,
  "success": true,
  "errorCode": "MCP_TIMEOUT | null",
  "cacheHit": false,
  "retryCount": 1,
  "responseBytes": 512,
  "correlationId": "edu_...",
  "createdAt": "Date"
}
```

# 24f. Collection: `educationKnowledgeCache`

Durable tier for validated external knowledge with provenance.

```json
{
  "_id": "ObjectId",
  "cacheKey": "edu:...",
  "provider": "oer-mcp",
  "kind": "search | concept | curriculum | prerequisites",
  "conceptId": "math.addition.within10",
  "payload": {},
  "provenance": { "license": "CC BY", "attribution": "OpenStax" },
  "retrievedAt": "Date",
  "expiresAt": "Date"
}
```

---

# 25. Index Strategy

Indexes must be based on real query patterns and verified with production-like workloads.

Recommended starting indexes:

## `games`

```text
{ gameId: 1 } UNIQUE
{ status: 1 }
```

## `gameConfigs`

```text
{ gameId: 1, difficulty: 1, status: 1 } UNIQUE
```

## `content`

```text
{ gameId: 1, difficulty: 1, status: 1, createdAt: 1 }
{ gameId: 1, status: 1, createdAt: 1 }
{ contentId: 1 } UNIQUE
```

If content selection uses tags:

```text
{ gameId: 1, difficulty: 1, status: 1, tags: 1 }
```

## `contentVersions`

```text
{ contentId: 1, version: 1 } UNIQUE
```

## `assets`

```text
{ assetId: 1 } UNIQUE
{ status: 1, type: 1 }
```

## `assetVersions`

```text
{ assetId: 1, version: 1 } UNIQUE
```

## `sessions`

```text
{ sessionId: 1 } UNIQUE
{ status: 1, lastActivityAt: 1 }
```

## `gameEvents`

```text
{ eventId: 1 } UNIQUE
{ sessionId: 1, serverTimestamp: 1 }
{ gameId: 1, event: 1, serverTimestamp: 1 }
{ contentId: 1, event: 1, serverTimestamp: 1 }
```

## `agentTasks`

```text
{ taskId: 1 } UNIQUE
{ status: 1, createdAt: 1 }
{ agentId: 1, status: 1, createdAt: 1 }
```

## `agentRuns`

```text
{ runId: 1 } UNIQUE
{ taskId: 1, startedAt: 1 }
{ agentId: 1, startedAt: 1 }
```

## `difficultyRecommendations`

```text
{ gameId: 1, difficulty: 1, status: 1, createdAt: 1 }
```

## `aiUsage`

```text
{ createdAt: 1 }
{ agentId: 1, createdAt: 1 }
{ model: 1, createdAt: 1 }
{ taskType: 1, createdAt: 1 }
```

## `auditLogs`

```text
{ createdAt: 1 }
{ "actor.id": 1, createdAt: 1 }
{ action: 1, createdAt: 1 }
```

---

# 26. Content Pool Query Strategy

The child gameplay API should query something equivalent to:

```text
gameId
+
difficulty
+
status = active
```

Optional filtering:

```text
tags
+
contentType
```

Example conceptual query:

```javascript
db.content.find({
  gameId: "addition",
  difficulty: "easy",
  status: "active"
})
```

The API should return a small batch rather than repeatedly querying for every individual interaction.

---

# 27. Content Pool Refill Flow

```text
Child Gameplay
      |
      v
Content Pool
      |
      | pool below threshold
      v
Background trigger
      |
      v
agentTasks
      |
      v
BullMQ / Redis
      |
      v
Content Agent
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
content + contentVersions
      |
      v
approved/active pool
```

The child request must not wait for this pipeline.

---

# 28. Session and Event Flow

```text
Child opens Learnzzy
        |
        v
Create Session
        |
        v
MongoDB sessions
        |
        v
Start Game
        |
        v
Game Events
        |
        +--> local queue when offline
        |
        v
gameEvents
        |
        v
Analytics aggregation
        |
        +--> Analytics Agent
        |
        +--> Difficulty Agent
```

---

# 29. Offline Event Synchronization

Offline events should contain a client-generated unique `eventId`.

Synchronization flow:

```text
Offline Event
     |
     v
Local Storage
     |
     v
Reconnect
     |
     v
POST /api/sync/events
     |
     v
Schema Validation
     |
     v
Idempotency Check
     |
     v
MongoDB
```

Duplicate event IDs must not create duplicate records.

Recommended approach:

```text
unique index(eventId)
```

and an idempotent ingestion service.

---

# 30. MongoDB Transactions

Do not use multi-document transactions everywhere.

Prefer atomic single-document operations where possible.

Use MongoDB transactions only when a business operation genuinely requires multiple documents to change atomically.

Examples that may justify a transaction:

- publishing content plus a tightly coupled version/state change;
- a critical admin operation that updates multiple authoritative records.

High-volume gameplay event ingestion should generally avoid unnecessary transaction overhead.

---

# 31. Data Retention

Retention must be configurable by data category.

Suggested categories:

```text
Gameplay events
Agent events
AI usage
Audit logs
Sessions
Content versions
Asset versions
```

Retention policies must balance:

- product analytics;
- debugging;
- security;
- storage cost;
- privacy requirements;
- applicable legal requirements.

Do not retain child-related data indefinitely by default.

---

# 32. Soft Disable vs Delete

Prefer disabling rather than deleting data when historical references are important.

Examples:

```text
content.status = disabled
asset.status = disabled
game.status = disabled
admin.status = disabled
```

Hard deletion should be reserved for:

- required privacy/data deletion;
- approved cleanup;
- expired temporary data;
- controlled maintenance.

Destructive operations must be auditable.

---

# 33. Data Security

## Secrets

Never store:

- OpenAI/API keys;
- database passwords;
- JWT signing secrets;
- object-storage secret keys;

in normal MongoDB application documents.

## Access

Use separate credentials/roles where practical:

```text
web application
worker
analytics
administration
migration
```

Each should receive only required database permissions.

---

# 34. Backup and Recovery

Production MongoDB must have:

- automated backups;
- tested restore procedures;
- monitoring;
- documented retention;
- recovery objectives.

Backup configuration is an infrastructure concern but is essential to database reliability.

Before production launch, verify:

```text
backup works
restore works
indexes recreated correctly
application reconnects
workers reconnect
```

---

# 35. Migration Strategy

Database changes must be backward compatible where practical.

Recommended process:

```text
Schema/Model Change
       |
       v
Add new fields/structures
       |
       v
Deploy compatible application
       |
       v
Backfill/migrate
       |
       v
Switch reads/writes
       |
       v
Remove obsolete fields later
```

Do not perform risky destructive migrations directly against production without a backup and rollback plan.

---

# 36. Seed Data

Initial production/staging seed data should include:

## Games

```text
addition
subtraction
clean-up
puzzle
sketch
```

## Difficulty

```text
easy
medium
hard
```

## Initial content target

```text
Addition      100
Subtraction   100
Clean Up       30
Puzzle         30
Sketch         30
```

These are starting targets, not permanent hard-coded limits.

## Agents

```text
Content Agent
Quality & Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
```

---

# 37. Database Environment Separation

Use separate databases/environments:

```text
learnzzy_dev
learnzzy_staging
learnzzy_prod
```

Never point development tooling at production accidentally.

Production credentials must not be committed to source control.

---

# 38. Repository Layer

Recommended application structure:

```text
src/
├── domain/
│   ├── games/
│   ├── content/
│   ├── sessions/
│   ├── events/
│   ├── agents/
│   └── difficulty/
│
├── services/
│   ├── content/
│   ├── gameplay/
│   ├── analytics/
│   └── agents/
│
├── repositories/
│   ├── games.repository.ts
│   ├── content.repository.ts
│   ├── sessions.repository.ts
│   ├── events.repository.ts
│   ├── agents.repository.ts
│   └── ...
│
└── db/
    ├── mongodb.ts
    ├── indexes.ts
    └── migrations/
```

The UI/game modules should not contain raw MongoDB queries.

---

# 39. Recommended MongoDB Driver Approach

For the initial implementation, prefer:

```text
MongoDB official Node.js driver
+
Zod
+
repository pattern
```

Mongoose may be used if the team gains meaningful value from its model/ODM features, but avoid unnecessary abstraction layers.

The most important requirement is a clean boundary:

```text
Game/UI
  ↓
API
  ↓
Service
  ↓
Repository
  ↓
MongoDB
```

---

# 40. Analytics Architecture

Raw events should remain in `gameEvents`.

Derived metrics may be generated asynchronously.

```text
gameEvents
    |
    v
Aggregation Jobs
    |
    +--> daily metrics
    +--> game metrics
    +--> content metrics
    +--> difficulty metrics
    |
    v
Admin Analytics
```

Do not run expensive aggregation pipelines synchronously inside the child gameplay request.

If the product later requires high-volume analytics, MongoDB change streams or an event/analytics pipeline can be introduced without changing the gameplay contract.

---

# 41. Database Performance Guardrails

1. Never query the entire `content` collection for one gameplay request.
2. Always use indexed filters for gameplay content selection.
3. Use projections when full documents are unnecessary.
4. Avoid unbounded event queries.
5. Paginate admin lists.
6. Paginate audit logs.
7. Keep large binary files outside MongoDB.
8. Do not run expensive analytics in the child request path.
9. Monitor slow queries.
10. Review indexes against real query plans.
11. Use batch event ingestion where practical.
12. Cache frequently read configuration/content metadata in Redis where beneficial.

---

# 42. Database Failure Behavior

If MongoDB becomes temporarily unavailable:

### Child gameplay

Previously loaded/cached content should continue where technically possible.

### API

Return controlled errors.

Do not expose:

- MongoDB error messages;
- stack traces;
- internal infrastructure details.

### Workers

Jobs should retry within configured limits.

### Events

Offline-capable clients may queue events locally until synchronization is possible.

---

# 43. Database Rules for AI Agents

Agents may read/write only the collections required by their role.

Example:

```text
Content Agent
  READ: games, gameConfigs, difficultyRules, assets
  WRITE: content, contentVersions, agentTasks, agentRuns, aiUsage

Quality/Safety Agent
  READ: content, assets
  WRITE: validation state, agent records

Asset Agent
  READ: assets, content
  WRITE: assets, assetVersions, agent records

Analytics Agent
  READ: gameEvents, sessions
  WRITE: analytics/recommendation outputs, agent records

Difficulty Agent
  READ: aggregate analytics, difficultyRules
  WRITE: difficultyRecommendations
```

Exact permissions must be implemented through service-level authorization and, where practical, infrastructure/database roles.

---

# 44. Database Rules for Admin Commands

Natural-language admin commands must never directly execute arbitrary MongoDB operations.

Incorrect:

```text
Admin prompt
  ↓
LLM
  ↓
raw MongoDB query
```

Correct:

```text
Admin command
  ↓
Intent extraction
  ↓
Structured command
  ↓
Schema validation
  ↓
Authorization
  ↓
Business-rule validation
  ↓
Service
  ↓
Repository
  ↓
MongoDB
  ↓
Audit log
```

Example:

```text
"Create 50 Level 1 addition activities."

becomes:

{
  "command": "content_pool_refill",
  "gameId": "addition",
  "difficulty": "easy",
  "quantity": 50
}
```

---

# 45. Critical Database Invariants

The following invariants must always hold.

## Content

```text
active content
    => schema valid
    => deterministic validation passed
    => safety/quality validation passed
```

## Addition

```text
correctAnswer = operandA + operandB
```

## Subtraction

```text
correctAnswer = startCount - removedCount
```

## Puzzle

```text
every piece has exactly one correct position
```

## Session

```text
sessionId is unique
```

## Event

```text
eventId is unique
```

## Versions

```text
contentId + version is unique
assetId + version is unique
```

## Agent execution

```text
agentRun.taskId references an existing task
```

These invariants should be covered by automated tests.

---

# 46. Recommended Database Module Boundaries

```text
Database
│
├── Games
│   ├── games
│   └── gameConfigs
│
├── Learning Content
│   ├── content
│   └── contentVersions
│
├── Assets
│   ├── assets
│   └── assetVersions
│
├── Gameplay
│   ├── sessions
│   └── gameEvents
│
├── AI Workforce
│   ├── agents
│   ├── agentTasks
│   ├── agentRuns
│   └── agentEvents
│
├── Learning Intelligence
│   ├── difficultyRules
│   └── difficultyRecommendations
│
├── Operations
│   ├── systemSettings
│   ├── aiUsage
│   └── auditLogs
│
└── Administration
    └── admins
```

---

# 47. Implementation Priority

## P0

1. MongoDB connection
2. Environment configuration
3. Repository foundation
4. `games`
5. `gameConfigs`
6. `content`
7. `sessions`
8. `gameEvents`
9. Core indexes
10. Validation schemas
11. Seed scripts

## P1

12. `contentVersions`
13. `assets`
14. `assetVersions`
15. `difficultyRules`
16. `admins`
17. `auditLogs`
18. `systemSettings`

## P1/P2 — AI Workforce

19. `agents`
20. `agentTasks`
21. `agentRuns`
22. `agentEvents`
23. `aiUsage`
24. `difficultyRecommendations`

---

# 48. Collections: `academicPlans` + `voiceAssets` (2026-09-17)

Validated Learning Plans and voice cache rows for the Academic Engine.
Both are written by deterministic services / the `academic-agent`; MCP
output never lands here without passing `validateAcademicPlan`.

```json
// academicPlans
{
  "_id": "ObjectId",
  "planId": "aplan_...",
  "learnerId": "learner_...",
  "ageBand": "6-7",
  "objective": "bird-recognition",
  "concept": "birds.parrot",
  "prerequisiteConcepts": ["knowledge.world-discovery"],
  "activityType": "recognition",
  "difficulty": 1,
  "complexity": 2,
  "reason": "Parrot recognition needs more practice.",
  "reasonCode": "needs_practice",
  "source": "deterministic",
  "nextReviewAt": "Date",
  "stage": "practice",
  "game": "discover",
  "locale": "en",
  "characterId": "parrot",
  "priority": 0.82,
  "createdAt": "Date",
  "createdAtDb": "Date"
}
```

```json
// voiceAssets
{
  "_id": "ObjectId",
  "assetId": "voice_...",
  "cacheKey": "voice:parrot:instruction:hi:<hash>",
  "characterId": "parrot",
  "event": "instruction",
  "locale": "hi",
  "text": "…prepared script (≤200 chars)…",
  "status": "pending",
  "audioUrl": null,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Recommended indexes: `academicPlans(learnerId, createdAtDb)`,
`voiceAssets(cacheKey)` unique. No chain-of-thought, prompts, or raw
provider traces are stored — operational summaries only.

---

# 49. Database Acceptance Criteria

The database implementation is considered ready when:

- MongoDB connection is reliable.
- Development/staging/production environments are separated.
- All P0 collections exist.
- Required indexes are created.
- Zod/schema validation is implemented.
- Content cannot become active without validation.
- Addition/subtraction correctness is deterministic.
- Session creation works.
- Gameplay events can be ingested.
- Event ingestion is idempotent.
- Content retrieval is indexed and fast.
- Admin authorization is enforced.
- Agent task state is persisted.
- AI usage is measurable.
- Audit logs exist for consequential operations.
- Backup/restore is documented before production.
- No secrets are stored in MongoDB documents.
- No child gameplay request requires an LLM call.

---

# 50. Final Database Architecture Principle

Learnzzy should use MongoDB as a **fast, structured application data store**, not as a place to put arbitrary AI output.

The correct architecture is:

```text
                 CHILD
                   |
                   v
              Next.js/PWA
                   |
                   v
               API Layer
                   |
                   v
          Deterministic Services
                   |
          +--------+--------+
          |                 |
          v                 v
       MongoDB            Redis
          |                 |
          |             BullMQ Jobs
          |                 |
          |                 v
          |          AI Agent Workers
          |                 |
          +--------<--------+
                   |
                   v
             Object Storage
```

The most important rule is:

> **Child gameplay reads validated data from MongoDB/cache; AI generates and improves that data asynchronously in the background.**

This keeps Learnzzy fast, predictable, scalable, and safe while allowing the AI workforce to continuously improve the platform.
