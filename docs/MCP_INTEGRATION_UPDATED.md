# Learnzzy — MCP Integration Plan (Updated)

**Status:** Planned / implementation-ready  
**Updated:** 2026-09-14  
**Based on:** latest `NEXT_SESSION.md`, `BACKLOG.md`, and `CHANGELOG.md`

## 1. Purpose

This document defines the integration plan for three educational MCP capabilities:

1. **Tutor MCP** — learner state, mastery, misconceptions, review scheduling, and adaptive-learning recommendations.
2. **OER MCP** — open educational resources and educational knowledge retrieval for content grounding.
3. **NCERT MCP** — Indian/CBSE curriculum knowledge for future curriculum alignment.

The latest Learnzzy implementation already includes an adaptive personalized-learning layer with learner profiles, age bands, 15 seeded level configurations, server-side progress/promotion, server reward mirroring, educational interest signals, deterministic personalization, validated learning plans, Personalization and QA agents, learner setup/plan/sticker UI, game shuffling, and admin personalization/learner-insight endpoints. Therefore MCP integration should **extend the existing learning system**, not replace it.

The current verification baseline is **50 automated tests**. Production-hardening work still includes physical-device QA, server-trusted scoring tokens, S3/CDN asset generation, Redis-backed multi-instance rate limiting, Sentry, and managed-service deployment validation.

---

# 2. Architectural Principle

MCP must remain a **background intelligence and knowledge layer**.

### Never:

```text
Child Game
  -> LLM
  -> MCP
  -> External source
  -> gameplay decision
```

### Instead:

```text
Child Game
   |
   v
Gameplay Events
   |
   v
Analytics
   |
   v
Learning Signals
   |
   v
Personalization / Learning Planner
   |
   +--> Tutor MCP
   |
   +--> OER MCP
   |
   +--> NCERT MCP
   |
   v
Validated Learning Plan / Content
   |
   v
Learnzzy Content Pool
   |
   v
Child Game
```

If every MCP is unavailable, Learnzzy must continue to operate using its deterministic/native services and cached approved data.

---

# 3. Current Learnzzy Baseline

The MCP work must build on the current implementation rather than duplicate it.

Already implemented:

```text
Mongo-backed content pools
AI provider abstraction
Agent registry
Task/run/event persistence
BullMQ/Redis + local fallback
Content Agent
Quality/Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
Personalization Agent
Test & QA Agent
Admin authentication
Protected admin APIs
Admin Command Center
Analytics endpoints
Pool refill triggers
Adaptive personalized learning
Learner profiles
Age bands
15 seeded level configurations
Server progress/promotion
Server reward mirror
Interest signals
Deterministic learning plans
Learner setup / plan / stickers UI
Per-window game shuffling
Admin learner insights
Admin levels / QA / personalization endpoints
Docker Compose
Nginx baseline
```

MCP should therefore be integrated through the existing agent/service infrastructure.

---

# 4. Target Architecture

```text
                         LEARNZZY
                            |
             +--------------+--------------+
             |                             |
       Child Experience              Parent Experience
             |                             |
             +--------------+--------------+
                            |
                    Learnzzy API Layer
                            |
                  Deterministic Services
                            |
                    Learning Signals
                            |
               Personalization Agent
                            |
                    Learning Planner
                            |
                  Education Gateway
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
    Tutor MCP           OER MCP            NCERT MCP
        |                   |                   |
        v                   v                   v
 Learner state       Educational           Curriculum
 mastery             knowledge             mapping
 review              sources               standards
        |                   |                   |
        +-------------------+-------------------+
                            |
                    Learnzzy Validation
                            |
               +------------+-------------+
               |                          |
        Quality/Safety Agent          QA Agent
               |                          |
               +------------+-------------+
                            |
                     Content / Plan
                            |
                        MongoDB
                            |
                     Content Pool
                            |
                       Child Game
```

---

# 5. Education Gateway

Do not let agents directly depend on third-party MCP implementations.

Create an internal abstraction:

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

Recommended contracts:

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
  searchCurriculum(
    input: CurriculumSearchInput
  ): Promise<CurriculumResult[]>;
  getPrerequisites(
    input: PrerequisiteInput
  ): Promise<Prerequisite[]>;
}
```

The application should depend on these interfaces, not directly on Tutor/OER/NCERT implementations.

---

# 6. Tutor MCP — Priority P0/P1

## Objective

Extend the already implemented Personalization/Learning Planner system with stronger learner modeling.

Tutor MCP should help answer:

> What does this learner appear to know, what needs reinforcement, and what should be reviewed next?

The existing Learnzzy PersonalizationService remains authoritative.

### Flow

```text
Game
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
Personalization Agent
  |
  v
