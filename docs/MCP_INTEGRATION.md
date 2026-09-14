# Learnzzy MCP Integration Plan

**Status:** Implemented (all providers disabled by default; deterministic mocks active)  
**Date:** 2026-09-14  
**Scope:** Tutor MCP, OER MCP, NCERT MCP

## 0. Implementation Status

Implemented under `src/integrations/education/`:

```text
types.ts            Zod contracts for all provider I/O + provenance
errors.ts           MCP_DISABLED/TIMEOUT/UNAVAILABLE/AUTH/ RATE_LIMITED/INVALID_RESPONSE/TOO_LARGE
provider.ts         LearningIntelligence / EducationalKnowledge / Curriculum interfaces
config.ts           TUTOR/OER/NCERT_MCP_ENABLED + URL/KEY, fail-closed when unconfigured
http.ts             timeout + bounded retry/backoff + 256 KiB cap, allowlisted paths only
cache.ts            Redis when configured, bounded in-memory TTL otherwise
health.ts           rolling status + durable educationProviderEvents log
provenance.ts       provenance builder + pool-safe license gate (CC BY/SA, CC0, public domain)
registry.ts         allowlisted registry; live adapter or deterministic mock
gateway.ts          single facade; 3-tier fallback: cache -> provider -> Mongo -> empty
tutor/ oer/ ncert/  HTTP adapters (documented REST-shim contracts) + curated mocks
init.ts             idempotent bootstrap (mocks always; live only when enabled)
```

Integration points: personalization agent records aggregated evidence and
attaches validated advisories (plan order/level never change);
content agent accepts optional `groundingTopic` with provenance stamped on
docs; admin `/api/admin/education/{providers,health,provenance}` + dashboard
panel; parent dashboard consumes validated plans/insights only.

Live provider URLs/keys are server-side only (`TUTOR/OER/NCERT_MCP_URL/_API_KEY`).
No browser code touches providers. Mongoose-free; indexes in `src/db/mongodb.ts`.

## 1. Purpose

This document defines how Learnzzy will integrate educational Model Context Protocol (MCP) capabilities without making the child gameplay experience dependent on external MCP servers, LLMs, or network availability.

The three planned educational integrations are:

1. **Tutor MCP** — learner state, mastery, misconceptions, review scheduling, and adaptive-learning recommendations.
2. **OER MCP** — open educational resources and knowledge retrieval for content grounding.
3. **NCERT MCP** — Indian/CBSE curriculum knowledge for future curriculum alignment, especially for older learner age/grade bands.

These MCPs are supporting services. **Learnzzy remains authoritative** for gameplay, scoring, rewards, levels, authorization, child safety, approved content, and learning-plan execution.

## 2. Core Architecture Principle

### Never put MCP in the child gameplay critical path.

Do not implement:

```text
Child Game -> LLM -> MCP -> External Source -> Answer
```

Use:

```text
Child Game
   |
   v
Game Events
   |
   v
Analytics / Learning Signals
   |
   v
Learnzzy Agents
   |
   +----> Tutor MCP
   |
   +----> OER MCP
   |
   +----> NCERT MCP
   |
   v
Validated Learnzzy Learning Plan / Content
   |
   v
MongoDB Content Pool
   |
   v
Child Game
```

If any MCP is unavailable, cached/approved Learnzzy data and deterministic fallback behavior must keep the product functional.

## 3. Provider Abstraction

Do not couple application code directly to a specific MCP implementation.

Create:

```text
src/
  integrations/
    education/
      types.ts
      provider.ts
      registry.ts
      gateway.ts
      tutor/
        tutor-provider.ts
      oer/
        oer-provider.ts
      ncert/
        ncert-provider.ts
```

Recommended interfaces:

