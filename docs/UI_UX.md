# Learnzzy — UI/UX Design Specification

## 1. Design Vision

Learnzzy should feel like a **small magical learning playground**, not a school portal and not a conventional game website.

### Brand feeling

> **Play. Think. Learn.**

The interface should communicate:

- Joy
- Discovery
- Simplicity
- Safety
- Curiosity
- Achievement

The child should understand the interface primarily through **illustration, colour, animation, shape, and interaction**, rather than reading instructions.

---

# 2. UX Principles

## Principle 1 — Start Playing Immediately

The child should reach the game selection screen almost immediately.

Avoid:

- Signup walls
- Long onboarding
- Forms
- Account creation
- Complex menus

Preferred flow:

```text
OPEN
  ↓
HOME
  ↓
CHOOSE GAME
  ↓
PLAY
```

## Principle 2 — One Screen, One Task

During gameplay, the child should have one obvious objective.

Example:

```text
How many?
       🍎 🍎 🍎
       🍎 🍎

      [ 3 ] [ 4 ] [ 5 ] [ 6 ]
```

Do not place unrelated controls on the same screen.

## Principle 3 — Large Touch Targets

Design primarily for:

- Finger
- Stylus
- Mouse

Controls should be large and forgiving.

Target touch area:

```text
≥ 44 × 44 px
```

Prefer larger targets for child-facing controls.

## Principle 4 — Visual First

Prefer:

```text
IMAGE + ANIMATION + ICON
```

over:

```text
LONG TEXT
```

Use short instructions such as:

> Count them!

instead of:

> Please carefully count all of the objects shown on the screen and select the correct answer.

---

# 3. Visual Direction

## Overall Style

Modern children's illustration with:

- Soft rounded shapes
- Friendly characters
- Clean backgrounds
- Large cards
- Subtle depth
- Playful micro-interactions
- Gentle motion

Avoid:

- Overly saturated screens
- Excessive gradients
- Visual clutter
- Tiny typography
- Excessive shadows
- Complex 3D graphics

## Shape Language

Use rounded components:

```text
╭──────────────────────────────╮
│                              │
│       Rounded Content        │
│                              │
╰──────────────────────────────╯
```

Suggested radius:

- Small: 12px
- Medium: 18px
- Large: 24px
- Game cards: 24–32px

---

# 4. Colour Strategy

Do not make every element a different bright colour.

Use a calm base with colourful game accents.

### Suggested semantic palette

```text
Background
Soft warm / very light neutral

Primary
Friendly blue/purple family

Success
Fresh green

Playful accent
Yellow/orange

Secondary accent
Pink/coral

Text
Deep charcoal

Muted text
Soft grey
```

The exact colours should be implemented through design tokens so they can be changed globally.

Example:

```css
--color-background
--color-surface
--color-primary
--color-secondary
--color-success
--color-warning
--color-text
--color-muted
```

---

# 5. Typography

Use a highly readable rounded or friendly sans-serif.

Requirements:

- Large headings
- High readability
- Generous line height
- Strong contrast
- Avoid decorative fonts for important instructions

Suggested hierarchy:

```text
Hero title       40–56px
Page title       28–36px
Game title       22–28px
Instruction      20–26px
Answer button    24–32px
Body             16–18px
Small metadata   12–14px
```

For very young children, prefer visual communication over body text.

---

# 6. Application Structure

```text
Learnzzy
│
├── Public Landing
│
├── Child Experience
│   ├── Home
│   ├── Game Selection
│   ├── Addition
│   ├── Subtraction
│   ├── Clean Up
│   ├── Puzzle
│   ├── Sketch
│   └── Celebration
│
└── Admin
    ├── Login
    ├── Dashboard
    ├── Agent Command Center
    ├── Content
    ├── Assets
    ├── Analytics
    ├── Difficulty
    └── System Health
```

---

# 7. Public Landing Page

The landing page is primarily for parents, teachers, and visitors.

The child can bypass it through:

> **Start Playing**

## Desktop Sketch

