# Learnzzy — UI Library

## 1. Purpose

This document defines the reusable UI component library for Learnzzy.

The component library must provide a consistent visual and interaction system for:

- Child gameplay
- Public website
- Admin dashboard
- Agent Command Center
- Analytics
- Content management

The library should be implemented as reusable TypeScript/React components.

---

# 2. Component Architecture

Recommended structure:

```text
src/components/
├── ui/
│   ├── Button
│   ├── IconButton
│   ├── Card
│   ├── Badge
│   ├── Dialog
│   ├── Modal
│   ├── Tooltip
│   ├── Tabs
│   ├── Input
│   ├── Select
│   ├── Progress
│   ├── Skeleton
│   └── Toast
│
├── child/
│   ├── GameCard
│   ├── GameHeader
│   ├── AnswerButton
│   ├── StarCounter
│   ├── GameProgress
│   ├── Celebration
│   ├── GameShell
│   ├── GameCanvas
│   └── HomeButton
│
├── admin/
│   ├── AdminShell
│   ├── AdminSidebar
│   ├── MetricCard
│   ├── AgentCard
│   ├── AgentStatus
│   ├── CommandCenter
│   ├── ContentCard
│   ├── ContentReview
│   ├── ActivityFeed
│   └── SystemHealth
│
└── layout/
    ├── Container
    ├── Stack
    ├── Grid
    └── PageHeader
```

---

# 3. Component Rules

Every reusable component should:

- Have a clear purpose.
- Be typed.
- Support accessibility.
- Have predictable states.
- Avoid game-specific business logic.
- Use design tokens.
- Support responsive layouts where applicable.

Do not place API calls directly inside basic UI components.

---

# 4. Button

## Variants

```text
primary
secondary
outline
ghost
danger
success
```

## Sizes

```text
sm
md
lg
xl
```

Child games should primarily use:

```text
lg
xl
```

## States

```text
default
hover
pressed
focus
disabled
loading
```

Example:

```text
┌────────────────────────┐
│      ▶ PLAY NOW        │
└────────────────────────┘
```

---

# 5. IconButton

Use for compact actions.

Examples:

```text
🏠
🔊
🔇
✕
⋮
```

Required:

- Accessible label
- Focus state
- Touch-safe hit area

---

# 6. Card

Base reusable surface.

Props conceptually:

```text
variant
padding
radius
interactive
selected
disabled
```

Interactive cards should have:

```text
hover → lift
pressed → compress
focus → visible outline
```

---

# 7. GameCard

Child-specific card.

Content:

```text
illustration
icon
name
short learning label
```

Example:

```text
┌──────────────────────┐
│                      │
│        🔢            │
│                      │
│     NUMBERS          │
│                      │
│   Learn Addition     │
└──────────────────────┘
```

GameCard should not contain complex game logic.

---

# 8. GameShell

Provides consistent game layout.

Structure:

```text
GameShell
├── GameHeader
├── GameViewport
└── OptionalGameControls
```

Responsibilities:

- Responsive sizing
- Safe area handling
- Prevent accidental page scrolling
- Home navigation
- Accessibility

---

# 9. GameHeader

Props:

```text
title
stars
soundEnabled
onHome
onSoundToggle
```

Example:

```text
┌──────────────────────────────────────┐
│ 🏠  Number Adventure      ⭐ 12  🔊 │
└──────────────────────────────────────┘
```

Keep it visually quiet.

---

# 10. GameCanvas

Container for Phaser.

Requirements:

- Responsive
- Touch-safe
- Aspect-ratio support
- Maximum width
- No unexpected overflow
- Correct resize handling

The component should not know the rules of individual games.

---

# 11. AnswerButton

Designed for child answer selection.

Example:

```text
┌──────────┐
│    5     │
└──────────┘
```

States:

```text
idle
pressed
correct
incorrect
disabled
```

Correct feedback should include motion and/or iconography.

---

# 12. StarCounter

Example:

```text
⭐ 24
```

Animation:

```text
Old value
  ↓
Star pulse
  ↓
New value
```

Do not over-animate repeated updates.

---

# 13. GameProgress

Possible variants:

```text
dots
stars
bar
step
```

For young children prefer:

```text
● ● ● ○ ○
```

or stars.

