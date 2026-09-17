# Learnzzy — API Specification

## 1. Purpose

This document defines the API contract for the Learnzzy educational gaming platform.

The API supports:

- Child gameplay
- Game content delivery
- Session management
- Learning-event collection
- Content management
- AI agent execution
- Asset management
- Analytics
- Difficulty recommendations
- Admin authentication
- System health
- AI usage and cost monitoring

## 2. API Principles

1. The child gameplay path must be fast.
2. No LLM call should be required for normal gameplay.
3. Game answers must be validated deterministically.
4. AI-generated content must pass schema and safety validation.
5. AI provider credentials remain server-side.
6. Public child APIs expose only the minimum required data.
7. Admin APIs require authentication and authorization.
8. Long-running AI operations use background jobs.
9. APIs should be idempotent where practical.
10. API responses should be versionable.
11. Do not expose internal agent chain-of-thought.
12. Avoid collecting unnecessary child personal information.

## 3. Base URL

Development:

```text
http://localhost:3000/api
```

Production:

```text
https://<production-domain>/api
```

Recommended future versioning:

```text
/api/v1/...
```

The initial implementation may use `/api/...`, but all route handlers should be written so `/v1` can be introduced without rewriting business logic.

## 4. Response Format

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "The requested content was not found.",
    "requestId": "req_123"
  }
}
```

Never return stack traces, secrets, provider errors, database credentials, or internal prompts to clients.

## 5. HTTP Status Codes

Use standard HTTP status codes:

```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

## 6. Authentication

### Child

The MVP does not require child authentication.

A temporary anonymous session identifier may be created.

Example:

```text
POST /api/sessions
```

Do not use personally identifying information to create a child session.

### Admin

Admin APIs require secure authentication.

Recommended:

- HttpOnly secure cookies
- Server-side session validation
- CSRF protection where applicable
- Rate limiting on login
- Role/permission checks

Never expose authentication secrets in client-side JavaScript.

---

# 7. Public Game APIs

## 7.1 Get Games

```http
GET /api/games
```

Returns active games available to children.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "addition",
      "name": "Number Adventure",
      "icon": "🔢",
      "description": "Learn addition through pictures.",
      "active": true
    },
    {
      "id": "subtraction",
      "name": "Fly Away",
      "icon": "🐦",
      "description": "Learn subtraction by counting what remains.",
      "active": true
    }
  ]
}
```

Do not expose internal configuration or agent information.

---

# 8. Session APIs

## 8.1 Create Session

```http
POST /api/sessions
```

Creates an anonymous gameplay session.

### Request

```json
{
  "deviceType": "tablet",
  "locale": "en-IN",
  "timezone": "Asia/Kolkata"
}
```

Do not require name, email, phone number, or precise location.

### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "expiresAt": "2026-09-13T20:00:00Z"
  }
}
```

---

# 9. Content APIs

## 9.1 Get Game Content

```http
GET /api/games/{gameId}/content
```

Example:

```http
GET /api/games/addition/content?difficulty=1&limit=5
```

### Query Parameters

```text
difficulty
limit
level (1..5, optional; defaults from difficulty)
ageBand (optional, used for level configuration)
learnerId (optional; required to enforce a learner's current unlock)
seed (optional deterministic selection seed)
recent (optional comma-separated recent content IDs)
```

### Response

```json
{
  "success": true,
  "data": {
    "gameId": "addition",
    "items": [
      {
        "contentId": "cnt_123",
        "difficulty": 1,
        "theme": "jungle",
        "type": "visual_addition",
        "question": {
          "a": 3,
          "b": 2
        },
        "objects": {
          "type": "banana",
          "countA": 3,
          "countB": 2
        },
        "answers": [3, 4, 5, 6],
        "correctAnswer": 5,
        "animation": "combine"
      }
    ]
  }
}
```

The API should return only the fields required by the game.

### Important

For some game types, do not send the correct answer to the client if doing so creates an opportunity to cheat or manipulate scoring.

For simple client-side games, answer validation may be local. For server-trusted scoring, send an answer verification token or validate server-side.