```text
┌────────────────────────────────────────────────────────────────────┐
│  🌈 Learnzzy                         For Parents    About    ▶ Play │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                 PLAY. THINK. LEARN.                                │
│                                                                    │
│          Tiny games. Big learning.                                 │
│                                                                    │
│     Simple educational adventures designed for curious kids.       │
│                                                                    │
│              ┌────────────────────────┐                             │
│              │     ▶ Start Playing   │                             │
│              └────────────────────────┘                             │
│                                                                    │
│              ✨   🔢   🧩   🎨   🧠                                  │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                    LEARN THROUGH PLAY                               │
│                                                                    │
│       🔢            🧹            🧩            ✏️                   │
│     Numbers       Observe        Logic        Create                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Mobile Sketch

```text
┌────────────────────────────┐
│ 🌈 Learnzzy          ☰     │
│                            │
│       PLAY. THINK.         │
│          LEARN.             │
│                            │
│     Tiny games.             │
│     Big learning.           │
│                            │
│   ┌────────────────────┐   │
│   │    ▶ PLAY NOW      │   │
│   └────────────────────┘   │
│                            │
│       🧸  ✨  🌈           │
│                            │
│   Learn through play       │
│                            │
└────────────────────────────┘
```

---

# 8. Child Home Screen

This is the most important screen.

The child should see the games immediately.

## Desktop Sketch

```text
┌────────────────────────────────────────────────────────────────────┐
│ 🌈 Learnzzy                                      ⭐ 24              │
│                                                                    │
│                    What shall we play?                             │
│                                                                    │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│    │              │    │              │    │              │       │
│    │      🔢      │    │      🐦      │    │      🧹      │       │
│    │              │    │              │    │              │       │
│    │    Numbers   │    │   Fly Away   │    │   Clean Up   │       │
│    │              │    │              │    │              │       │
│    └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                    │
│    ┌──────────────┐    ┌──────────────┐                            │
│    │              │    │              │                            │
│    │      🧩      │    │      ✏️      │                            │
│    │              │    │              │                            │
│    │    Puzzle    │    │    Sketch    │                            │
│    │              │    │              │                            │
│    └──────────────┘    └──────────────┘                            │
│                                                                    │
│                     ⭐ My Stars                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Mobile Sketch

```text
┌────────────────────────────┐
│ 🌈 Learnzzy          ⭐ 24  │
│                            │
│     What shall we play?    │
│                            │
│ ┌────────────────────────┐ │
│ │          🔢            │ │
│ │       NUMBERS          │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │          🐦            │ │
│ │       FLY AWAY         │ │
│ └────────────────────────┘ │
│                            │
│ ┌───────────┐ ┌──────────┐ │
│ │    🧹     │ │    🧩    │ │
│ │ CLEAN UP  │ │  PUZZLE  │ │
│ └───────────┘ └──────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │          ✏️            │ │
│ │        SKETCH          │ │
│ └────────────────────────┘ │
│                            │
└────────────────────────────┘
```

---

# 9. Game Selection Card

Every game card should include:

```text
┌─────────────────────────┐
│                         │
│          GAME ART       │
│                         │
│            🔢           │
│                         │
│       Number Adventure  │
│                         │
│       ⭐ Learn Addition │
│                         │
└─────────────────────────┘
```

Hover:

- Card gently lifts.
- Illustration moves slightly.

Tap:

- Small scale-down feedback.
- Transition into game.

---

# 10. Game Header

Keep gameplay header minimal.

```text
┌────────────────────────────────────────────────────────────────┐
│ 🏠        Number Adventure                       ⭐ 12   🔊    │
└────────────────────────────────────────────────────────────────┘
```

Only show controls that are actually useful.

Possible controls:

- Home
- Stars/progress
- Sound
- Pause where necessary

Do not show complicated navigation during gameplay.

---

# 11. Addition Game UX

## Screen Sketch

```text
┌──────────────────────────────────────────────────────────────┐
│ 🏠  Number Adventure                              ⭐ 12       │
│                                                              │
│                   COUNT THEM!                                │
│                                                              │
│          🍎  🍎  🍎       +       🍎  🍎                     │
│                                                              │
│                         ↓                                    │
│                                                              │
│                    How many?                                  │
│                                                              │
│             ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│             │  3 │ │  4 │ │  5 │ │  6 │                     │
│             └────┘ └────┘ └────┘ └────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Animation

1. First objects appear.
2. Second group appears.
3. Objects move together.
4. Question appears.
5. Answer buttons animate gently.

Correct:

```text
✨ ⭐ 🎉
Great job!
```

Incorrect:

```text
Gentle bounce
Try again!
```

Never use frightening error animations.

---

# 12. Subtraction Game UX

```text
┌──────────────────────────────────────────────────────────────┐
│ 🏠  Fly Away                                      ⭐ 15       │
│                                                              │
│                     WATCH THEM FLY!                           │
│                                                              │
│          🐦  🐦  🐦  🐦  🐦                                  │
│                                                              │
│              🐦  🐦  → → →                                   │
│                                                              │
│                     How many left?                            │
│                                                              │
│             ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│             │  2 │ │  3 │ │  4 │ │  5 │                     │
│             └────┘ └────┘ └────┘ └────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