```typescript
interface LearningIntelligenceProvider {
  getLearnerState(input: LearnerStateInput): Promise<LearnerState>;
  recordLearningEvidence(input: LearningEvidenceInput): Promise<void>;
  recommendNextActivity(
    input: NextActivityInput
  ): Promise<ActivityRecommendation>;
}

interface EducationalKnowledgeProvider {
  searchContent(
    input: EducationalSearchInput
  ): Promise<KnowledgeResult[]>;
  getConcept(
    input: ConceptInput
  ): Promise<KnowledgeConcept | null>;
}

interface CurriculumProvider {
  searchCurriculum(input: CurriculumSearchInput): Promise<CurriculumResult[]>;
  getPrerequisites(input: PrerequisiteInput): Promise<Prerequisite[]>;
}
```

Implement:

```text
TutorMCPProvider implements LearningIntelligenceProvider
OERMCPProvider implements EducationalKnowledgeProvider
NCERTMCPProvider implements CurriculumProvider
```

Also keep a native fallback implementation where practical.

## 4. Learnzzy Education Gateway

Agents should call one Learnzzy abstraction rather than individual MCP servers.

```text
educationGateway.getLearnerState(...)
educationGateway.findEducationalContent(...)
educationGateway.findCurriculum(...)
educationGateway.getNextLearningActivity(...)
```

The gateway is responsible for:

- provider selection
- authentication
- timeout
- retries
- rate limiting
- caching
- schema validation
- provenance
- provider health
- feature flags
- fallback
- structured logging
- error classification

Agents must not receive arbitrary URL-fetching capabilities.

# 5. Tutor MCP Integration

## Objective

Use Tutor MCP to improve learner modeling and adaptive learning.

Primary flow:

```text
Gameplay
   |
   v
gameEvents
   |
   v
Analytics Agent
   |
   v
learningSignals
   |
   v
Tutor MCP
   |
   +--> learner state
   +--> mastery
   +--> misconceptions
   +--> review scheduling
   +--> next-activity recommendation
   |
   v
Learnzzy Learning Planner
```

### Important boundary

Tutor MCP can recommend an activity. It must NOT:

- award stars
- award badges
- unlock levels
- modify game state
- determine answer correctness
- authorize parent access
- directly expose data to a child
- bypass Learnzzy content approval

Learnzzy business rules remain authoritative.

## Learning evidence

Do not send every raw interaction. Aggregate meaningful evidence first:

```json
{
  "learnerId": "internal-id",
  "gameId": "addition",
  "conceptId": "math.addition.within10",
  "difficulty": 1,
  "attempts": 10,
  "correct": 8,
  "responseTimeMs": 4200,
  "sessionId": "internal-session-id",
  "timestamp": "..."
}
```

Prefer pseudonymous learner IDs and age bands over personally identifying information.

# 6. Learnzzy Concept Model

Introduce stable internal learning concepts.

Example:

```json
{
  "id": "math.addition.within10",
  "domain": "mathematics",
  "name": "Addition within 10",
  "ageBand": "5-7",
  "prerequisites": [
    "math.number.recognition"
  ],
  "games": [
    "addition"
  ]
}
```

This concept ID becomes the bridge between Game, Analytics, Tutor MCP, OER MCP, and NCERT MCP. Do not make game IDs the educational model.

# 7. OER MCP Integration

## Objective

Use OER MCP to ground Learnzzy content generation and educational enrichment in open educational resources.

Flow:

```text
Learning Planner
   |
   v
Content requirement
   |
   v
Content Agent
   |
   v
OER MCP
   |
   v
Educational knowledge
   |
   v
Content generation
   |
   v
Quality & Safety Agent
   |
   v
Learnzzy content schema
   |
   v
Content Pool
```

OER output must never be sent directly to the child.

## Source provenance

Persist source metadata with generated content where available:

```json
{
  "source": {
    "provider": "oer-mcp",
    "sourceId": "...",
    "retrievedAt": "...",
    "license": "...",
    "reference": "..."
  }
}
```

Create an `educationalSources` collection or equivalent model.

Recommended fields:

```text
sourceId
provider
sourceType
license
subjects
ageBands
status
lastValidatedAt
qualityScore
```

Before production use, verify the exact license and redistribution conditions for each source.

# 8. NCERT MCP Integration

## Objective