---

# 9.2 Learner Journey and Progression

```http
GET /api/learners/{learnerId}/journey
GET /api/learners/{learnerId}/plan
POST /api/learners/{learnerId}/progress
```

The journey response is derived from the existing learner level and exposes
the `numbers`, `creative`, and `visual` tracks with five levels each. Every
level is marked `completed`, `current`, or `locked`. The existing promotion
rule remains authoritative: three completions at 80%+ accuracy, one level at a
time, capped at level 5.

When `learnerId` and `level` are provided to the game-content endpoint, a
future level returns `403 LEVEL_LOCKED`. The browser journey is presentation;
the server remains the unlock authority.

# 10. Game Event API

## 10.1 Record Game Event

```http
POST /api/game-events
```

Used to record non-sensitive gameplay events.

### Request

```json
{
  "sessionId": "sess_abc123",
  "gameId": "addition",
  "contentId": "cnt_123",
  "event": "answer_submitted",
  "difficulty": 1,
  "metadata": {
    "correct": true,
    "responseTimeMs": 3200
  },
  "clientTimestamp": "2026-09-13T12:30:10Z"
}
```

### Supported events

```text
game_started
game_completed
question_shown
answer_submitted
answer_correct
answer_incorrect
retry_started
puzzle_started
puzzle_piece_placed
puzzle_completed
drawing_started
drawing_completed
session_started
session_completed
```

Avoid accepting arbitrary unvalidated event names.

### Response

```json
{
  "success": true,
  "data": {
    "recorded": true
  }
}
```

The endpoint should support batching.

---

# 11. Batch Event API

## 11.1 Record Multiple Events

```http
POST /api/game-events/batch
```

### Request

```json
{
  "sessionId": "sess_abc123",
  "events": [
    {
      "gameId": "addition",
      "contentId": "cnt_123",
      "event": "answer_correct",
      "metadata": {
        "responseTimeMs": 2800
      }
    },
    {
      "gameId": "addition",
      "contentId": "cnt_124",
      "event": "answer_incorrect",
      "metadata": {
        "responseTimeMs": 5100
      }
    }
  ]
}
```

This is preferred for offline synchronization.

---

# 12. Offline Sync API

## 12.1 Synchronize Events

```http
POST /api/sync/events
```

The PWA can queue events locally while offline.

### Request

```json
{
  "sessionId": "sess_abc123",
  "events": [
    {
      "clientEventId": "evt_local_001",
      "event": "answer_correct",
      "gameId": "addition",
      "contentId": "cnt_123",
      "clientTimestamp": "2026-09-13T12:30:10Z"
    }
  ]
}
```

The server must deduplicate using `clientEventId`.

### Response

```json
{
  "success": true,
  "data": {
    "accepted": 1,
    "duplicates": 0,
    "failed": 0
  }
}
```

---

# 13. Game-Specific Rules

## 13.1 Addition

The backend content schema should support:

```json
{
  "gameId": "addition",
  "difficulty": 1,
  "a": 3,
  "b": 2,
  "answer": 5,
  "objectType": "apple",
  "theme": "garden"
}
```

The application must calculate:

```text
expectedAnswer = a + b
```

and reject generated content where:

```text
answer !== expectedAnswer
```

## 13.2 Subtraction

```json
{
  "gameId": "subtraction",
  "difficulty": 1,
  "start": 5,
  "removed": 2,
  "answer": 3,
  "objectType": "bird",
  "theme": "sky"
}
```

Validate:

```text
expectedAnswer = start - removed
```

## 13.3 Clean Up

Example:

```json
{
  "gameId": "clean-up",
  "sceneId": "scene_001",
  "theme": "classroom",
  "objects": [
    {
      "id": "obj1",
      "type": "paper",
      "x": 20,
      "y": 40,
      "target": true
    },
    {
      "id": "obj2",
      "type": "book",
      "x": 60,
      "y": 50,
      "target": false
    }
  ]
}
```

## 13.4 Puzzle

Example:

```json
{
  "gameId": "puzzle",
  "imageAssetId": "asset_123",
  "grid": {
    "rows": 2,
    "columns": 2
  },
  "pieces": [
    {
      "id": "piece_1",
      "correctPosition": 0
    }
  ]
}
```

## 13.5 Sketch

Example:

```json
{
  "gameId": "sketch",
  "assetId": "asset_elephant_001",
  "difficulty": 1,
  "guidePath": "...",
  "tolerance": 18
}
```

Do not store raw child drawings by default unless there is a clear product/privacy requirement.

---

# 14. Admin APIs

All routes below require admin authentication.

## 14.1 Admin Dashboard

```http
GET /api/admin/dashboard
```

Returns operational summaries.

### Response

```json
{
  "success": true,
  "data": {
    "games": {
      "active": 5,
      "total": 5
    },
    "content": {
      "approved": 320,
      "pending": 18,
      "rejected": 12
    },
    "agents": {
      "running": 2,
      "idle": 3,
      "failed": 0
    },
    "system": {
      "api": "healthy",
      "database": "healthy",
      "redis": "healthy",
      "ai": "healthy"
    }
  }
}
```

---

# 15. Agent APIs

## 15.1 List Agents

```http
GET /api/admin/agents
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "content-agent",
      "name": "Content Agent",
      "status": "idle",
      "lastRunAt": "2026-09-13T12:00:00Z"
    },
    {
      "id": "quality-agent",
      "name": "Quality Agent",
      "status": "running",
      "lastRunAt": "2026-09-13T12:02:00Z"
    }
  ]
}
```

---

# 16. Run Agent

## 16.1 Start Agent Task

```http
POST /api/admin/agents/{agentId}/run
```

Long-running tasks must return `202 Accepted`.

### Request

```json
{
  "task": "generate_content",
  "gameId": "addition",
  "difficulty": 1,
  "count": 50
}
```

### Response

```json
{
  "success": true,
  "data": {
    "taskId": "task_123",
    "status": "queued"
  }
}
```

The API should enqueue the job in BullMQ.

It must not hold the HTTP request open while the AI agent runs.

---

# 17. Agent Task Status

```http
GET /api/admin/agent-tasks/{taskId}
```

### Response

```json
{
  "success": true,
  "data": {
    "taskId": "task_123",
    "agentId": "content-agent",
    "status": "running",
    "progress": {
      "total": 50,
      "processed": 31,
      "approved": 28,
      "rejected": 3
    }
  }
}
```

---

# 18. Agent Runs

```http
GET /api/admin/agent-runs
```

Query parameters:

```text
agentId
status
from
to
limit
cursor
```

Returns historical operational data.

Do not expose hidden reasoning or private model chain-of-thought.

---

# 19. Content Management APIs

## 19.1 List Content

```http
GET /api/admin/content
```

Query parameters:

```text
gameId
difficulty
status
theme
search
limit
cursor
```

## 19.2 Get Content

```http
GET /api/admin/content/{contentId}
```

## 19.3 Approve Content

```http
POST /api/admin/content/{contentId}/approve
```

## 19.4 Reject Content

```http
POST /api/admin/content/{contentId}/reject
```

### Request

```json
{
  "reason": "Incorrect answer"
}
```

## 19.5 Regenerate Content

```http
POST /api/admin/content/{contentId}/regenerate
```

This should create a background task rather than synchronously calling the AI provider.

## 19.6 Disable Content

```http
POST /api/admin/content/{contentId}/disable
```

Prefer soft deletion/disablement rather than hard deletion.

---

# 20. Content Generation API

## 20.1 Request Generation

```http
POST /api/admin/content/generate
```

### Request

```json
{
  "gameId": "addition",
  "difficulty": 1,
  "theme": "jungle",
  "count": 50
}
```

### Response

```json
{
  "success": true,
  "data": {
    "taskId": "task_generate_123",
    "status": "queued"
  }
}
```

Generation pipeline:

```text
Request
  ↓
Queue
  ↓
Content Agent
  ↓
Schema Validation
  ↓
Deterministic Validation
  ↓
Quality/Safety Agent
  ↓
Approved Content
  ↓
MongoDB
```

---

# 21. Content Pool APIs

## 21.1 Get Pool Status

```http
GET /api/admin/content/pools
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "gameId": "addition",
      "difficulty": 1,
      "available": 83,
      "minimum": 30,
      "target": 100,
      "status": "healthy"
    }
  ]
}
```

## 21.2 Trigger Pool Refill

```http
POST /api/admin/content/pools/{gameId}/refill
```

Optional:

```json
{
  "difficulty": 1,
  "count": 50
}
```

---

# 22. Asset APIs

## 22.1 List Assets

```http
GET /api/admin/assets
```

Query parameters:

```text
gameId
type
theme
status
search
limit
cursor
```

## 22.2 Generate Asset

```http
POST /api/admin/assets/generate
```

### Request

```json
{
  "type": "banana",
  "theme": "jungle",
  "games": ["addition", "subtraction"]
}
```

Returns a queued task.

## 22.3 Asset Status

```http
GET /api/admin/assets/{assetId}
```

## 22.4 Approve Asset

```http
POST /api/admin/assets/{assetId}/approve
```

## 22.5 Reject Asset

```http
POST /api/admin/assets/{assetId}/reject
```

Binary files should remain in object storage/CDN. MongoDB stores metadata and references.

---

# 23. Analytics APIs

## 23.1 Game Analytics

```http
GET /api/admin/analytics/games
```

Query parameters:

```text
from
to
gameId
difficulty
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "gameId": "addition",
      "starts": 1200,
      "completions": 1030,
      "accuracy": 0.84,
      "averageResponseTimeMs": 3200
    }
  ]
}
```

## 23.2 Content Analytics

```http
GET /api/admin/analytics/content
```

Identify:

- high-performing content
- low-performing content
- high error rates
- unusually long completion times
- low completion rates

## 23.3 Agent Analytics

```http
GET /api/admin/analytics/agents
```

Track:

- task count
- success rate
- failures
- token usage
- estimated AI cost
- processing time

---

# 24. Difficulty APIs

## 24.1 Get Difficulty Rules

```http
GET /api/admin/difficulty/rules
```

## 24.2 Create Recommendation

```http
POST /api/admin/difficulty/analyze
```

This should queue a Difficulty Agent task.

## 24.3 Apply Recommendation

```http
POST /api/admin/difficulty/recommendations/{id}/approve
```

Major learning-rule changes require explicit admin approval.

---

# 25. Admin Command API

## 25.1 Natural-Language Command

```http
POST /api/admin/commands
```

### Request

```json
{
  "command": "Create 50 Level 1 addition activities."
}
```

### Response

```json
{
  "success": true,
  "data": {
    "taskId": "task_command_123",
    "status": "queued"
  }
}
```

The command router should:

1. Understand intent.
2. Select an appropriate agent.
3. Create a structured task.
4. Execute through BullMQ.
5. Return an operational summary.

Do not allow arbitrary natural-language commands to directly execute destructive operations.

---

# 26. AI Provider APIs

AI provider calls must remain internal.

Do not expose routes such as:

```text
/api/openai
/api/gpt
```

to the public client.

Instead:

```text
API
 ↓
Agent Worker
 ↓
AIService
 ↓
Configured Provider
```

The `AIService` should abstract:

```text
generateStructuredContent()
classify()
summarize()
recommendDifficulty()
```

Model configuration should be environment/config driven.

---

# 27. MongoDB Data Contracts

Recommended collections:

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

## Example Content Document

```json
{
  "_id": "cnt_123",
  "gameId": "addition",
  "type": "visual_addition",
  "difficulty": 1,
  "theme": "jungle",
  "content": {
    "a": 3,
    "b": 2,
    "answer": 5,
    "objectType": "banana",
    "answers": [3, 4, 5, 6]
  },
  "status": "approved",
  "version": 1,
  "validation": {
    "schema": true,
    "mathematical": true,
    "quality": true,
    "safety": true
  },
  "createdAt": "2026-09-13T12:00:00Z",
  "updatedAt": "2026-09-13T12:00:00Z"
}
```

