# Learnzzy — Stitch Design Instructions

## Stitch Project

**Title:** Learnzzy Educational Kids Playground  
**Project ID:** `1495487808742926612`

Stitch is the visual/design reference for the screens listed below. Learnzzy project documentation remains authoritative for architecture, business rules, security, privacy, performance, accessibility, and implementation decisions.

## Screens

| # | Screen | Stitch ID |
|---|---|---|
| 1 | Learnzzy Brand Logo | `a649bb71b93447dba952b91096531210` |
| 2 | Learnzzy Admin — Content Agent Inspector & Logs | `d447ddc3a76d440e8b2255142f1013f1` |
| 3 | Learnzzy Admin — Agent Fleet & Orchestration | `4adf5f0ccc04426995828b347546a083` |
| 4 | Learnzzy Child Playground Home | `94140a548156490da36a7ea50609708c` |
| 5 | Number Adventure — Addition Game | `ff9f32f8720b4cd79c61ae60c0ee43dd` |
| 6 | Fly Away — Subtraction Game | `1120c83d47414ff09ad1245b5b84998c` |
| 7 | Learnzzy Agentic Admin Command Center | `b4c164b06e914c1ea263c2ccd6b7e41d` |

## Stitch MCP Workflow

When implementing a screen:

1. Identify its Stitch screen ID above.
2. Use the Stitch MCP to retrieve the screen/design information.
3. Retrieve relevant hosted images/assets and reference code where available.
4. Inspect the design before coding.
5. Compare it against the Learnzzy documentation.
6. Reuse existing Learnzzy components.
7. Implement clean, maintainable code rather than blindly copying generated code.
8. Test at mobile, iPad/tablet, and desktop sizes.
9. Run type checking, linting, tests, and build verification.
10. Update documentation when implementation or decisions change.

## Download Hosted Stitch URLs

When Stitch returns hosted URLs, use a utility such as:

```bash
curl -L "<HOSTED_URL>" -o "<OUTPUT_FILE>"
```

Recommended asset structure:

```text
public/
└── assets/
    └── learnzzy/
        ├── brand/
        ├── child/
        ├── games/
        │   ├── addition/
        │   ├── subtraction/
        │   ├── clean-up/
        │   ├── puzzle/
        │   └── sketch/
        └── admin/
```

Do not expose API keys or secrets in downloaded files, source code, or client-side code.

## Design-to-Code Rules

Stitch provides visual design/reference; it does **not** override Learnzzy architecture.

Follow this source-of-truth hierarchy:

```text
1. DECISIONS.md
2. BUSINESS_RULES.md
3. ARCHITECTURE.md
4. DATABASE.md / API.md
5. UI.md / UI_UX.md / UI_LIBRARY.md
6. Stitch visual design
7. BACKLOG.md
8. Implementation convenience
```

If Stitch conflicts with documented architecture or business rules, follow the documentation and report a significant unresolved conflict instead of silently changing architecture.

## Child Experience

The child experience must be:

- visual-first
- simple
- playful
- safe
- non-punitive
- touch-first
- responsive
- accessible
- fast

Support:

- phone
- Android/iPhone
- iPad/tablet
- desktop
- touch and mouse
- portrait and landscape

Use large touch targets, minimal text, clear feedback, friendly animation, safe-area support, and `prefers-reduced-motion`.

Primary UX test:

> Can a five-year-old understand what to tap without needing an adult to explain the screen?

## MVP Games

The child home should support:

- Numbers / Addition
- Fly Away / Subtraction
- Clean Up
- Picture Puzzle
- Shadow Sketch

### Addition

Stitch screen: `ff9f32f8720b4cd79c61ae60c0ee43dd`

Use it for the visual reference for number presentation, counting objects, answer selection, feedback, progress, and animation.

Correctness is deterministic:

```text
a + b = answer
```

Never use an LLM to calculate the answer during gameplay.

### Subtraction

Stitch screen: `1120c83d47414ff09ad1245b5b84998c`

Use it for the visual reference for object interaction, fly-away animation, remaining objects, answer selection, feedback, and progress.

Correctness is deterministic:

```text
a - b = answer
```

Never use an LLM to calculate the answer during gameplay.

## Reuse Components

Before creating a component, inspect:

```text
src/components/ui
src/components/child
src/components/admin
src/components/layout
```

Prefer existing components such as:

**UI:** Button, IconButton, Card, Badge, Dialog, Modal, Tabs, Input, Select, Progress, Skeleton, Toast

