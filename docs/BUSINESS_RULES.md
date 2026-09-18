# Learnzzy — Business Rules

**Document:** Business Rules & Product Logic  
**Version:** 1.0  
**Status:** Draft / Implementation Source of Truth  
**Last Updated:** 2026-09-13

---

## 1. Purpose

This document defines the business rules that govern Learnzzy's child gameplay, learning content, scoring, progression, AI-generated content, agents, administration, analytics, privacy, and operational behavior.

These rules are independent of UI implementation. Frontend, backend, game modules, AI agents, and admin tools must follow them.

---

## 2. Core Product Principles

1. Learnzzy is a **learning playground**, not a competitive gaming platform.
2. Learning correctness has higher priority than game speed or visual effects.
3. Child gameplay must remain fast and must not depend on a live LLM response.
4. Arithmetic, scoring, answer validation, progress calculation, and game state must be deterministic.
5. AI may generate or recommend content, but AI must not be the final authority for correctness.
6. Every AI-generated learning item must pass schema validation and deterministic business-rule validation before publication.
7. Child UX must be visual-first, simple, positive, and age appropriate.
8. Incorrect answers should guide the child rather than punish or embarrass them.
9. No unnecessary child PII should be collected.
10. Administrative and destructive actions must be authenticated, authorized, validated, and auditable.
11. Content shown to children must come only from approved/active content.
12. The system must prefer reuse of existing safe assets before generating new assets.

---

# 3. Child Session Rules

## BR-001 — Anonymous Gameplay

Children should be able to start gameplay without creating an account in the MVP.

**Rule:**
- A session may be created without a child account.
- A generated session ID identifies the gameplay session.
- No name, email, phone number, or other unnecessary PII is required.

## BR-002 — Session Isolation

A gameplay session must have its own state.

**Rule:**
- Session events must reference the session ID.
- Game progress from one session must not alter another session.
- Client-provided session identifiers must be validated.

## BR-003 — Session Expiration

Inactive sessions may expire after a configurable period.

**Rule:**
- Expired sessions must not be treated as active.
- Historical events may remain available for aggregate analytics according to retention policy.

## BR-004 — No Sensitive Child Profile

Learnzzy must not create detailed behavioral profiles of individual children unless a future product requirement explicitly requires it and appropriate safeguards are implemented.

---

# 4. Game Selection Rules

## BR-010 — Active Games Only

Only games marked as active/published may appear on the child home screen.

## BR-011 — Game Availability

A game may be unavailable when:
- it is disabled by an administrator;
- required content is unavailable;
- a critical game configuration is invalid;
- a system-level safety or operational control disables it.

## BR-012 — Game Configuration

Game configuration must be server-controlled.

Examples:
- enabled/disabled state;
- difficulty levels;
- number of rounds;
- allowed content types;
- asset requirements;
- reward configuration.

The client must not be trusted to override protected configuration.

---

# 5. General Gameplay Rules

## BR-020 — One Primary Task Per Screen

A gameplay screen should present one primary learning task.

## BR-021 — Deterministic Game State

Game state must be deterministic from validated game content and the current state.

The LLM must not determine:
- whether an answer is mathematically correct;
- the score;
- whether a round is complete;
- whether a reward is earned.

## BR-022 — Client Is Not Authoritative

The server must not blindly trust client-submitted:
- score;
- correctness;
- difficulty;
- reward;
- completion state.

The server may validate event consistency and derive authoritative metrics where required.

## BR-023 — Touch-Friendly Interaction

Interactive game targets must be sufficiently large for young children and touch devices.

## BR-024 — Positive Failure Handling

An incorrect answer must:
- provide gentle feedback;
- allow the child to continue;
- avoid negative or shaming language;
- avoid unnecessary loss mechanics.

## BR-025 — Retry

A child may retry an activity unless the specific game rule intentionally limits retries.

Retry behavior must not corrupt the original event history.

## BR-026 — Completion

A game is completed only when its configured completion criteria are satisfied.

---

# 6. Addition Game Rules

## BR-030 — Addition Question Generation

Addition questions must satisfy configured difficulty rules.

Example:

`3 apples + 2 apples = 5 apples`

The answer must be calculated deterministically.

## BR-031 — Addition Correctness

For operands `a` and `b`:

`correctAnswer = a + b`

The displayed answer options must include exactly one correct answer.

## BR-032 — Visual Quantity Consistency

If the question uses visual objects, the number of objects must match the operands.

Example:
- first group = 4 objects;
- second group = 3 objects;
- answer = 7.

The visual representation must never contradict the mathematical problem.

## BR-033 — Addition Answer Options

Answer choices must be generated deterministically.

Recommended rules:
- one correct answer;
- plausible incorrect answers;
- no duplicate choices;
- configurable number of choices;
- answer values remain within the configured difficulty range.

---

# 7. Subtraction Game Rules

## BR-040 — Non-Negative Subtraction

For standard subtraction:

`a - b >= 0`

unless a future game mode explicitly supports negative numbers.

## BR-041 — Subtraction Correctness

`correctAnswer = a - b`

The answer must be calculated by deterministic code.

## BR-042 — Visual Consistency

If `b` objects disappear, exactly `b` objects must be removed from the original quantity.

Example:

`5 birds - 2 birds = 3 birds`

The visual state must show three remaining birds.

## BR-043 — Answer Options

Exactly one option must be mathematically correct.

---

# 8. Clean Up Game Rules

## BR-050 — Objective

The child identifies and cleans target objects/details in a scene.

## BR-051 — Target Definition

Every scene must contain:
- defined cleanable targets;
- target identifiers;
- valid hit/interact areas;
- completion criteria.

## BR-052 — Target Completion

A target is complete only after the required interaction is successfully performed.

## BR-053 — No Accidental Completion

Background decorations must not count as targets.

## BR-054 — Scene Completion

A scene is complete when all required targets are cleaned.

## BR-055 — Accessibility

Important targets must remain distinguishable without relying only on subtle color differences.

---

# 9. Picture Puzzle Rules

## BR-060 — Puzzle Definition

Every puzzle must contain:
- a source image;
- a configured grid/piece count;
- unique piece identifiers;
- a valid final arrangement.

## BR-061 — Piece Validation

Every puzzle piece must map to exactly one location in the final image.

## BR-062 — Completion

A puzzle is complete only when all required pieces are correctly positioned.

## BR-063 — Invalid Puzzle Protection

A puzzle must not be published if:
- pieces are missing;
- duplicate piece IDs exist;
- the final image cannot be reconstructed;
- the source asset is invalid.

## BR-064 — Age-Appropriate Complexity

Piece count must remain within the configured age/difficulty range.

---

# 10. Shadow Sketch / Tracing Rules

## BR-070 — Traceable Asset

A tracing activity must contain a valid outline/shadow representation.

## BR-071 — Drawing Validation

Drawing completion may use deterministic geometry-based checks such as:
- minimum coverage;
- proximity to expected path;
- stroke count;
- minimum drawing duration;
- configurable tolerance.

Exact validation thresholds must be configurable.

## BR-072 — No Perfect Drawing Requirement

A child should not need pixel-perfect tracing to succeed.

## BR-073 — Positive Feedback

Partial progress may be recognized where appropriate.

---

# 11. Difficulty Rules

## BR-080 — Difficulty Is Configurable

Difficulty must be represented as structured configuration, not hard-coded throughout game components.

Possible dimensions:
- operand range;
- number of answer choices;
- visual complexity;
- number of objects;
- puzzle piece count;
- tracing complexity;
- number of targets;
- hint availability.

## BR-081 — Difficulty Levels

The initial levels may be:

- Easy
- Medium
- Hard

The exact numeric boundaries must live in configuration.

## BR-082 — Difficulty Must Be Validated

A generated question must satisfy its configured difficulty rules before becoming eligible for gameplay.

## BR-083 — Difficulty Agent

The Difficulty Agent may recommend changes based on aggregate performance.

It must not silently make high-impact learning-rule changes without the configured approval process.

## BR-084 — Avoid Over-Adaptation

Difficulty should not change aggressively from a small number of interactions.

Use aggregate evidence and configurable thresholds.

---