The subtraction must be visually obvious.

---

# 13. Clean Up UX

## Scene

```text
┌──────────────────────────────────────────────────────────────┐
│ 🏠  Clean Up                                      ⭐ 18       │
│                                                              │
│                   CLEAN IT UP! 🧹                             │
│                                                              │
│       ┌──────────────────────────────────────────────┐       │
│       │                                              │       │
│       │     🧸              📄                       │       │
│       │                                              │       │
│       │              🧃              🧦              │       │
│       │                                              │       │
│       │       📚                     🍌              │       │
│       │                                              │       │
│       └──────────────────────────────────────────────┘       │
│                                                              │
│                  🧺  3 things left                           │
└──────────────────────────────────────────────────────────────┘
```

When the child taps a target:

```text
Object
  ↓
Small bounce
  ↓
Moves toward basket
  ↓
Disappears
  ↓
Counter updates
```

Completion:

```text
┌─────────────────────────────┐
│                             │
│          ✨ 🎉 ✨            │
│                             │
│       ALL CLEAN!             │
│                             │
│          ⭐ +5               │
│                             │
│      ┌──────────────┐       │
│      │ NEXT GAME →  │       │
│      └──────────────┘       │
│                             │
└─────────────────────────────┘
```

---

# 14. Puzzle UX

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ 🏠  Picture Puzzle                                ⭐ 21       │
│                                                              │
│                    COMPLETE THE PICTURE                       │
│                                                              │
│             ┌──────────────────┐     ┌────┐ ┌────┐           │
│             │                  │     │    │ │    │           │
│             │     PUZZLE       │     └────┘ └────┘           │
│             │      BOARD       │     ┌────┐ ┌────┐           │
│             │                  │     │    │ │    │           │
│             └──────────────────┘     └────┘ └────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

On mobile, use:

```text
Board
  ↓
Piece tray
  ↓
Drag piece
  ↓
Snap
```

Do not make puzzle pieces too small.

---

# 15. Shadow Sketch UX

```text
┌──────────────────────────────────────────────────────────────┐
│ 🏠  Shadow Sketch                                 ⭐ 25       │
│                                                              │
│                    TRACE THE SHAPE                            │
│                                                              │
│                  ╭──────────────╮                             │
│                ╭─╯              ╰─╮                           │
│               │       🐘          │                           │
│                ╰─╮              ╭─╯                           │
│                  ╰──────────────╯                             │
│                                                              │
│                     ✏️ Draw here                              │
│                                                              │
│            [ Clear ]                    [ Done ✓ ]            │
└──────────────────────────────────────────────────────────────┘
```

The guide path should be subtle.

The drawing canvas should have a large interaction area.

Support:

- Touch
- Pointer
- Mouse
- Stylus

---

# 16. Celebration Screen

Do not interrupt the child with a long result page.

Keep it short.

```text
┌────────────────────────────┐
│                            │
│          ✨ 🎉 ✨           │
│                            │
│       AWESOME!             │
│                            │
│          ⭐ +3              │
│                            │
│       ⭐⭐⭐⭐⭐              │
│                            │
│   ┌────────────────────┐   │
│   │    PLAY AGAIN      │   │
│   └────────────────────┘   │
│                            │
│       🏠 Home              │
└────────────────────────────┘
```

Animation should last approximately 1–2 seconds before the child can continue.

---

# 17. Progress / Stars

Keep progress understandable.

Avoid complicated XP systems.

Example:

```text
⭐ 24
```

Optional:

```text
Today
⭐⭐⭐⭐
```

Do not make the child feel like they failed if they do not earn maximum stars.

---

# 18. Navigation

Child-facing navigation:

```text
🏠 Home
```

Optional:

```text
🔊 Sound
⭐ Progress
```

Avoid hamburger menus during gameplay.

Admin can have a full navigation system.

---

# 19. Responsive Layout

## Mobile

Single-column.

```text
┌───────────────┐
│ Header        │
├───────────────┤
│               │
│ Game          │
│ Area          │
│               │
├───────────────┤
│ Answers       │
└───────────────┘
```

## Tablet

Use larger game canvas.

