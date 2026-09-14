# Learnzzy — Learning Template

**Document:** Reusable Learning Activity Template  
**Version:** 1.0  
**Status:** Active / Implementation Reference  
**Last Updated:** 2026-09-13

---

## 1. Purpose

This template defines the common structure for a Learnzzy learning activity.

It is designed so that:

- deterministic game logic remains authoritative;
- AI can generate structured content safely;
- every activity has a clear learning objective;
- content can be validated before activation;
- the same framework works across all five MVP games;
- future games can use the same content contract.

This is a **template**, not a game-specific schema. Game-specific Zod schemas remain authoritative for actual persisted content.

---

# 2. Learning Activity Model

Every activity should conceptually contain:

```text
LearningActivity
├── identity
├── game
├── learningObjective
├── difficulty
├── content
├── interaction
├── validation
├── reward
├── accessibility
├── assetReferences
└── metadata
```

---

# 3. Identity

Required fields:

```text
activityId
gameId
version
status
createdAt
updatedAt
```

Recommended:

```text
source
generator
theme
locale
```

Example:

```json
{
  "activityId": "add-001",
  "gameId": "addition",
  "version": 1,
  "status": "active"
}
```

---

# 4. Learning Objective

Every activity must answer:

> What should the child practice?

Example:

```text
Objective:
Recognize that combining two groups produces a larger quantity.
```

Keep objectives simple and measurable.

Possible objective types:

```text
COUNTING
ADDITION
SUBTRACTION
VISUAL_RECOGNITION
CLASSIFICATION
SPATIAL_REASONING
FINE_MOTOR
TRACING
PATTERN_RECOGNITION
```

---

# 5. Difficulty

Difficulty must be configurable.

Template:

```json
{
  "level": 1,
  "range": {
    "min": 1,
    "max": 5
  }
}
```

Difficulty should control meaningful learning complexity, not merely animation speed.

Examples:

- Addition number range.
- Subtraction quantity range.
- Puzzle piece count.
- Number of cleaning targets.
- Sketch complexity.

The Difficulty Agent may recommend changes, but deterministic rules/configuration remain authoritative.

---

# 6. Activity Content

The content payload is game-specific.

Examples:

## Addition

```json
{
  "type": "addition",
  "leftQuantity": 3,
  "rightQuantity": 2,
  "correctAnswer": 5,
  "objects": {
    "left": "apple",
    "right": "apple"
  }
}
```

## Subtraction

```json
{
  "type": "subtraction",
  "startQuantity": 5,
  "removedQuantity": 2,
  "correctAnswer": 3,
  "object": "bird"
}
```

## Clean Up

```json
{
  "theme": "bedroom",
  "targets": [
    "sock",
    "toy"
  ],
  "nonTargets": [
    "bed",
    "lamp"
  ]
}
```

## Puzzle

```json
{
  "pieceCount": 6,
  "imageAssetId": "asset-123"
}
```

## Sketch

```json
{
  "targetAssetId": "asset-456",
  "guidePath": "..."
}
```

---

# 7. Deterministic Correctness

Every activity must have a deterministic correctness rule.

Examples:

```text
Addition:
correctAnswer = leftQuantity + rightQuantity

Subtraction:
correctAnswer = startQuantity - removedQuantity

Puzzle:
correct placement matches expected piece position

Clean Up:
completion occurs when all target objects are collected

Sketch:
completion/evaluation uses deterministic geometry thresholds
```

Never use an LLM to determine mathematical correctness or core game state.

---

# 8. Interaction

Each activity should define:

```text
interactionType
inputMethods
primaryAction
successAction
retryAction
```

Supported input methods:

```text
touch
mouse
pointer
stylus
keyboard where appropriate
```

Child interaction should remain simple.

---

# 9. Feedback

Correct:

```text
Positive feedback
Animation
Reward
Progress
```

Incorrect:

```text
Gentle feedback
Optional hint
Retry
Continue
```

Avoid:

- shame;
- harsh failure;
- distracting error effects;
- unnecessary text.

---

# 10. Hint Template

A hint should help reasoning.

Example:

```json
{
  "enabled": true,
  "type": "visual",
  "message": "Count both groups together."
}
```

A hint should not unnecessarily reveal the answer.

Hint usage can be recorded as an aggregate event.

---

# 11. Reward Template

Possible reward configuration:

```json
{
  "stars": 1,
  "celebration": "standard",
  "progress": true
}
```

Rewards must remain educational and non-gambling-like.

---

# 12. Asset Template

Every asset reference should identify:

```text
assetId
assetVersion
type
theme
status
```

Assets must be:

- child safe;
- technically valid;
- optimized;
- free from unintended text/watermarks;
- visually consistent.

Reuse existing approved assets before generating new ones.

---

# 13. Accessibility

Every learning activity should consider:

- large touch targets;
- readable contrast;
- simple language;
- reduced-motion behavior;
- touch/mouse/pointer support where applicable;
- safe-area layout;
- non-color-only meaning;
- clear success/failure states.

---

# 14. AI Generation Contract

AI may produce candidate structured content.

It must not directly publish it.

Required pipeline:

```text
Prompt / Task
     ↓
AI
     ↓
Structured Output
     ↓
Zod Schema
     ↓
Deterministic Rules
     ↓
Quality & Safety
     ↓
Approval if required
     ↓
Active Content
```

AI-generated fields should be treated as untrusted input.

---

# 15. Content Quality Checklist

Before activation:

```text
[ ] Learning objective is clear
[ ] Content matches game type
[ ] Difficulty is valid
[ ] Correct answer is deterministic
[ ] Visual quantities match logic
[ ] No impossible state exists
[ ] No duplicate content where uniqueness is required
[ ] Assets exist
[ ] Assets are valid
[ ] Assets are child-safe
[ ] Copy is age appropriate
[ ] Interaction is understandable
[ ] Reward configuration is valid
[ ] Accessibility requirements are satisfied
```

---

# 16. Game-Specific Template

When creating a new game, define:

```text
Game ID:
Game Name:
Learning Objective:
Age/skill target:
Difficulty levels:
Content schema:
Interaction model:
Correctness rule:
Completion rule:
Retry behavior:
Hint behavior:
Reward:
Required assets:
Analytics events:
Accessibility requirements:
AI generation requirements:
Quality checks:
```

---

# 17. New Game Extension Rule

Future games should reuse this conceptual template.

Examples:

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

A new game must not bypass:

```text
Schema validation
Deterministic validation
Safety validation
Approved content lifecycle
Analytics
Accessibility
Testing
```

---

# 18. Learning Activity Acceptance Criteria

An activity is ready when:

```text
✓ Objective is explicit
✓ Content is schema-valid
✓ Business rules pass
✓ Correctness is deterministic
✓ Required assets are available
✓ Safety checks pass
✓ Child interaction is understandable
✓ Retry works
✓ Completion works
✓ Events are recorded where required
✓ Responsive behavior works
✓ Tests pass
```

---

# 19. Final Learning Principle

> **Every Learnzzy activity should teach one small thing clearly, let the child discover it through interaction, and provide positive feedback without making the child wait for AI.**