**Child:** GameCard, GameHeader, AnswerButton, StarCounter, GameProgress, Celebration, GameShell, GameCanvas, HomeButton

**Admin:** AdminShell, AdminSidebar, MetricCard, AgentCard, AgentStatus, CommandCenter, ContentCard, ContentReview, ActivityFeed, SystemHealth

Do not create duplicates when an existing component can be safely reused or extended.

## Phaser Rules

For game screens:

- React/Next.js handles page/shell/navigation boundaries.
- Phaser handles game-specific interactive scenes.
- Deterministic game logic must remain separate from rendering.
- Business rules must not be buried inside visual components.

Preferred structure:

```text
Game UI
   ↓
Game Controller
   ↓
Deterministic Game Logic
   ↓
Validated Content
```

## AI Rules

AI stays behind the scenes.

Never use an LLM for:

- arithmetic
- scoring
- gameplay state
- answer validation
- animation timing
- collision detection
- child input handling
- critical gameplay decisions

AI-generated content must follow:

```text
AI generation
    ↓
Schema validation
    ↓
Deterministic validation
    ↓
Quality/Safety validation
    ↓
Approval
    ↓
Active content pool
    ↓
Gameplay
```

Child gameplay must never wait for an LLM.

## Agent/Admin Screens

### Content Agent Inspector & Logs

Stitch ID: `d447ddc3a76d440e8b2255142f1013f1`

Reference for agent inspection, task/run details, logs, status, and operational information.

### Agent Fleet & Orchestration

Stitch ID: `4adf5f0ccc04426995828b347546a083`

Reference for agent fleet, cards, status, orchestration, workload, and monitoring.

Planned agents:

1. Content Agent
2. Quality & Safety Agent
3. Asset Agent
4. Analytics Agent
5. Difficulty Agent

### Agentic Admin Command Center

Stitch ID: `b4c164b06e914c1ea263c2ccd6b7e41d`

Reference for natural-language admin commands, command history, agent execution, task monitoring, system status, and operational controls.

Natural-language commands must become structured, authorized tasks. They must never become unrestricted raw MongoDB access. Consequential/destructive actions require confirmation.

## Asset Rules

Before generating an asset:

1. Search/reuse an existing suitable asset.
2. Generate only when necessary.
3. Validate it.
4. Optimize it.
5. Store binaries in S3-compatible object storage in production.
6. Keep metadata in MongoDB.
7. Use CDN delivery where appropriate.

Child-facing assets must avoid unsafe imagery, violence, weapons, frightening content, adult themes, inappropriate text, and unwanted watermarks.

## Responsive Design

Do not implement only the Stitch desktop dimensions.

Validate:

```text
Mobile portrait
Mobile landscape
iPad portrait
iPad landscape
Desktop
Large desktop
```

Pay special attention to game canvas sizing, touch targets, text scaling, navigation, safe areas, image scaling, Phaser resizing, and orientation changes.

## Performance

Do not introduce visual designs that cause unnecessary performance regressions.

Avoid:

- oversized images
- unnecessary animation libraries
- huge client bundles
- blocking requests
- synchronous AI
- synchronous image generation
- excessive DOM complexity

Prefer optimized assets, lazy loading, code splitting, prefetching, cached content, CDN delivery, and lightweight animations.

## Accessibility

Consider:

- keyboard navigation where applicable
- visible focus
- sufficient contrast
- large touch targets
- semantic controls
- readable text
- reduced motion
- status indicators that do not rely only on color
- accessible labels where needed

Child gameplay should remain understandable visually without relying exclusively on text.

## Visual QA

Compare the implementation with Stitch for:

- layout
- spacing
- typography
- sizing
- hierarchy
- imagery
- cards
- buttons
- icons
- borders
- shadows
- radius
- animation
- responsive behavior

Do not sacrifice accessibility, responsiveness, maintainability, performance, or business rules for pixel-perfect similarity.

## Verification

After implementing a Stitch-based screen, inspect `package.json` for the project's actual scripts and run the appropriate checks, typically:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also verify:

- mobile
- tablet/iPad
- desktop
- portrait
- landscape
- touch
- keyboard where applicable
- reduced motion
- loading/error/empty states where applicable

For games, additionally verify deterministic correctness, reset, retry, completion, progress, animation, event logging, and session behavior.

## Final Principle

Use Stitch to make Learnzzy visually excellent.

Use Learnzzy documentation to make it architecturally correct.

Use deterministic code to make gameplay reliable.

Use AI and agents behind the scenes to make the platform intelligent.

**Simple for the child. Powerful for the administrator. Intelligent behind the scenes.**