```text
┌───────────────────────────────┐
│ Header                        │
├───────────────────────────────┤
│                               │
│        GAME CANVAS            │
│                               │
├───────────────────────────────┤
│       ANSWER CONTROLS         │
└───────────────────────────────┘
```

## Desktop

Use a centered game area.

```text
┌────────────────────────────────────────────────────┐
│ Header                                              │
├────────────────────────────────────────────────────┤
│                                                    │
│              ┌────────────────────┐                │
│              │                    │                │
│              │    GAME AREA       │                │
│              │                    │                │
│              └────────────────────┘                │
│                                                    │
│                 GAME CONTROLS                      │
└────────────────────────────────────────────────────┘
```

Do not stretch game content excessively on large monitors.

Use a maximum game width.

---

# 20. Landscape Mode

For tablets and iPads, landscape mode can use the additional horizontal space.

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│ Header                                                        │
├──────────────────────────────┬───────────────────────────────┤
│                              │                               │
│          GAME                │       CONTROLS                │
│          AREA                │                               │
│                              │       [ 1 ] [ 2 ]             │
│                              │       [ 3 ] [ 4 ]             │
│                              │                               │
└──────────────────────────────┴───────────────────────────────┘
```

However, do not force landscape.

Support both orientations.

---

# 21. Interaction Design

Every interaction should provide immediate feedback.

### Tap

```text
Scale 1
 ↓
Scale 0.96
 ↓
Scale 1
```

### Correct

```text
Tap
 ↓
Object reaction
 ↓
Success animation
 ↓
Star
 ↓
Next activity
```

### Incorrect

```text
Tap
 ↓
Gentle bounce
 ↓
Short hint
 ↓
Retry
```

Never punish the child.

---

# 22. Motion Guidelines

Animations should be:

- Short
- Smooth
- Predictable
- Purposeful

Recommended durations:

```text
Micro interaction: 100–200ms
Button feedback:   150–250ms
Object movement:   300–700ms
Celebration:       1000–2000ms
Page transition:   200–400ms
```

Respect:

```text
prefers-reduced-motion
```

When reduced motion is enabled, replace large animations with subtle transitions.

---

# 23. Sound UX

Provide a visible sound control.

```text
🔊
```

or:

```text
🔇
```

Sound should be:

- Short
- Friendly
- Non-intrusive

Never rely on sound alone to communicate success or failure.

---

# 24. Loading States

Avoid generic spinners wherever possible.

For child screens:

```text
🌈
A little adventure is loading...
```

Use skeletons for admin screens.

Never display technical messages such as:

> API request failed.

to children.

---

# 25. Error State

Child:

```text
┌────────────────────────────┐
│                            │
│          😊                 │
│                            │
│     Oops! Let's try again. │
│                            │
│      [ TRY AGAIN ]         │
│                            │
│        🏠 Home             │
└────────────────────────────┘
```

Admin:

Show technical details appropriate for administrators.

---

# 26. Admin UX

The admin experience should be modern and operational.

It should feel like an **AI command center**, not a traditional CRUD application.

## Admin Layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ Learnzzy Admin                              🔔    Admin ▾          │
├───────────────┬────────────────────────────────────────────────────┤
│               │                                                    │
│ Dashboard     │  AI Learning Platform                              │
│               │                                                    │
│ 🤖 Agents     │  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│               │  │ 5 Games    │ │ 320 Items  │ │ 5 Agents   │     │
│ 📚 Content    │  │ Active     │ │ Approved   │ │ Healthy    │     │
│               │  └────────────┘ └────────────┘ └────────────┘     │
│ 🎨 Assets     │                                                    │
│               │  Agent Activity                                   │
│ 📊 Analytics  │  ┌──────────────────────────────────────────────┐  │
│               │  │ 🤖 Content Agent     Generated 50            │  │
│ 🧠 Difficulty │  │ 🛡️ Quality Agent      Approved 47            │  │
│               │  │ 🎨 Asset Agent        8 assets ready          │  │
│ ⚙️ System     │  └──────────────────────────────────────────────┘  │
│               │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

---

# 27. Agent Command Center

This should be one of the signature admin features.

```text
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Agent Command Center                                           │
│                                                                  │
│ What should Learnzzy do?                                         │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Create 50 Level 1 addition activities.                      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                    [ Execute ]   │
│                                                                  │
│ Recent Agent Activity                                             │
│                                                                  │
│ ● Content Agent                                                  │
│   Generated 50 addition activities                              │
│                                                                  │
│ ● Quality Agent                                                  │
│   47 approved / 3 rejected                                      │
│                                                                  │
│ ● Asset Agent                                                    │
│   12 existing assets reused                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