Tutor MCP
  |
  +--> learner state
  +--> mastery evidence
  +--> misconceptions
  +--> review schedule
  +--> recommendation
  |
  v
Learnzzy Learning Planner
  |
  v
validated learning plan
```

### Evidence should be aggregated

Do not send every click.

Send meaningful evidence such as:

```json
{
  "learnerId": "internal-id",
  "gameId": "addition",
  "conceptId": "math.addition.within10",
  "difficulty": 1,
  "attempts": 10,
  "correct": 8,
  "responseTimeMs": 4200,
  "sessionId": "internal-session-id"
}
```

### Tutor MCP must NOT:

- determine final answer correctness
- award stars
- award stickers/badges
- unlock levels
- change protected progress directly
- modify game state
- authorize parent access
- expose learner data directly to the browser

Learnzzy's deterministic services remain authoritative.

---

# 7. Concept Model

Create stable educational concepts independent of game IDs.

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

The same `conceptId` can then be used by:

```text
Gameplay
Analytics
Tutor MCP
OER MCP
NCERT MCP
Learning Planner
Parent Progress
```

This is the central integration key.

---

# 8. OER MCP — Priority P1

## Objective

Use open educational resources to improve Content Agent grounding.

Flow:

```text
Learning Plan
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
Learnzzy content generation
     |
     v
Quality/Safety Agent
     |
     v
Content Pool
```

OER content is a **source for generation and grounding**, not a direct child-facing response.

## Provenance

Persist:

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

Create/extend an educational source registry with:

```text
sourceId
provider
sourceType
license
subjects
ageBands
status
qualityScore
lastValidatedAt
```

Before production use, verify source-specific licensing and redistribution terms.

---

# 9. NCERT MCP — Priority P2 / Future Curriculum Layer

NCERT MCP should initially be treated as a curriculum provider rather than a gameplay dependency.

The current candidate focuses on NCERT/CBSE Grades 7–12, while the current Learnzzy experience is aimed at younger learners.

Therefore:

```text
Current young-learner Learnzzy
        |
        X  direct NCERT dependency

Future older learner / curriculum mode
        |
        v
NCERT MCP
        |
        v
CBSE/NCERT mapping
```

Prepare the abstraction now:

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

This avoids redesigning the learning model later.

---

# 10. Provider Selection

Agents should ask the Education Gateway for a capability.

```text
Learner adaptation?
    -> Tutor MCP

Educational knowledge?
    -> OER MCP

Indian/CBSE curriculum?
    -> NCERT MCP
```

Never expose arbitrary provider selection to an LLM.

Provider selection should be deterministic/configurable.

---

# 11. Caching and Resilience

Use the existing Redis/BullMQ infrastructure.

```text
Education Request
       |
       v
Redis
  |
  +-- HIT --> validated cached response
  |
  +-- MISS
         |
         v
      MCP provider
         |
         v
      validation
         |
         v
        Redis
```

Failure strategy:

```text
MCP failure
    |
    v
Retry according to policy
    |
    v
Cached result
    |
    v
Learnzzy native fallback
    |
    v
Degraded-mode logging
```

Never fail a child game because an MCP is unavailable.

---

# 12. Security / Privacy

External MCPs are untrusted dependencies.

Required:

- server-side only
- no browser-to-MCP calls
- least-privilege credentials
- environment-based secrets
- request timeouts
- rate limits
- response-size limits
- Zod validation
- provenance
- prompt-injection-resistant processing
- learner isolation
- parent-child authorization checks
- structured audit logs

Use privacy-minimized learner information:

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

Do not send unnecessary:

```text
name
email
address
school
parent identity
```

---

# 13. Learning Plan Integration

This is the most important change from the earlier MCP plan.

Learnzzy already has deterministic personalized learning plans.

Therefore the integration becomes:

```text
Learning Signals
      |
      v
Personalization Agent
      |
      +----> Native deterministic learner model
      |
      +----> Tutor MCP
      |
      v
Candidate recommendation
      |
      v
Learnzzy validation
      |
      v
Learning Plan
      |
      v
Available approved game/content
```

MCP recommendations should be treated as **evidence/advice**.

The Learnzzy PersonalizationService decides the final plan.

---

# 14. Parent Experience Integration

The parent experience should consume Learnzzy's normalized learning model.

Example:

```text
Mathematics
Addition within 10     80%
Number recognition     90%
Subtraction            50%