---

# 14. Celebration

Reusable success component.

Props:

```text
title
message
starsEarned
primaryAction
secondaryAction
```

Example:

```text
✨ 🎉 ✨

AWESOME!

⭐ +3

[ PLAY AGAIN ]

[ HOME ]
```

Animation should respect reduced-motion preferences.

---

# 15. Hint

A hint should be gentle.

Example:

```text
💡 Count them again!
```

Never shame the child.

---

# 16. EmptyState

Admin-oriented component.

Structure:

```text
Icon
Title
Description
Optional Action
```

Example:

```text
✨
All caught up!

There is no pending content.

[ Generate Content ]
```

---

# 17. Loading / Skeleton

Use:

- Skeletons for admin data-heavy pages.
- Small visual loaders for actions.
- Child-friendly visual transitions for gameplay.

Never expose implementation details.

---

# 18. Modal / Dialog

Use for:

- Admin confirmation
- Destructive actions
- Settings
- Pause

Do not use for every interaction.

---

# 19. Toast

Admin use cases:

```text
Content approved
Agent task queued
Settings saved
Asset rejected
```

Child gameplay should prefer in-game feedback.

---

# 20. Badge

Variants:

```text
success
warning
danger
info
neutral
```

Examples:

```text
● Healthy
● Running
● Pending
● Failed
```

Always pair colour with text/icon.

---

# 21. Tabs

Use for admin sections where multiple views belong to one resource.

Example:

```text
Overview | Runs | Configuration | History
```

Avoid tabs in child gameplay.

---

# 22. Input

Admin only by default.

States:

```text
default
focus
error
disabled
readonly
```

Labels must be explicit.

Never rely only on placeholders.

---

# 23. Select

Admin filters.

Examples:

```text
Game
Difficulty
Status
Theme
```

Use accessible native/select behaviour where possible.

---

# 24. Search

Admin content search.

Example:

```text
🔍 Search content...
```

Support:

- keyboard
- clear button
- loading state

---

# 25. FilterBar

Example:

```text
[ Game: Addition ]
[ Level: 1 ]
[ Status: Pending ]
[ Search... ]
```

On mobile, filters may collapse into a drawer.

---

# 26. MetricCard

Admin analytics.

Example:

```text
┌─────────────────────────┐
│ Games Played            │
│                         │
│ 12,480                  │
│                         │
│ ↑ 8.4%                 │
└─────────────────────────┘
```

Keep visual hierarchy simple.

---

# 27. AgentCard

Admin AI workforce.

Example:

```text
┌────────────────────────────┐
│ 🤖 Content Agent           │
│                            │
│ ● Running                 │
│                            │
│ Generate addition content  │
│                            │
│ 31 / 50                    │
│                            │
│ [ View ]                   │
└────────────────────────────┘
```

Props:

```text
agentName
status
currentTask
progress
lastRun
onView
```

---

# 28. AgentStatus

Allowed states:

```text
idle
running
waiting_approval
completed
failed
cancelled
disabled
```

Never use only colour.

---

# 29. CommandCenter

Signature Learnzzy admin component.

Structure:

```text
CommandCenter
├── CommandInput
├── ExecuteButton
├── SuggestedCommands
├── CurrentTask
└── RecentActivity
```

Example commands:

```text
Create 50 Level 1 addition activities.
Find why puzzles have low completion.
Generate more jungle assets.
Make Level 1 subtraction easier.
```

Commands must be routed through a secure backend.

The component must not directly call the AI provider.

---

# 30. CommandInput

Large admin text input.

Features:

- Auto-resize
- Keyboard shortcut
- Submit
- Disabled state while task is queued
- Clear
- Accessible label

Suggested shortcut:

```text
Ctrl/Cmd + Enter
```

---

# 31. ActivityFeed

Display operational agent activity.

Example:

```text
● Content Agent
  Generated 50 addition activities
  2 minutes ago

● Quality Agent
  Approved 47 activities
  1 minute ago
```

Avoid exposing internal reasoning.

---

# 32. ContentCard

Admin review component.

Display:

- Preview
- Game
- Difficulty
- Theme
- Validation state
- Status
- Actions

Example:

```text
┌────────────────────────────┐
│ 🍎 🍎 🍎 + 🍎              │
│                            │
│ Answer: 4                  │
│                            │
│ ✓ Math                     │
│ ✓ Schema                   │
│ ✓ Safety                   │
│                            │
│ [Approve] [Reject]         │
└────────────────────────────┘
```

---

# 33. ContentReview

Supports:

```text
approve
reject
disable
regenerate
preview
```

Destructive actions require confirmation.

---

# 34. SystemHealth

Display:

```text
API             ● Healthy
MongoDB         ● Healthy
Redis           ● Healthy
Workers         ● Healthy
AI Provider     ● Healthy
Object Storage  ● Healthy
```

Do not expose secrets.

---

# 35. ProgressBar

Admin and agent usage.

Example:

```text
████████████░░░░  75%
```

For child UI, prefer dots/stars unless a bar communicates something naturally.

---

# 36. Tooltip

Admin only unless accessibility requires it.

Do not use tooltips as the only way to explain a child interaction.

---

# 37. Responsive Components

Components must not assume desktop dimensions.

Rules:

```text
Cards → stack on mobile
Tables → transform/collapse on mobile
Sidebar → drawer on mobile
Command Center → full width on mobile
Game canvas → responsive
```

---

# 38. Component Accessibility Contract

Every interactive component must support:

```text
keyboard focus
visible focus
accessible name
disabled state
loading state where applicable
touch interaction
```

No component should communicate important information through colour alone.

---

# 39. Component Naming

Use consistent names.

Good:

```text
GameCard
GameHeader
AnswerButton
AgentCard
MetricCard
CommandCenter
ContentReview
```

Avoid:

```text
BlueBox
CoolButton
BigCard2
NewWidget
```

---

# 40. Component Composition

Prefer composition.

Example:

```text
<GameCard>
  <GameCard.Image />
  <GameCard.Icon />
  <GameCard.Title />
  <GameCard.Description />
</GameCard>
```

Use this only when it genuinely improves reuse; do not over-componentize simple elements.

---

# 41. Child vs Admin Variants

Shared components can have different presentation variants.

Example:

```text
Button
├── child
└── admin
```

But avoid duplicating components unnecessarily.

Prefer:

```text
<Button variant="child-primary" />
<Button variant="admin-primary" />
```

when the underlying interaction is the same.

---

# 42. Game-Specific Components

Game-specific components belong inside the game module.

Example:

```text
games/addition/
├── AdditionScene
├── AdditionObjects
├── AdditionAnswerButtons
└── AdditionCelebration
```

Do not put game-specific logic into generic UI components.

---

# 43. Design Token Usage

Components must consume tokens.

Good:

```text
var(--color-primary)
var(--radius-lg)
var(--space-4)
```

Avoid scattered values such as:

```text
margin: 17px
border-radius: 23px
```

unless there is a documented reason.

---

# 44. Testing the Component Library

Every important component should have:

- visual test
- interaction test
- accessibility test
- responsive test where relevant

Priority components:

```text
Button
GameCard
AnswerButton
GameHeader
GameShell
Celebration
CommandCenter
AgentCard
ContentReview
MetricCard
```

---

# 45. Storybook / Component Preview

If practical, maintain a component preview environment.

Organize stories:

```text
UI
├── Buttons
├── Cards
├── Forms
├── Feedback
│
Child
├── GameCard
├── GameHeader
├── AnswerButton
├── Celebration
│
Admin
├── AgentCard
├── CommandCenter
├── MetricCard
└── ContentReview
```

This is optional for the MVP but recommended as the component library grows.

---

# 46. Final Component Rule

Before creating a new component, ask:

1. Does an existing component already solve this?
2. Can the existing component accept a variant?
3. Is the new component reusable?
4. Does it belong to UI, child, admin, or a specific game?
5. Does it need its own tests?

Keep the library small and purposeful.

---

# 47. Definition of Done

The UI library is complete when:

- Design tokens exist.
- Core UI primitives exist.
- Child components exist.
- Admin components exist.
- Components are responsive.
- Components are accessible.
- Components have predictable states.
- Game-specific logic remains outside generic components.
- Components use centralized design tokens.
- Visual patterns are consistent.
- Mobile and iPad layouts work.
- Reduced motion is supported.
- Component tests cover critical interactions.
