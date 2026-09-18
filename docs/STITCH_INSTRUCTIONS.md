# Learnzzy — Stitch Design Instructions

## Stitch Project

**Title:** Learnzzy Educational Kids Playground  
**Project ID:** `1495487808742926612`

Stitch is the visual/design reference for the screens listed below. Learnzzy project documentation remains authoritative for architecture, business rules, security, privacy, performance, accessibility, and implementation decisions.

## References

| # | Screen | Stitch ID |
|---|---|---|
| 1 | Learnzzy Architecture Document | `0f86b7644a2f4435b5e070dffb41ae92` |
| 2 | Design System | `asset-stub-assets_d9763c62c3a749b290362bd7535f768d` |
| 3 | Learnzzy Brand Logo | `a649bb71b93447dba952b91096531210` |
| 4 | Learnzzy Child Playground Home | `94140a548156490da36a7ea50609708c` |
| 5 | Number Adventure — Addition Game | `ff9f32f8720b4cd79c61ae60c0ee43dd` |
| 6 | Fly Away — Subtraction Game | `1120c83d47414ff09ad1245b5b84998c` |
| 7 | Learnzzy Agentic Admin Command Center | `b4c164b06e914c1ea263c2ccd6b7e41d` |
| 8 | Learnzzy Admin — Content Agent Inspector & Logs | `d447ddc3a76d440e8b2255142f1013f1` |
| 9 | Learnzzy Admin — Agent Fleet & Orchestration | `4adf5f0ccc04426995828b347546a083` |
| 10 | Learnzzy Child — Learner Setup & Parent Link | `a4492672347341efa5505f0e03e704be` |
| 11 | Learnzzy Parent — Learning Journey & Personalization Plan | `80ccc6fb054d4be4ad7c625b3f92b4e9` |
| 12 | Clean Up — Playful Sorting Game | `f66f9a18b6e2456988f29b9d8c3d08a2` |
| 13 | Wooden dino puzzle art (chunky tactile pieces) | `76f8b3cf7e02450fbf0ef70eaeb85019` |
| 14 | Baby elephant + starlight dust art | `d97dbb239d32457c9e86d93137a1e401` |
| 15 | Puppy sorting toys art | `1f621168798d40aeab5f2cb10e184129` |
| 16 | Picture Puzzle — Dino Discovery Game | `38d899db5d2143dd8db9ff8fd7ca4224` |
| 17 | Shadow Sketch — Starlight Trace Game | `77cc886e4fcd4a77b1ea8a62574bf23d` |
| 18 | Living Wonder Worlds selector | `e738ae27b07246839832c21532a46e38` |
| 19 | Number Orchard — Addition Game | `e9c18d72525a43cf9b5afba286c9c182` |
| 20 | Breeze Valley — Subtraction Game | `d635d120d6664068accc79f28bec27a9` |

The architecture document and design system are references rather than child
screens, but they are included here so implementation work uses the complete
Stitch source set.

**Retrieval status (2026-09-16):** hosted HTML/SVG references are downloaded
under `docs/stitch_learnzzy_educational_kids_playground/` with screenshots for
child-home, addition, subtraction, learner-setup, admin-command-center,
admin-content-agent, and admin-agent-fleet. The parent-journey screenshot URL
has expired (Google returned HTTP 400), so only `parent-journey.html` is kept
locally; re-fetch the screenshot URL before claiming pixel parity for that
screen. The parent-journey and architecture references remain visual references
until re-verified live.

**Retrieval status (2026-09-18):** screens 12–20 RETRIEVED via the Stitch
MCP (`list_screens` + `get_screen` on project `1495487808742926612`, API key
from `STITCH_API_KEY`) followed by `curl -L` downloads:
`clean-up.html`, `puzzle.html`, `sketch.html`,
`living-wonder-worlds.html`, `number-orchard.html`, `breeze-valley.html`,
`shader.html` under `docs/stitch_learnzzy_educational_kids_playground/`,
plus 9 screenshots (7 game screens + 3 square art boards:
`art-puppy-sorting.png`, `art-dino-puzzle.png`,
`art-elephant-starlight.png`) under `screenshots/`. The 3 art boards were
additionally optimized with `sharp` to 640px WebP postcards (36–54KB) at
`public/assets/learnzzy/games/{clean-up,puzzle,sketch}/scene.webp` and are
used as world-banner/guide art (lazy-loaded `<img>`; plain `<img>` is a
deliberate choice — no `next/image` layout churn for fixed-size cards).
Worlds with no Stitch art (addition, subtraction, discover) use gradient
sky scenes + place emoji instead of invented imagery.

**Retrieval status (2026-09-18 Session 10):** additional validation screens
`d14a9b61423a49adb2d0a5bf05f5e5ed` (Animal Wonderland Child-First 3D Play Home)
+ `4b8445bd757549bd9b59e61932c946c9` (Three.js ANIMATION_45 Rich) fetched via
`get_screen` + `curl -L` into `.stitch/1495487808742926612/` and `public/images/stitch/home-child-first-v2.png`.
These validate `f929a9c4`/`b933` (copy/section structure identical; Rich delta
is 5 candy mushrooms + 5 bobbing counting apples + 15 deterministic warm stars
+ 4-bird formation + tap `jumpBoost` burst, camera 4.5/20). Landing (/)
reconciled to category-primary per spec §2/§3 (`HomeContinue` + 7-category grid
+ secondary 5-tile shortcuts + `BrandLogo→/play`).

## Stitch MCP Workflow

**Deliberate deviations from the fetched screens (2026-09-18, documented
per the source-of-truth hierarchy):**
- `98b07e79…` **Shader** (WebGL simplex-noise background for the worlds
  selector) was NOT adopted as live WebGL: continuous fragment-shader
  rendering conflicts with the documented performance/battery rules for a
  child PWA. The selector keeps the calm CSS sky-drift/twinkle ambient
  motion instead (`globals.css`, neutralized by `prefers-reduced-motion`).
- **Breeze Valley** shows a bunny guide ("Bella"), but the tested character
  mapping (`characterForGame("subtraction") === "teddy"`, pinned by
  `tests/characters.test.ts`) keeps Teddy as the subtraction host. Docs win
  over Stitch here; the meadow visuals and story copy follow Stitch.
- **Clean Up** in Stitch sorts items into named baskets; the shipped game is
  tap-to-tidy (prior decision). Only the presentation layer was aligned
  (Pip guide card, quest stepper, item pill, clue bar) — no mechanic change.
- Stitch names ("Bella Bunny", "Prof. Hoot", "Pip the Puppy") are used as
  display names only; the canonical `characters.ts` roster/ids are unchanged.

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
