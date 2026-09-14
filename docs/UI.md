# Learnzzy — UI Specification

## 1. Purpose

This document is the visual implementation source of truth for Learnzzy.

It defines the visual language that must be used across:

- Child-facing pages
- Games
- Public landing pages
- Admin pages
- Responsive layouts
- PWA surfaces

The UI should feel modern, lightweight, playful, safe, and polished.

## 2. Product UI Personality

Learnzzy is:

- Playful
- Friendly
- Modern
- Calm
- Colourful
- Simple
- Trustworthy
- Fast

It is not:

- A traditional school portal
- A corporate dashboard for children
- A noisy arcade
- A social network
- A form-heavy application

### Core visual statement

> A tiny magical learning playground.

## 3. Design Layers

Use three visual layers:

```text
FOUNDATION
Colors / Typography / Spacing / Radius / Shadows

COMPONENTS
Buttons / Cards / Headers / Inputs / Badges / Dialogs

EXPERIENCES
Home / Games / Celebration / Admin / Analytics
```

Components must consume foundation tokens instead of hard-coded visual values.

## 4. Design Tokens

All visual constants should be centralized.

Suggested token groups:

```text
color.*
font.*
space.*
radius.*
shadow.*
motion.*
breakpoint.*
z.*
```

Example:

```text
color.background
color.surface
color.surfaceElevated
color.primary
color.secondary
color.success
color.warning
color.danger
color.text
color.textMuted
color.border

space.1
space.2
space.3
space.4
space.6
space.8
space.12

radius.sm
radius.md
radius.lg
radius.xl
radius.pill
```

## 5. Color Direction

Use a light, friendly base.

Recommended semantic groups:

```text
Background      Soft warm neutral
Surface         White / very light neutral
Primary         Friendly blue-purple
Secondary       Playful pink/coral
Accent          Yellow/orange
Success         Fresh green
Warning         Warm amber
Danger          Soft red
Text            Deep charcoal
Muted           Neutral grey
```

Do not assign arbitrary colours to individual components.

Game-specific accents should still use the shared palette.

## 6. Typography

Use a modern, highly readable sans-serif.

Recommended hierarchy:

```text
Display:        40–56px
H1:             32–40px
H2:             26–32px
H3:             22–28px
Game title:     22–28px
Instruction:    20–26px
Button:         18–24px
Body:           16–18px
Small:          12–14px
```

Child-facing text should be short.

## 7. Spacing

Use a consistent spacing scale.

Recommended base:

```text
4px
8px
12px
16px
24px
32px
40px
48px
64px
```

Do not create random spacing values unless there is a specific layout reason.

## 8. Radius

Learnzzy uses rounded geometry.

```text
Small controls: 12px
Cards:          20–24px
Game cards:     24–32px
Large panels:   24–32px
Pills:          999px
```

## 9. Shadows

Use soft depth rather than heavy shadows.

Suggested:

```text
shadow-soft
shadow-card
shadow-floating
```

Avoid strong black shadows.

## 10. Child UI Layout

Child pages should prioritize the game.

Standard structure:

```text
┌────────────────────────────────────┐
│ Header                             │
├────────────────────────────────────┤
│                                    │
│          Game / Activity            │
│                                    │
├────────────────────────────────────┤
│ Interaction / Answers              │
└────────────────────────────────────┘
```

Do not allow navigation or decoration to compete with the game.

## 11. Child Header

Standard:

```text
┌────────────────────────────────────────────────┐
│ 🏠   Number Adventure             ⭐ 12   🔊    │
└────────────────────────────────────────────────┘
```

Controls:

- Home
- Stars
- Sound

Only include controls that are needed.

## 12. Game Card

Structure:

```text
┌──────────────────────────┐
│                          │
│        GAME ART          │
│                          │
│           🔢             │
│                          │
│     Number Adventure     │
│                          │
│     Learn Addition       │
│                          │
└──────────────────────────┘
```

States:

```text
default
hover
pressed
disabled
```

Hover should gently lift the card.

Pressed should gently scale down.

## 13. Primary Button

Child button:

```text
┌──────────────────────────┐
│       ▶ PLAY NOW         │
└──────────────────────────┘
```

Rules:

- Large
- Rounded
- High contrast
- Clear label
- Touch-friendly
- Strong pressed feedback

Minimum practical touch target: 44×44px. Prefer larger child-facing targets.

## 14. Answer Button

```text
┌──────────┐
│    5     │
└──────────┘
```

Number buttons should be visually distinct and large.

Do not use tiny answer controls.

States:

```text
default
pressed
correct
incorrect
disabled
```

Correct:

- positive motion
- success indicator
- star/celebration

Incorrect:

- gentle shake/bounce
- retry
- no harsh visual treatment

## 15. Progress Indicator

Keep progress simple.

Examples:

```text
⭐⭐⭐
```

or:

```text
● ● ● ○ ○
```

Avoid complicated XP bars in the MVP.

## 16. Star Counter

```text
⭐ 24
```

Use a compact pill/card.

The number should update with a short animation.

## 17. Icon Buttons

Examples:

```text
🏠
🔊
🔇
✕
↩
```

Every icon button must have:

- accessible label
- visible interaction state
- sufficiently large hit area