The command interface should route natural language to structured agent tasks.

---

# 28. Admin Agent Cards

```text
┌───────────────────────────────┐
│ 🤖 Content Agent              │
│                               │
│ ● Healthy                     │
│                               │
│ Current task                  │
│ Generate addition content     │
│                               │
│ Today                         │
│ 240 generated                 │
│ 221 approved                  │
│                               │
│ Token usage                   │
│ 12.4K                         │
│                               │
│ [ View Runs ]                 │
└───────────────────────────────┘
```

---

# 29. Admin Content Review

Use visual cards rather than only tables.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Content Review                                                    │
│                                                                  │
│ Filters: [Addition] [Level 1] [Pending]                          │
│                                                                  │
│ ┌───────────────────┐  ┌───────────────────┐                    │
│ │ 🍎 🍎 🍎 + 🍎     │  │ 🐟 🐟 + 🐟 🐟      │                    │
│ │                   │  │                   │                    │
│ │ Answer: 4         │  │ Answer: 4         │                    │
│ │                   │  │                   │                    │
│ │ ✓ Math valid      │  │ ✓ Math valid      │                    │
│ │ ✓ Safety checked  │  │ ✓ Safety checked  │                    │
│ │                   │  │                   │                    │
│ │ [Approve] [Reject]│  │ [Approve] [Reject]│                    │
│ └───────────────────┘  └───────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

---

# 30. Admin Analytics

Keep charts simple.

Important metrics:

```text
Game Starts
Game Completion
Accuracy
Average Response Time
Difficulty
Content Performance
Agent Activity
AI Cost
```

Do not expose unnecessary child-identifying information.

---

# 31. Design System Components

Create reusable components:

```text
Button
IconButton
GameCard
GameHeader
ProgressIndicator
StarCounter
AnswerButton
GameCanvas
Celebration
Modal
Drawer
AdminSidebar
AdminCard
AgentCard
StatusBadge
MetricCard
ContentCard
CommandInput
Toast
Dialog
```

---

# 32. Design Tokens

Create central tokens for:

```text
Colors
Typography
Spacing
Radius
Shadows
Motion
Breakpoints
Z-index
```

Example:

```text
spacing-1
spacing-2
spacing-3
spacing-4
spacing-6
spacing-8

radius-sm
radius-md
radius-lg
radius-xl

shadow-soft
shadow-card
shadow-floating
```

Do not hard-code inconsistent values throughout the application.

---

# 33. Accessibility

Child experience:

- Large touch areas
- Strong contrast
- Keyboard support
- Pointer support
- Reduced motion
- Visible focus states
- No colour-only feedback
- Screen-reader labels for important controls

For drawing:

- Support pointer events
- Support stylus
- Support touch
- Support mouse

---

# 34. Responsive Design Rules

### Mobile first

Build the mobile layout first.

Then enhance for:

```text
Mobile
↓
Large Mobile
↓
Tablet
↓
iPad
↓
Desktop
```

Do not design desktop first and simply shrink it.

---

# 35. Performance UX

The interface should feel instant.

When the child taps:

```text
Tap
 ↓
Immediate visual response
```

Do not wait for:

- Analytics API
- AI
- Database confirmation
- Image generation

Gameplay events can be queued asynchronously.

---

# 36. AI Content Loading UX

If a content pool is temporarily empty, do not show:

> Generating with AI...

Instead:

```text
Use cached/pre-generated content.
```

AI generation happens behind the scenes.

The child should not know or care whether content came from:

- static pool
- deterministic variation
- AI generation

The experience should feel continuous.

---

# 37. Empty States

Admin:

```text
No pending content.

✨ Everything is reviewed.
```

Child:

Avoid empty states wherever possible.

If unavoidable:

```text
🌈 Let's try another adventure!
```

---

# 38. Mobile Safe Areas

Support device safe areas.

Use:

```text
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

Especially important for:

- iPhone
- iPad
- fullscreen PWA

---

# 39. Orientation Behaviour

Do not force screen rotation.

Game layouts should adapt.

For games that benefit from landscape:

- Detect available space.
- Adjust layout.
- Show a subtle orientation suggestion only when genuinely useful.

Never trap the user.

---

# 40. UI State Model

Game UI should have clear states:

```text
LOADING
READY
PLAYING
SUCCESS
RETRY
COMPLETED
PAUSED
ERROR
```

Transitions should be deterministic.

---

# 41. Game Transition

Preferred:

```text
Home
 ↓
