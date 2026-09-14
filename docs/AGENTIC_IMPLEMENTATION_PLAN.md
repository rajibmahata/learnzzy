# Learnzzy — Agentic Implementation Plan

## 1. Objective

Build an agentic workforce that autonomously manages the Learnzzy learning-content lifecycle.

The agents should operate primarily in the background.

The child-facing game must remain fast and deterministic.

### Core principle

> Agents create and improve the learning world; the game engine delivers it instantly.

## 2. Initial Agent Workforce

Start with five agents.

```text
                    AGENT MANAGER
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
   Content Agent    Asset Agent     Quality Agent
        |                |                |
        +----------------+----------------+
                         |
                  Difficulty Agent
                         |
                  Analytics Agent
```

## 3. Agent 1 — Content Agent

### Responsibilities

- Generate addition activities.
- Generate subtraction activities.
- Generate cleaning scenes.
- Generate puzzle configurations.
- Generate sketch definitions.
- Create themes.
- Create variations.
- Replenish content pools.

### Trigger

Content pool falls below threshold.

Example:

```text
Addition pool = 18
Threshold = 30
```

System creates a content-generation task.

### Workflow

```text
Detect Low Pool
      |
      v
Create Agent Task
      |
      v
Generate Batch
      |
      v
Schema Validation
      |
      v
Mathematical Validation
      |
      v
Quality Agent
      |
      v
Store Approved Items
```

## 4. Agent 2 — Asset Agent

### Responsibilities

- Identify required assets.
- Create image-generation specifications.
- Request image generation.
- Deduplicate assets.
- Tag assets.
- Optimize assets.
- Associate assets with games.

### Workflow

```text
Content Requires Asset
        |
        v
Check Existing Asset Library
        |
   +----+----+
   |         |
 Found      Missing
   |         |
   v         v
Reuse     Generate
             |
             v
         Validate
             |
             v
         Optimize
             |
             v
        Store + CDN
```

Always check for reusable assets before generating a new one.

## 5. Agent 3 — Quality & Safety Agent

This agent is a mandatory gate before content reaches production.

### Responsibilities

- Validate educational appropriateness.
- Validate age suitability.
- Check generated text.
- Check image metadata.
- Check content structure.
- Reject invalid content.
- Detect duplicate or suspicious content.

### Important rule

AI output is not automatically trusted.

Use deterministic validation first.

For mathematics:

```text
Generated:
3 + 2 = 6

Application:
3 + 2 = 5

Result:
REJECT
```

## 6. Agent 4 — Difficulty Agent

### Responsibilities

- Analyse aggregated game performance.
- Identify difficult activities.
- Recommend level adjustments.
- Recommend reinforcement.
- Suggest new difficulty configurations.

Example:

```text
Observed:
High accuracy
Fast responses
Level 1 addition

Recommendation:
Increase proportion of Level 2 activities.
```

The agent should recommend rather than automatically make major configuration changes.

## 7. Agent 5 — Analytics/Learning Agent

### Responsibilities

- Analyse aggregated interaction data.
- Identify game trends.
- Identify content with poor completion.
- Identify commonly missed concepts.
- Recommend content improvements.

Example:

```text
Puzzle completion rate decreased.

Possible findings:
- Level 3 puzzle complexity is too high.
- Pieces may be too small on mobile.
- Average completion time increased.
```

The output should be an operational recommendation, not a child diagnosis.

## 8. Agent Manager

Create a central service that controls agent execution.

Conceptually:

```text
AgentManager
├── registerAgent()
├── createTask()
├── scheduleTask()
├── executeTask()
├── retryTask()
├── cancelTask()
├── recordRun()
└── getStatus()
```

Every agent run must have:

- task ID
- agent ID
- status
- startedAt
- completedAt
- input summary
- output summary
- items processed
- token usage where available
- estimated cost
- error information

## 9. Agent States

Use:

```text
PENDING
RUNNING
WAITING_APPROVAL
COMPLETED
FAILED
CANCELLED
```

Do not create hidden or untracked agent execution.

## 10. Autonomous vs Approval-Based Actions

### Safe autonomous actions

Agents can automatically:

- Generate content.
- Validate content.
- Tag assets.
- Refill content pools.
- Analyse aggregated analytics.
- Create recommendations.

### Require approval

Require admin confirmation for:

- Deleting production content.
- Changing major learning rules.
- Changing AI provider/model.
- Changing security configuration.
- Publishing content that failed automated checks.
- Large-scale destructive operations.

Use:

```text
PROPOSE
   ↓
EXPLAIN
   ↓
ADMIN APPROVES
   ↓
EXECUTE
```

## 11. Agent Scheduling

Use BullMQ/Redis.

Example jobs:

```text
content.low-pool-check
content.generate
content.validate
assets.generate
assets.validate
analytics.daily-analysis
difficulty.recommendation
system.health-check
```

Avoid excessive schedules.

Use event-driven triggers where possible.

## 12. Content Pool Automation

Each game has configuration:

```json
{
  "game": "addition",
  "minimumPool": 30,
  "targetPool": 100,
  "batchSize": 50
}
```

Workflow:

```text
Pool Check
   |
   +-- pool >= minimum
   |       |
   |       +--> Do nothing
   |
   +-- pool < minimum
           |
           v
      Generate batch
           |
           v
       Validate
           |
           v
        Approve
           |
           v
       Add to pool
```

## 13. Agent Memory

Do not create a giant conversational memory system.

Agents should use structured state:

```text
agent configuration
task history
recent failures
content statistics
system configuration
approved rules
```