Create an India/CBSE curriculum provider without coupling current Learnzzy games to a specific curriculum implementation.

Current NCERT MCP integration should initially be treated as a **future curriculum capability**, because the candidate project focuses on Grades 7–12 while the current Learnzzy MVP is designed around younger learners.

Architecture:

```text
NCERT MCP
   |
   v
NCERT / CBSE Knowledge
   |
   v
Curriculum Provider
   |
   v
Learnzzy Curriculum Mapping
```

Create curriculum abstractions now:

```text
curriculumFrameworks
curriculumStandards
curriculumMappings
```

Example:

```json
{
  "framework": "cbse",
  "grade": 7,
  "subject": "mathematics",
  "topic": "integers",
  "conceptId": "math.integers"
}
```

This allows future curriculum support without redesigning the learning model.

# 9. Provider Selection

The Education Gateway should select providers based on purpose.

```text
Request
  |
  +--> learner adaptation?
  |       |
  |       +--> Tutor MCP
  |
  +--> general educational knowledge?
  |       |
  |       +--> OER MCP
  |
  +--> Indian / CBSE curriculum?
          |
          +--> NCERT MCP
```

Never ask an agent to choose an arbitrary MCP endpoint.

# 10. Caching and Resilience

Use the existing Redis infrastructure.

```text
MCP Request
    |
    v
Redis Cache
    |
    +--> HIT -> return validated result
    |
    +--> MISS
           |
           v
        MCP Server
           |
           v
      Validate Result
           |
           v
        Redis Cache
```

MongoDB should store durable, validated educational knowledge or generated content where appropriate.

Required behavior:

```text
MCP timeout
   -> retry according to policy
   -> use cache
   -> use Learnzzy native fallback
   -> log degraded provider
```

MCP failure must never fail child gameplay.

# 11. Security and Privacy

External MCPs are untrusted dependencies.

Requirements:

- no direct browser-to-MCP access
- no arbitrary URL tool
- least-privilege provider credentials
- secrets only in environment/server-side configuration
- request timeout
- rate limiting
- response size limits
- schema validation with Zod
- prompt-injection-resistant processing
- provenance tracking
- no unnecessary child PII
- authorization before learner-specific operations
- parent data isolation
- learner isolation
- structured audit logs

Preferred learner payload:

```json
{
  "learnerId": "internal-id",
  "ageBand": "5-7",
  "conceptId": "math.addition.within10",
  "evidence": {
    "attempts": 10,
    "correct": 8
  }
}
```

Avoid sending names, emails, addresses, school information, or parent information unless there is a documented and necessary reason.

# 12. Validation Pipeline

Every external result passes through deterministic validation.

```text
MCP Result
   |
   v
Schema Validation
   |
   v
Source / Provenance Validation
   |
   v
Age-band Validation
   |
   v
License Validation
   |
   v
Educational Quality Validation
   |
   v
Safety Validation
   |
   v
Learnzzy Content Schema
   |
   v
Content Pool
```

Use the existing Quality & Safety Agent rather than creating a separate safety agent.

AI output remains advisory and untrusted until validation succeeds.

# 13. Agent Responsibilities

Update the Learnzzy workforce as follows:

```text
Content Agent
Quality & Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
Test & QA Agent
Personalization / Learning Planner Agent
External Knowledge Agent
```

### External Knowledge Agent

Keep this agent narrow.

Responsibilities:

- request educational knowledge
- normalize external responses
- manage provenance
- invoke approved providers
- coordinate cache/fallback
- report provider failures

It must not:

- publish content directly
- bypass Quality & Safety Agent
- modify game state
- award rewards
- authorize learners

# 14. Parent Experience

MCP-derived learning intelligence should appear to parents as understandable outcomes, not raw agent output.

Example:

```text
Mathematics

Addition within 10
████████░░ 80%

Number recognition
█████████░ 90%

Subtraction
█████░░░░░ 50%

Recommended next:
Practice subtraction within 10
```

The dashboard should expose progress, mastery, strengths, practice opportunities, recommended activities, and learning-plan status.

Do not expose internal chain-of-thought or hidden agent reasoning.