# 12. Content Pool Rules

## BR-090 — Approved Content Only

Child gameplay may consume only content with an approved/active status.

## BR-091 — Content Pool Availability

Each game/difficulty combination should maintain a minimum content pool where practical.

## BR-092 — Low Pool Threshold

When a pool falls below its configured threshold, the backend may create a background refill task.

The child must not wait for content generation.

## BR-093 — Content Reuse

Existing validated content should be reused when appropriate to reduce:
- latency;
- AI cost;
- asset generation;
- operational complexity.

## BR-094 — Duplicate Prevention

Content generation should attempt to avoid exact duplicates and excessive near-duplicates within the configured pool.

---

# 13. AI-Generated Content Rules

## BR-100 — AI Is Not Authoritative

AI output is a proposal until validated.

## BR-101 — Structured Output

AI-generated content must conform to the expected schema.

Invalid schema output is rejected.

## BR-102 — Deterministic Validation

After schema validation, content must pass deterministic business validation.

Examples:
- arithmetic answer equals calculation;
- required fields exist;
- difficulty limits are respected;
- asset references exist;
- answer options contain exactly one correct answer;
- puzzle pieces are consistent.

## BR-103 — Safety Validation

AI-generated child-facing content must pass safety/quality checks before publication.

## BR-104 — No Runtime LLM Dependency

Gameplay should not require an LLM call for every:
- question;
- answer;
- click;
- animation;
- score calculation.

## BR-105 — Server-Side AI Keys

AI provider credentials must never be exposed to the browser.

## BR-106 — Model Routing

Simple generation/classification tasks may use a low-cost model such as GPT-5 nano.

More complex tasks may use GPT-5 mini.

The model must be configurable rather than hard-coded into business logic.

## BR-107 — AI Cost Controls

AI operations should have configurable:
- token/request limits;
- retry limits;
- timeout limits;
- daily/monthly budgets;
- task-specific budgets.

---

# 14. Asset Rules

## BR-110 — Asset Reuse First

Before generating a new image, the Asset Agent should search for a suitable approved existing asset.

## BR-111 — Child-Safe Assets

Child-facing assets must be:
- age appropriate;
- free from unsafe visual content;
- free from unintended text/watermarks;
- technically valid;
- consistent with the Learnzzy visual style.

## BR-112 — Asset Validation

Assets must be validated for:
- file type;
- dimensions;
- size;
- integrity;
- metadata;
- content safety where applicable.

## BR-113 — Asset Versioning

Replacing an asset must not silently destroy the previous version.

Asset versions should remain auditable according to retention policy.

---

# 15. Rewards and Progress

## BR-120 — Reward Philosophy

Rewards exist to encourage participation and learning, not competition.

## BR-121 — Correct Answer Reward

A correct answer may earn:
- a star;
- animation;
- positive feedback;
- progress.

Reward values must be configured.

## BR-122 — Incorrect Answer

Incorrect answers should not create harsh penalties.

Recommended behavior:
- gentle feedback;
- optional hint;
- retry;
- continue.

## BR-123 — Completion Reward

Completing a game may trigger a celebration and configurable reward.

## BR-124 — No Pay-to-Progress

Learning progress must never depend on payment, advertisements, or purchases in the MVP.

---

# 16. Hints

## BR-130 — Hint Availability

Hints may be available depending on game and difficulty configuration.

## BR-131 — Hint Must Not Reveal Unnecessarily

A hint should help the child reason toward the answer rather than simply reveal it, unless the activity intentionally uses a reveal mechanic.

## BR-132 — Hint Tracking

Hint usage should be recorded as an event for aggregate learning analytics.

---

# 17. Event and Analytics Rules

## BR-140 — Event Logging

Important gameplay actions should generate structured events.

Examples:
- session started;
- game started;
- question shown;
- answer submitted;
- answer correct;
- answer incorrect;
- retry;
- hint used;
- game completed;
- puzzle piece placed;
- puzzle completed;
- drawing started;
- drawing completed.

## BR-141 — Event Immutability

Gameplay events should be treated as append-oriented records.

Corrections should use additional events or controlled administrative mechanisms rather than silently rewriting historical events.