Use MongoDB indexes for frequent queries.

Recommended indexes include:

```text
content:
(gameId, difficulty, status)
(gameId, status, createdAt)
(theme, gameId)

gameEvents:
(sessionId, createdAt)
(gameId, event, createdAt)

agentTasks:
(status, createdAt)

agentRuns:
(agentId, startedAt)
```

Avoid unbounded document growth. Large event histories should be stored as individual documents or appropriately partitioned records.

---

# 28. Rate Limiting

Public endpoints must be rate limited.

Higher-risk endpoints:

```text
POST /api/sessions
POST /api/game-events
POST /api/game-events/batch
```

Admin/AI endpoints require stricter limits:

```text
POST /api/admin/agents/*
POST /api/admin/content/generate
POST /api/admin/assets/generate
POST /api/admin/commands
```

Do not allow a client to trigger unlimited AI generation.

---

# 29. Idempotency

For operations that may be retried, support an idempotency key.

Example:

```http
Idempotency-Key: 7d7b7f...
```

Especially useful for:

- event synchronization
- content generation commands
- approval operations
- agent task creation

---

# 30. Pagination

Use cursor-based pagination for large collections.

Example:

```http
GET /api/admin/content?limit=50&cursor=eyJpZCI6...
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "nextCursor": "..."
    }
  }
}
```

Avoid large `skip/offset` pagination for high-volume event collections.

---

# 31. Health APIs

## Public Health

```http
GET /health
```

Expected:

```json
{
  "status": "ok"
}
```

## API Health

```http
GET /api/health
```

Expected:

```json
{
  "status": "ok",
  "service": "learnzzy-api"
}
```

## Detailed Admin Health

```http
GET /api/admin/system/health
```

Check:

```text
API
MongoDB
Redis
BullMQ
Object Storage
AI Provider
```

Do not expose infrastructure details publicly.

---

# 32. Error Codes

Use stable application error codes.

Examples:

```text
INVALID_REQUEST
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
GAME_NOT_FOUND
CONTENT_NOT_FOUND
CONTENT_NOT_AVAILABLE
SESSION_NOT_FOUND
AGENT_NOT_FOUND
TASK_NOT_FOUND
TASK_ALREADY_RUNNING
CONTENT_VALIDATION_FAILED
ASSET_NOT_FOUND
ASSET_GENERATION_FAILED
AI_PROVIDER_UNAVAILABLE
RATE_LIMITED
DATABASE_UNAVAILABLE
INTERNAL_ERROR
```

Clients should use `code`, not human-readable `message`, for programmatic behaviour.

---

# 33. Security Rules

1. Validate every request.
2. Validate every AI response.
3. Never trust client-side scores.
4. Never trust client-provided difficulty.
5. Never expose secrets.
6. Never expose internal prompts.
7. Never expose agent chain-of-thought.
8. Sanitize admin command inputs.
9. Rate-limit expensive operations.
10. Audit consequential admin actions.
11. Use least-privilege database credentials.
12. Use secure HTTP headers.
13. Keep dependencies patched.

---

# 34. API Layer Structure

Recommended code organization:

```text
src/
├── app/
│   └── api/
│       ├── games/
│       ├── sessions/
│       ├── game-events/
│       ├── sync/
│       ├── admin/
│       └── health/
│
├── server/
│   ├── services/
│   │   ├── game/
│   │   ├── content/
│   │   ├── analytics/
│   │   ├── agents/
│   │   ├── assets/
│   │   └── ai/
│   │
│   ├── repositories/
│   │   ├── games/
│   │   ├── content/
│   │   ├── sessions/
│   │   ├── events/
│   │   └── agents/
│   │
│   └── validation/
│
└── workers/
    ├── content/
    ├── assets/
    ├── analytics/
    ├── difficulty/
    └── quality/
```

Keep route handlers thin.

Preferred flow:

```text
Route Handler
    ↓
Authentication / Authorization
    ↓
Request Validation
    ↓
Service
    ↓
Repository
    ↓
MongoDB
```

For background tasks:

```text
Route
 ↓
Create Task
 ↓
BullMQ
 ↓
Worker
 ↓
Agent
 ↓
Service
 ↓
MongoDB
```

---

# 35. API Testing

Every API should have tests for:

### Public

- Game listing
- Session creation
- Content retrieval
- Event submission
- Batch events
- Offline synchronization

### Admin

- Authentication
- Authorization
- Agent execution
- Task status
- Content approval/rejection
- Asset management
- Analytics
- Difficulty recommendations
- Command routing

### Failure cases

- Invalid payload
- Missing authentication
- Unauthorized role
- Rate limit
- MongoDB unavailable
- Redis unavailable
- AI provider unavailable
- Duplicate request
- Invalid AI-generated content

---

# 36. API Performance Requirements

Public gameplay endpoints should be optimized for low latency.

Rules:

- Cache game metadata.
- Cache content where appropriate.
- Avoid unnecessary database joins/lookups.
- Return only required fields.
- Use MongoDB indexes.
- Use CDN for assets.
- Avoid synchronous AI operations.
- Batch event writes.
- Use compression where appropriate.

The child gameplay path should never wait for:

- AI generation
- image generation
- analytics analysis
- agent execution

---

# 37. API Versioning Strategy

When breaking changes are required:

```text
/api/v1/...
/api/v2/...
```

Do not silently change the meaning of an existing API contract.

Content schemas should also carry versions:

```json
{
  "schemaVersion": 1
}
```

---

# 38. Parent APIs

Parent routes use HttpOnly `lz_parent` cookie sessions (scrypt password
hashes, 7-day TTL, rate-limited login/register). Every child-data endpoint
enforces an **active** `parentChildLinks` record server-side; pending or
revoked links grant nothing.

```text
POST /api/parent/auth/register   { email, password 12+, name? }
POST /api/parent/auth/login      { email, password }
POST /api/parent/auth/logout
GET  /api/parent/auth/me
GET  /api/parent/children                          # summaries + pending ids
GET  /api/parent/children/{childId}                # summary + recent activity
GET  /api/parent/children/{childId}/learning-plan  # latest validated plan
GET  /api/parent/children/{childId}/insights       # strengths/practice/next
GET  /api/parent/children/{childId}/activity       # recent game events
GET  /api/parent/children/{childId}/progress       # level/stars/per-game/concepts
```

Parent responses contain validated learning summaries only — no LLM
chain-of-thought, prompts, or raw provider traces.

# 39. Pairing APIs

Privacy-minimized device linking. Codes are 6 unambiguous characters,
SHA-256 hashed at rest, 15-minute TTL, single-use (atomic open→pending),
5 confirms/hour/IP.

```text
POST /api/parent/pairing          # {} -> { code, expiresAt } | { action: approve|revoke, learnerId }
GET  /api/parent/pairing          # links + pending approvals
POST /api/pairing/confirm         # { code, learnerId } -> pending (parent must approve)
```

# 40. Education Gateway Diagnostics (admin)

```text
GET /api/admin/education/providers   # flags + config presence (no secrets/URLs)
GET /api/admin/education/health      # per-provider status/latency/errors + cache stats
GET /api/admin/education/provenance  # recent provider events + cached knowledge provenance
```

# 41. Definition of Done

The API implementation is complete when:

- All public endpoints work.
- Admin endpoints are protected.
- MongoDB repositories are implemented.
- Redis/BullMQ jobs work.
- AI calls are server-side.
- Content is schema validated.
- Arithmetic is deterministically validated.
- Events support offline synchronization.
- AI tasks are asynchronous.
- Agent task status is observable.
- Rate limiting is implemented.
- Idempotency is implemented where required.
- Health endpoints work.
- Errors use stable codes.
- API tests pass.
- No child-facing API exposes unnecessary personal data.
- No public API exposes secrets or internal agent reasoning.