# 15. Feature Flags

Add:

```env
TUTOR_MCP_ENABLED=false
OER_MCP_ENABLED=false
NCERT_MCP_ENABLED=false
```

Enable independently and allow independent rollback. Provider availability must never determine whether the child can launch a game.

# 16. Observability

Track each provider:

```text
provider
operation
latencyMs
status
cacheHit
retryCount
responseSize
validationStatus
failureReason
timestamp
```

Dashboard example:

```text
Tutor MCP     Healthy
OER MCP       Healthy
NCERT MCP     Disabled / Future
```

Add provider health checks to the Test & QA Agent.

# 17. Test & QA Requirements

## Tutor MCP

- learner state
- evidence recording
- mastery progression
- misconception handling
- recommendation
- review scheduling
- duplicate evidence
- timeout
- retry
- learner isolation

## OER MCP

- search
- concept retrieval
- provenance
- license metadata
- duplicate handling
- malformed responses
- unsafe content
- timeout
- unavailable provider

## NCERT MCP

- grade filtering
- subject filtering
- chapter/topic retrieval
- curriculum search
- prerequisite mapping
- unavailable provider

## Security

- authentication
- authorization
- learner isolation
- parent-child authorization
- PII leakage tests
- prompt injection tests
- rate limiting
- oversized response tests

## Regression

Run lint, typecheck, unit tests, integration tests, API tests, E2E tests, build, and PWA checks. Physical device checks remain separate where required.

# 18. Implementation Order

### Phase 1 — Education Gateway

Implement provider interfaces, gateway, registry, feature flags, Zod schemas, Redis cache, timeout/retry, structured logging, provider health model.

### Phase 2 — Tutor MCP

Implement concept mapping, learner evidence adapter, learner state adapter, recommendation adapter, Learning Planner integration, and deterministic fallback.

### Phase 3 — OER MCP

Implement educational source registry, search adapter, provenance, Content Agent integration, validation pipeline, and Content Pool integration.

### Phase 4 — NCERT MCP

Implement curriculum abstraction, CBSE provider, grade/subject mapping, topic/prerequisite mapping, and feature-flagged integration.

### Phase 5 — Parent Experience

Connect Tutor -> Learning Plan -> Parent Progress.

### Phase 6 — Optimization

Add provider quality scores, automatic fallback, cache optimization, latency monitoring, usage/cost monitoring, and provider selection.

# 19. Definition of Done

- [ ] Child gameplay works with all MCP providers disabled.
- [ ] No browser code calls an MCP directly.
- [ ] All providers use Learnzzy interfaces.
- [ ] All external responses are schema validated.
- [ ] External educational content has provenance.
- [ ] MCP failures degrade gracefully.
- [ ] Redis caching works.
- [ ] Learner data is isolated.
- [ ] Parent authorization remains authoritative.
- [ ] Tutor recommendations cannot change game state directly.
- [ ] OER/NCERT content cannot bypass content validation.
- [ ] Test & QA Agent covers MCP integrations.
- [ ] Feature flags allow independent rollback.
- [ ] Production secrets are server-side only.
- [ ] Documentation records provider versions and integration assumptions.

# 20. Recommended Rollout

```text
                NOW
                 |
                 v
       Education Gateway
                 |
                 v
          Tutor MCP
                 |
                 v
       Learning Planner
                 |
                 v
            OER MCP
                 |
                 v
       Content Grounding
                 |
                 v
          NCERT MCP
                 |
                 v
      India/CBSE Curriculum
                 |
                 v
        Parent Experience
```

## Architectural Rule

> **MCPs provide intelligence and educational knowledge; Learnzzy owns the learner experience and remains the final authority.**

Tutor MCP should help answer: **What should this learner practice next?**

OER MCP should help answer: **What educational knowledge can ground this activity?**

NCERT MCP should help answer: **How does this concept map to Indian/CBSE curriculum?**

Learnzzy should answer: **Is this activity safe, approved, appropriate, available, and how does it affect the child's game, rewards, and progress?**