## BR-142 — Aggregate Analytics

Analytics should focus on product and learning behavior such as:
- completion rate;
- success rate;
- retry rate;
- average attempts;
- hint usage;
- game popularity;
- content performance;
- difficulty performance.

## BR-143 — Minimize PII

Analytics must not collect unnecessary personally identifiable information.

## BR-144 — Client Event Validation

Events received from the client must be schema validated and rate limited.

---

# 18. AI Agent Workforce Rules

## BR-150 — Agent Roles

The initial agent workforce consists of:

1. Content Agent
2. Quality & Safety Agent
3. Asset Agent
4. Analytics Agent
5. Difficulty Agent

## BR-151 — Agent Boundaries

Each agent must have a defined responsibility and minimum required permissions.

Agents should not receive broad unrestricted access to the system.

## BR-152 — Background Execution

Long-running agent operations must execute asynchronously through background jobs.

Recommended queue infrastructure:
- BullMQ;
- Redis.

## BR-153 — Agent Auditability

Every agent task should record:
- task type;
- agent;
- input/reference;
- status;
- timestamps;
- output summary;
- validation result;
- errors;
- cost/usage where available.

## BR-154 — No Hidden Consequential Actions

Agents must not silently:
- delete large amounts of content;
- disable critical systems;
- change major learning rules;
- publish unvalidated content.

Such actions require configured authorization/approval.

## BR-155 — No Chain-of-Thought Exposure

Agent logs and admin UI must expose useful execution summaries, decisions, validation results, and errors—not private chain-of-thought.

---

# 19. Admin Rules

## BR-160 — Admin Authentication

All protected admin operations require authentication.

## BR-161 — Authorization

Authentication alone is not sufficient for sensitive operations.

Authorization must be checked per action.

## BR-162 — Admin Command Center

Natural-language admin commands may be converted into structured actions.

Example:

> "Refill the addition easy-content pool."

The system should translate this into a structured task such as:

`content_pool_refill(game=addition, difficulty=easy)`

## BR-163 — Command Validation

Natural-language commands must be:
1. interpreted;
2. converted into structured intent;
3. validated;
4. authorized;
5. executed;
6. audited.

## BR-164 — Confirmation

Confirmation should be required for consequential actions such as:
- bulk deletion;
- disabling production systems;
- publishing large content batches;
- major difficulty changes;
- destructive asset changes.

## BR-165 — Admin Audit Log

Sensitive admin actions must record:
- admin identity;
- action;
- target;
- timestamp;
- result;
- request/task ID.

---

# 20. Content Lifecycle Rules

Recommended status lifecycle:

`draft -> validating -> approved -> active -> disabled`

Alternative rejection path:

`draft -> validating -> rejected`

## BR-170 — Draft

Draft content is not visible to children.

## BR-171 — Approved

Approved content has passed required validation but may not yet be active.

## BR-172 — Active

Only active content is eligible for normal gameplay.

## BR-173 — Rejected

Rejected content must not enter the child-facing content pool.

## BR-174 — Disabled

Previously active content can be disabled without deleting historical references.

## BR-175 — Versioning

Changes to important content should create a new version rather than silently overwriting the historical version.

---

# 21. Safety and Quality Rules

## BR-180 — Child-Safe Language

Child-facing text must avoid:
- insults;
- shame;
- frightening language;
- unnecessary violence;
- adult themes;
- manipulative language.

## BR-181 — Visual Safety

Generated or uploaded child-facing visuals must pass the configured safety review process.

## BR-182 — No Public Child Communication

MVP must not provide:
- public child profiles;
- child-to-child chat;
- public comments;
- open social feeds.

## BR-183 — No Gameplay Advertising

Ads must not interrupt core learning gameplay in the MVP.

---

# 22. Privacy and Data Retention

## BR-190 — Data Minimization

Collect only data required to:
- run gameplay;
- improve the product;
- operate the platform;
- secure the system.

## BR-191 — Session Data

Session identifiers must not contain direct personal information.

## BR-192 — Retention

Retention periods must be configurable by data category.

## BR-193 — Deletion