Store important decisions in versioned records.

Do not rely on an LLM remembering previous conversations.

## 14. Agent Context Strategy

Pass only the context required for the task.

Bad:

```text
Send entire MongoDB database/project history to model.
```

Good:

```text
Game: addition
Difficulty: 1
Target count: 50
Allowed range: 1-10
Themes: jungle, ocean
Existing object types: apple, banana, fish
```

This reduces tokens and improves reliability.

## 15. Structured AI Output

Require strict JSON/schema output.

Example:

```json
{
  "game": "addition",
  "difficulty": 1,
  "theme": "ocean",
  "a": 3,
  "b": 2,
  "objects": ["fish"],
  "answer": 5,
  "answers": [3, 4, 5, 6]
}
```

Then validate using application code.

Never parse free-form prose as production game configuration.

## 16. Agent Retry Strategy

For transient failures:

```text
Attempt 1
   ↓
wait
   ↓
Attempt 2
   ↓
wait
   ↓
Attempt 3
   ↓
FAILED
```

Use exponential backoff.

Do not endlessly retry failed AI requests.

## 17. Agent Cost Controls

Track:

- model
- request count
- input tokens
- output tokens
- estimated cost
- task type

Configuration:

```text
MAX_DAILY_AI_REQUESTS
MAX_BATCH_SIZE
MAX_AGENT_RETRIES
MAX_DAILY_COST
```

If limits are reached:

```text
Pause generation
+
Notify admin
```

Gameplay must continue using existing content.

## 18. Agent Observability

Admin should see:

```text
CONTENT AGENT
Status: Running

Current task:
Generate 50 addition activities

Generated: 50
Approved: 47
Rejected: 3

Tokens:
...

Estimated cost:
...

Last run:
...
```

Do not expose private chain-of-thought.

Show concise operational summaries.

## 19. Agent Command Center

Create an admin interface where the administrator can issue high-level commands.

Examples:

### Command

> Create 50 Level 1 addition activities.

System:

```text
Content Agent
Generating 50...

Quality Agent
Validating...

Result:
47 approved
3 rejected
```

### Command

> Make subtraction easier.

System:

```text
Difficulty Agent recommendation:

Reduce Level 2 number range from 1–20
to 1–10.

Reason:
Current accuracy is below target.

[Approve] [Reject]
```

### Command

> Why are puzzle games performing poorly?

System:

```text
Analytics Agent

Finding:
Level 3 puzzles have significantly higher
completion time on touch devices.

Recommendation:
Increase piece size and reduce initial
Level 3 complexity.

[Review]
```

## 20. Event-Driven Agentic Flow

Example:

```text
Child Gameplay
      |
      v
Learning Events
      |
      v
Event Aggregation
      |
      v
Analytics Store
      |
      v
Threshold/Event Detected
      |
      v
Agent Task
      |
      v
Agent Worker
      |
      +----> AI
      |
      +----> MongoDB
      |
      v
Recommendation / Content
      |
      v
Admin or Automatic Safe Action
```

## 21. Agent-to-Agent Communication

Do not create uncontrolled direct agent conversations.

Prefer shared structured tasks:

```text
Content Agent
     |
     v
content.validation task
     |
     v
Quality Agent
```

and:

```text
Analytics Agent
     |
     v
difficulty.recommendation task
     |
     v
Difficulty Agent
```

This makes execution observable and testable.

## 22. Implementation Phases

### Phase A — Agent Foundation

Build:

- Agent interface
- Agent registry
- Agent tasks
- Agent runs
- Queue integration
- Logging
- Retry handling
- Cost tracking

### Phase B — Content Agent

Implement:

- Addition generator
- Subtraction generator
- Cleaning generator
- Puzzle generator
- Sketch generator

### Phase C — Quality Agent

Implement:

- Schema validation
- Arithmetic validation
- Content checks
- Safety rules
- Duplicate checks

### Phase D — Asset Agent

Implement:

- Asset lookup
- Generation requests
- Asset metadata
- Deduplication
- Optimization
- Storage

### Phase E — Analytics Agent

Implement:

- Aggregation
- Trend detection
- Game analysis
- Content performance

### Phase F — Difficulty Agent

Implement:

- Difficulty recommendations
- Rule management
- Approval workflow

### Phase G — Admin Command Center

Implement:

- Natural-language command input
- Agent routing
- Task status
- Approval UI
- Operational summaries

## 23. MVP Agent Priority

Do NOT build all agents simultaneously.

Recommended order:

```text
1. Agent Infrastructure
        ↓
2. Content Agent
        ↓
3. Quality Agent
        ↓
4. Asset Agent
        ↓
5. Analytics Agent
        ↓
6. Difficulty Agent
        ↓
7. Agent Command Center
```

## 24. Critical Rule

The agentic system must never become a dependency for basic gameplay.

If every AI service goes offline:

```text
AI OFFLINE
   |
   v
Existing content pool
   |
   v
Games continue working
```

The platform should degrade gracefully.

## 25. Definition of Done

The agentic implementation is complete when:

- Agents execute through background jobs.
- Content pools replenish automatically.
- AI output is schema validated.
- Arithmetic is deterministically validated.
- Invalid content is rejected.
- Assets are reused before regeneration.
- Agent runs are observable.
- Failures retry safely.
- Token/cost usage is tracked.
- Admin can inspect agent activity.
- Consequential actions require approval.
- Gameplay remains functional without AI availability.
- Adding a new game does not require rewriting the agent framework.