Card tap
 ↓
Card expands slightly
 ↓
Game scene enters
```

Avoid long splash animations.

Target transition:

```text
200–400ms
```

---

# 42. Child-Friendly Copy

Use simple language.

Good:

```text
Count them!
How many?
Try again!
Great job!
You did it!
Let's play!
Clean it up!
Complete the picture!
Draw it!
```

Avoid:

```text
Incorrect response.
Calculation failed.
Submit answer.
Proceed to next question.
Performance score.
```

---

# 43. Parent/Adult Copy

Landing/admin areas can explain the educational purpose.

Example:

> Learnzzy turns foundational learning into short, visual adventures designed for children.

Keep parent-facing explanations concise.

---

# 44. Brand Identity

Primary logo concept:

```text
       🌈
   L E A R N Z Z Y
```

Possible icon:

```text
✨ + 🌈 + 🧠
```

The logo should work as:

- Website logo
- PWA icon
- Favicon
- Mobile home-screen icon
- Social preview

---

# 45. Visual Asset Guidelines

Generated illustrations should share a consistent art direction.

Preferred:

- Friendly
- Rounded
- Simple
- Colourful
- High contrast
- Clean silhouettes
- Child-safe
- Recognizable at small sizes

Do not mix radically different art styles in the same game.

Store asset style metadata.

---

# 46. Image Generation Prompt Strategy

Asset prompts should include a shared style profile.

Conceptually:

```text
STYLE_PROFILE =
friendly modern children's educational illustration,
simple rounded shapes,
clean background,
soft playful composition,
high readability,
child-safe,
no text,
no watermark
```

Then append the specific asset description.

This keeps the visual language consistent.

---

# 47. UI/UX Acceptance Criteria

The design is considered successful when:

- A child can identify the five games without reading long descriptions.
- A child can start a game within seconds.
- Every primary interaction is visually obvious.
- Buttons are large enough for touch.
- The interface works in portrait and landscape.
- The game canvas is responsive.
- Animations are smooth.
- Errors are gentle.
- No child-facing screen feels like an admin system.
- Admin screens communicate AI operations clearly.
- The interface remains usable on small mobile screens.
- Reduced-motion mode works.
- Offline cached gameplay does not look broken.

---

# 48. Design Implementation Rules for Coding Agents

When implementing this specification:

1. Do not create generic dashboard-looking child pages.
2. Do not use placeholder text where real UX copy is known.
3. Do not make every card identical if the game identity benefits from illustration.
4. Do not overuse gradients.
5. Do not use tiny controls.
6. Do not add unnecessary navigation.
7. Do not add unnecessary forms.
8. Do not make gameplay dependent on API latency.
9. Do not expose technical errors to children.
10. Do not expose AI internals or chain-of-thought.
11. Reuse the design system components.
12. Keep all spacing, typography, colour, and radius values tokenized.
13. Test touch interaction on mobile and iPad.
14. Test keyboard and reduced-motion accessibility.
15. Prefer simple, polished interactions over complex visual effects.

---

# 49. Page Inventory

## Public

```text
/
```

Landing page.

## Child

```text
/play
/play/addition
/play/subtraction
/play/clean-up
/play/puzzle
/play/sketch
/play/complete
```

## Admin

```text
/admin/login
/admin
/admin/agents
/admin/agents/[id]
/admin/content
/admin/content/[id]
/admin/assets
/admin/analytics
/admin/difficulty
/admin/system
/admin/settings
```

---

# 50. Final Design Direction

The final Learnzzy experience should feel like:

```text
        🌈
     LEARNZZY

   ┌───────────────┐
   │      🔢       │
   │   NUMBERS     │
   └───────────────┘

   ┌───────────────┐
   │      🐦       │
   │   FLY AWAY    │
   └───────────────┘

   ┌───────┐ ┌───────┐
   │  🧹   │ │  🧩   │
   │ CLEAN │ │PUZZLE │
   └───────┘ └───────┘

       ┌─────────┐
       │   ✏️    │
       │ SKETCH  │
       └─────────┘

       ⭐ Play. Think. Learn.
```

The **child interface must stay simple**.

The **backend can be sophisticated**.

The **AI can be sophisticated**.

The **admin can be sophisticated**.

But the child should feel:

> **“I want to play this!”**

That is the primary UX success criterion for Learnzzy.