## 18. Game Canvas Container

Games using Phaser should render inside a responsive container.

Requirements:

- Stable aspect ratio where appropriate
- No accidental page scrolling
- Touch-safe
- Maximum width on desktop
- Full useful width on mobile
- Respect safe areas

## 19. Modal

Use modals sparingly in child UX.

Preferred child modal:

```text
┌─────────────────────────────┐
│                             │
│          Pause?             │
│                             │
│    ┌──────────────────┐     │
│    │   ▶ Continue     │     │
│    └──────────────────┘     │
│                             │
│    ┌──────────────────┐     │
│    │    🏠 Home       │     │
│    └──────────────────┘     │
│                             │
└─────────────────────────────┘
```

## 20. Toast

Avoid toasts for important child feedback.

Use visual game feedback instead.

Admin may use toasts for:

- Saved
- Approved
- Rejected
- Task queued

## 21. Celebration

Use a dedicated celebration component.

```text
✨ 🎉 ✨

AWESOME!

⭐ +3

[ PLAY AGAIN ]
[ HOME ]
```

Keep celebration short.

## 22. Loading

Child loading should be visual:

```text
🌈
Getting your adventure ready...
```

Avoid technical spinners where possible.

Admin can use skeleton loaders.

## 23. Error UI

Child:

```text
😊

Oops!
Let's try again.

[ TRY AGAIN ]

🏠 Home
```

Admin can show diagnostic information.

## 24. Empty State

Child screens should rarely be empty.

Admin example:

```text
✨ All caught up!

No pending content.
```

## 25. Forms

Forms should primarily exist in Admin.

Do not introduce child-facing forms unless absolutely necessary for a learning activity.

## 26. Admin UI

Admin should look professional while sharing the Learnzzy design language.

Suggested structure:

```text
┌──────────────┬───────────────────────────────────────┐
│ Sidebar      │ Header                                │
│              ├───────────────────────────────────────┤
│ Dashboard    │                                       │
│ Agents       │ Main Content                          │
│ Content      │                                       │
│ Assets       │                                       │
│ Analytics    │                                       │
│ Difficulty   │                                       │
│ System       │                                       │
└──────────────┴───────────────────────────────────────┘
```

## 27. Admin Metric Card

```text
┌──────────────────────────┐
│ Approved Content         │
│                          │
│ 320                      │
│                          │
│ ↑ 12%                    │
└──────────────────────────┘
```

Keep metrics concise.

## 28. Admin Status Badge

Examples:

```text
● Healthy
● Running
● Pending
● Failed
● Disabled
```

Status should use icon + text, not colour alone.

## 29. Admin Agent Card

```text
┌──────────────────────────────┐
│ 🤖 Content Agent             │
│                              │
│ ● Running                   │
│                              │
│ Generate addition content    │
│                              │
│ 31 / 50 processed            │
│                              │
│ [ View Run ]                 │
└──────────────────────────────┘
```

## 30. Command Center

This is a signature admin component.

```text
┌────────────────────────────────────────────────────┐
│ 🤖 Agent Command Center                            │
│                                                    │
│ What should Learnzzy do?                           │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Create 50 Level 1 addition activities.        │ │
│ └────────────────────────────────────────────────┘ │
│                                      [ Execute ]   │
│                                                    │
│ Recent activity                                    │
│ ● Content Agent — generated 50                    │
│ ● Quality Agent — approved 47                     │
│ ● Asset Agent — reused 12                         │
└────────────────────────────────────────────────────┘
```

## 31. Responsive Rules

### Mobile

- Single column
- Large controls
- Minimal header
- Full-width game area
- Avoid horizontal scrolling

### Tablet

- More generous game canvas
- Two-column layouts where useful

### Desktop

- Center game canvas
- Maximum content width
- More whitespace
- Admin sidebar

## 32. Breakpoints

Use responsive CSS rather than device-specific hacks.

Suggested starting points:

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Adjust based on actual layouts.

## 33. Mobile Safe Areas

Support:

```css
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

Especially for installed PWAs.

## 34. Motion

Motion should communicate:

- interaction
- cause/effect
- success
- transition

Avoid decorative animation that consumes performance.

Respect:

```text
prefers-reduced-motion
```

## 35. Z-Index

Define a shared scale.

Example:

```text
base
dropdown
sticky
modal
toast
critical
```

Do not scatter arbitrary z-index values throughout the application.

## 36. Accessibility

Requirements:

- Keyboard support
- Focus visibility
- Screen-reader labels
- Touch-friendly controls
- Colour contrast
- Reduced motion
- No colour-only feedback
- Semantic HTML

## 37. UI Performance

The UI must:

- Lazy-load heavy assets
- Split game bundles
- Optimize images
- Avoid unnecessary re-renders
- Avoid blocking AI calls
- Avoid loading all games at once

## 38. UI Implementation Rule

When a design decision is not explicitly specified:

1. Prefer the simpler option.
2. Prefer the more accessible option.
3. Prefer the faster option.
4. Reuse an existing component.
5. Avoid introducing a new visual pattern without a clear reason.

## 39. Final UI Test

Ask:

> Can a five-year-old understand what to tap without needing an adult to explain the screen?

If the answer is no, simplify the UI.