Where deletion is required by policy or applicable law, the system must support controlled deletion/anonymization without breaking required operational integrity.

---

# 23. Performance Rules

## BR-200 — Gameplay Latency

Gameplay interactions must remain responsive and must not wait on:
- AI generation;
- admin agents;
- analytics processing;
- large database operations.

## BR-201 — Content Prefetch

The client should receive enough validated content to continue gameplay without blocking on generation.

## BR-202 — Asset Delivery

Child-facing assets should be served through CDN/object storage infrastructure where appropriate.

## BR-203 — Background Processing

Analytics, content generation, asset generation, and agent operations should be asynchronous wherever possible.

---

# 24. Offline and Synchronization Rules

## BR-210 — Offline-Friendly Gameplay

Where supported, previously downloaded game content should remain playable offline.

## BR-211 — Local Event Queue

Events generated offline may be stored locally and synchronized later.

## BR-212 — Idempotency

Event synchronization must prevent duplicate processing.

Each client-generated event should have a unique event ID.

## BR-213 — Conflict Handling

Server state remains authoritative for protected configuration and content.

---

# 25. Error Handling Rules

## BR-220 — Child-Facing Errors

Technical errors must not expose:
- stack traces;
- database errors;
- API keys;
- internal agent details.

Child-facing messaging should be simple and friendly.

## BR-221 — Graceful Degradation

If AI or an agent is unavailable:
- existing approved content continues to work;
- gameplay should continue where possible;
- background generation may retry later.

## BR-222 — No Empty Gameplay

The system should avoid starting a game when it has no valid playable content unless the game has a deterministic local fallback.

---

# 26. Database Rules

## BR-230 — MongoDB

MongoDB is the primary application database.

## BR-231 — Repository Boundary

Application services should access MongoDB through a repository/data-access boundary rather than scattering database calls across UI/game code.

## BR-232 — Validation Before Persistence

Data must be validated before persistence.

## BR-233 — Indexing

Frequently queried collections must have appropriate indexes for:
- game and difficulty;
- content status;
- session and event time;
- agent task status;
- agent execution time;
- analytics queries.

## BR-234 — Historical Integrity

Historical gameplay and agent records should not be silently modified without an auditable reason.

---

# 27. Security Rules

## BR-240 — Secrets

Secrets must be stored server-side using secure environment/secret management.

## BR-241 — Least Privilege

Services, agents, workers, and database users receive only the permissions they need.

## BR-242 — Rate Limiting

Public APIs and expensive admin/AI endpoints must be rate limited.

## BR-243 — Input Validation

All external input must be schema validated.

## BR-244 — Output Validation

AI output must be validated before use.

## BR-245 — Prompt Protection

Internal prompts, system instructions, secrets, and private operational details must not be exposed through public APIs.

---

# 28. Observability Rules

## BR-250 — Health Checks

The system should expose health checks for critical infrastructure.

## BR-251 — Structured Logging

Backend and worker logs should be structured and searchable.

## BR-252 — Error Monitoring

Production exceptions should be captured by an error monitoring platform such as Sentry.

## BR-253 — Request Correlation

Important API requests, jobs, and agent runs should have correlation/request IDs.

## BR-254 — AI Usage Tracking

AI calls should record measurable usage such as:
- model;
- task type;
- request count;
- token usage where available;
- estimated cost;
- success/failure.

---

# 29. Content Generation Decision Rules

When new content is requested:

1. Check existing approved content.
2. Check pool capacity.
3. Reuse valid content when appropriate.
4. If generation is required, create a background task.
5. Generate structured content.
6. Validate schema.
7. Validate deterministic business rules.
8. Run quality/safety validation.
9. Store as a new content version.
10. Approve/activate according to workflow.
11. Add to the eligible pool.
12. Record the operation and AI usage.

---

# 30. Agent Failure Rules

If an agent fails:

1. Do not publish partial or invalid output.
2. Record the failure.
3. Retry only within configured retry limits.
4. Use exponential backoff where appropriate.
5. After retry exhaustion, mark the task failed.
6. Existing approved content must remain available.
7. Alert administrators when the failure affects a critical pool or system function.

---