Recommended next:
Practice subtraction within 10
```

Do not expose raw MCP responses or hidden model reasoning.

Parent-facing explanations should be concise, age-appropriate, and generated from validated learning signals.

---

# 15. Agent Workforce Update

The current Learnzzy workforce is:

```text
Content Agent
Quality & Safety Agent
Asset Agent
Analytics Agent
Difficulty Agent
Personalization Agent
Test & QA Agent
```

Add:

```text
External Knowledge Agent
```

Keep it narrow.

Responsibilities:

```text
provider invocation
normalization
cache coordination
source provenance
provider failure handling
```

It must not bypass:

```text
Quality/Safety
Content approval
Learnzzy business rules
```

---

# 16. Test & QA Expansion

The existing Test & QA Agent must add MCP coverage.

### Tutor

```text
learner state
evidence recording
mastery
misconceptions
recommendations
review scheduling
duplicate evidence
timeouts
retries
learner isolation
```

### OER

```text
search
concept retrieval
source provenance
license metadata
duplicates
malformed results
unsafe results
timeouts
provider failure
```

### NCERT

```text
grade filtering
subject filtering
topic/chapter retrieval
curriculum search
prerequisites
provider failure
```

### Cross-provider

```text
gateway routing
feature flags
cache hit/miss
fallback
timeout
rate limiting
schema validation
PII leakage
prompt injection
```

The current 50-test baseline must remain green after each integration step.

---

# 17. Feature Flags

Start disabled:

```env
TUTOR_MCP_ENABLED=false
OER_MCP_ENABLED=false
NCERT_MCP_ENABLED=false
```

Enable independently.

Example:

```env
TUTOR_MCP_ENABLED=true
```

Do not require all three providers to be available for production gameplay.

---

# 18. Observability

Record:

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

Admin health view:

```text
Tutor MCP     Healthy / Disabled / Degraded
OER MCP       Healthy / Disabled / Degraded
NCERT MCP     Healthy / Disabled / Future
```

Include MCP usage in existing agent observability and AI/cost monitoring where applicable.

---

# 19. Updated Implementation Order

## Phase 0 — Reconcile current implementation

Before coding:

```text
Read current docs
    +
Inspect repository
    +
Verify existing PersonalizationService
    +
Verify learning plans
    +
Verify QA agent
    +
Verify current tests
```

Do not rebuild existing functionality.

## Phase 1 — Education Gateway

Implement:

```text
provider interfaces
gateway
registry
feature flags
Zod schemas
Redis caching
timeouts
retry policies
logging
health status
```

## Phase 2 — Tutor MCP

Implement:

```text
concept mapping
evidence adapter
learner-state adapter
recommendation adapter
Learning Planner integration
deterministic fallback
```

## Phase 3 — OER MCP

Implement:

```text
source registry
search adapter
provenance
Content Agent integration
license checks
Quality/Safety integration
Content Pool integration
```

## Phase 4 — NCERT MCP

Implement:

```text
curriculum abstraction
CBSE provider
grade/subject mapping
topic/prerequisite mapping
feature-flagged integration
```

## Phase 5 — Parent Experience

Expose normalized:

```text
progress
mastery
strengths
practice opportunities
learning plan
recommended activities
```

## Phase 6 — Optimization

Implement:

```text
provider health scoring
automatic fallback
cache optimization
latency monitoring
usage/cost monitoring
provider selection
```

---

# 20. Current Production-Hardening Dependency

MCP implementation should not block the currently identified production-hardening work.

Existing remaining work includes:

```text
Physical-device QA
Server-trusted scoring tokens
S3/CDN asset generation
Redis-backed multi-instance rate limiting
Sentry integration
Managed MongoDB validation
Managed Redis validation
Deployment validation
```

Therefore MCP should be developed behind feature flags and should not delay security-critical production hardening.

---

# 21. Definition of Done

MCP integration is complete only when:

- [ ] Child gameplay works with all MCPs disabled.
- [ ] No browser code calls MCP directly.
- [ ] Provider interfaces isolate third-party implementations.
- [ ] Tutor recommendations are advisory.
- [ ] Learnzzy PersonalizationService remains authoritative.
- [ ] OER/NCERT data cannot bypass validation.
- [ ] External content has provenance.
- [ ] Redis caching works.
- [ ] MCP failures have deterministic fallback.
- [ ] Learner data is isolated.
- [ ] No unnecessary learner PII is sent.
- [ ] Feature flags permit independent rollback.
- [ ] Test & QA covers all providers.
- [ ] Existing 50-test baseline remains green.
- [ ] Provider health is observable.
- [ ] Production secrets remain server-side.
- [ ] Documentation is updated after implementation.

---

# 22. Final Architecture Rule

> **Tutor MCP understands learning state. OER MCP supplies educational knowledge. NCERT MCP supplies curriculum context. Learnzzy remains the final authority.**

The child should experience:

```text
Play
  -> Learn
  -> Progress
  -> Discover
  -> Play again
```

without knowing that MCPs exist.

The agentic system should quietly use them to make Learnzzy's learning plans, content, and curriculum alignment better while preserving the existing deterministic, safe, fast gameplay architecture.