# 31. Configuration Rules

The following should be configurable rather than hard-coded:

- game enablement;
- difficulty ranges;
- rounds per game;
- answer choice count;
- reward values;
- hint behavior;
- content pool thresholds;
- AI model selection;
- AI budgets;
- retry limits;
- event retention;
- session expiration;
- asset limits;
- agent permissions;
- approval requirements;
- feature flags.

Configuration changes must be validated before activation.

---

# 32. MVP Business Rules

The MVP must enforce the following minimum rules:

- Five core games are available.
- No mandatory child login.
- MongoDB is the primary database.
- Gameplay does not depend on live LLM calls.
- Arithmetic is deterministic.
- Only validated/approved content is playable.
- AI content passes schema + deterministic + safety validation.
- AI keys remain server-side.
- Long-running AI work uses background jobs.
- Admin access is protected.
- Destructive/consequential admin actions require authorization and, where configured, confirmation.
- Core gameplay events are recorded.
- Child-facing UX remains positive and low-text.
- Learning plans are advisory-validated and never expose chain-of-thought.
- Voice and visual themes never block or alter gameplay correctness.
- No public child chat/profile/social features.
- No intrusive ads during gameplay.
- Existing gameplay continues if AI services are unavailable.

---

# 33. Non-Negotiable Guardrails

The following are product-level hard rules unless explicitly changed by a future approved specification:

1. **Never use an LLM as the arithmetic engine.**
2. **Never trust the browser as the source of truth for protected scoring or progression.**
3. **Never expose AI credentials to the child-facing client.**
4. **Never publish unvalidated AI-generated child content.**
5. **Never make gameplay wait for an AI generation request.**
6. **Never allow an agent unrestricted destructive access.**
7. **Never expose private chain-of-thought through the admin interface or APIs.**
8. **Never collect unnecessary child PII.**
9. **Never use harsh failure mechanics to punish learning mistakes.**
10. **Never allow an invalid content/asset record to enter the active gameplay pool.**
11. **Never make gameplay wait for voice/TTS generation or live translation.**

---

# 34. Rule Change Governance

Changes to business rules should be treated as product/engineering changes.

For each rule change:

1. Identify the affected rule ID(s).
2. Document the reason.
3. Assess impact on gameplay, content, analytics, AI agents, and data.
4. Update validation logic/configuration.
5. Update automated tests.
6. Update this document.
7. Review and approve according to project governance.
8. Deploy through the normal release process.

Business rules must not exist only inside prompts or UI code.

---

# 36. Academic Engine Rules

## BR-260 — Learn Before Test

New concepts enter through LEARN (show + voice + fact) before PRACTICE,
PLAY, RECALL, REVIEW, and MASTER. A concept must never debut as a test
question.

## BR-261 — No Stage Skips

Learning stages advance at most one step per successful activity
(`nextStage`). Failure holds or returns to practice; `master` failure
returns to review.

## BR-262 — No Multi-Level Jumps

Complexity changes at most ±1 per decision and only on sustained evidence
(3+ attempts at 85%+ with no hints to increase). A single answer never
promotes, demotes, or masters a concept.

## BR-263 — Review Before Novelty

Review-due and weak concepts outrank unseen concepts. Interests boost
priority but never override review or need.

## BR-264 — Validated Plans Only

Only plans passing `validateAcademicPlan` (schema, age, safety, no
chain-of-thought markers, bounded difficulty/complexity) enter gameplay,
parent views, or admin views. Advisories that fail validation are dropped
and the deterministic plan stands.

## BR-265 — Voice Never Blocks Gameplay

Voice assets resolve from cache; misses fall back to prepared text with
device speech. No live TTS/translation call may sit in the gameplay path.

## BR-266 — Theme Never Changes Correctness

Visual theme selection must not alter any answer. Math renderers prove
`answer == a + b` under every theme.

---

# 37. Implementation Principle

The implementation should follow this hierarchy:

**Business Rules → Schemas → Deterministic Services → APIs/Workers → UI/Game Modules**

AI agents operate within these rules; they do not replace them.

The authoritative source of correctness is deterministic application logic backed by validated configuration and data.
