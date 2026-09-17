# Learnzzy Learning Progress, Level Progression & Dynamic Content Assessment

**Date:** 2026-09-15  
**Method:** repository inspection and code-path tracing before implementation  
**Rule:** reuse existing repositories, services, schemas, games, and UI; add only
the missing journey/content contracts.

## 1. Current Level Model

`src/repositories/levels.ts` defines `LevelDoc` and `DEFAULT_LEVELS` for three
age bands (`4-5`, `6-7`, `8-9`) and five levels per band. Each level has a
shared config shape: `maxOperand`, `pieceCount`, `targets`, `tolerance`, and
`rounds`. MongoDB `levels` documents override defaults when present.

The learner document in `src/repositories/learners.ts` has one global
`level: 1..5`, not a per-track or per-game level. `setLearnerLevel` clamps to
1..5. This is the existing authoritative learner progression field.

## 2. Current Game Model

`src/games/registry.ts` exposes five active games:

- `addition` — Number Adventure
- `subtraction` — Fly Away
- `clean-up` — Clean Up
- `puzzle` — Picture Puzzle
- `sketch` — Shadow Sketch

The game definitions use deterministic validation, but the local math
generators currently seed from `Date.now()` and accept only gameplay difficulty
1..3. The Phaser scenes consume pooled or local rounds through each game page.

## 3. Current Difficulty Model

`src/lib/difficulty.ts` maps only:

```text
1 <-> easy
2 <-> medium
3 <-> hard
```

The content API clamps all requested levels to 1..3. Levels 4 and 5 therefore
collapse onto `hard`; their configured `maxOperand` values are not used by the
math content endpoint. `DEFAULT_LEVELS` contains meaningful values through
level 5, but the gameplay path does not consume them.

## 4. Current Content Generation

`GET /api/games/[gameId]/content`:

1. Converts the numeric request to difficulty `easy|medium|hard`.
2. Calls `getActiveContent(gameId, difficulty, limit)`.
3. If content exists, returns the first records from the repository.
4. If empty, requests an asynchronous refill and generates a deterministic
   server fallback using a `Date.now()` seed.

The client hook `src/lib/useGameRounds.ts` fetches exactly the requested number,
maps them, then shuffles that same set for the browser window. It does not
exclude content recently shown to the learner and does not send learner or
history context to the server.

## 5. Current Content Pool

`scripts/seed.mjs` creates 100 addition and 100 subtraction records for easy,
plus a smaller medium/hard copy set. The seed is the confirmed primary source
of repetition:

- Addition uses `a = 1 + ((i * 3 + 1) % 5)` and
  `b = 1 + ((i * 5 + 2) % 5)`. Since `i * 5 % 5` is always zero, `b` is
  always `3`; the 100 records contain only five unique `(a,b)` questions.
- Subtraction uses a small range and a deterministic formula that produces
  fewer meaningful combinations than the pool count suggests.
- Pool reads sort by `createdAt: 1`, so every request receives the same oldest
  records. `useGameRounds` only changes their presentation order.

Scene pools have more variation, but the API also returns the oldest fixed
slice and has no learner-specific recent-content exclusion.

## 6. Current Randomization

There are three separate mechanisms:

- `getActiveContent` uses stable creation order, not randomized selection.
- `useGameRounds` performs a per-window deterministic shuffle after selection.
- local fallback uses a time-derived seed and then shuffles locally.

The second mechanism cannot fix a repeated selected set. It only changes order.
There is no server-side recent-content window, no usage-aware rotation, and no
learner history passed to content selection.

## 7. Current Progress Calculation

`addLearnerStars` increments `gameProgress.<gameId>.completions` and updates
`bestAccuracy`; it increments interest and total stars. It does not update
`lastLevel`, store level-specific completion evidence, or record a completion
against a track/level.

The progress POST endpoint accepts `gameId`, `accuracy`, optional stars, and an
optional sticker. It trusts the submitted accuracy for promotion decisions;
the repository has no server-issued completion/scoring token yet. This is an
existing documented future gap and must not be widened by this task.

## 8. Current Promotion Rules

`src/services/levelService.ts` promotes the learner globally when the selected
game has at least three completions and the current submitted accuracy is at
least 0.8. It checks that the next age-band level config exists, increments by
exactly one, and caps at level 5.

The current rule is deterministic and should remain authoritative. The gap is
that promotion is not tied to a named track/game level and the endpoint does
not expose a journey state. `lastLevel` is never populated by the progress
write path.

## 9. Current Learner Plan

`src/services/personalizationService.ts` scores all five games using interest,
need, and variety. The plan returns five unique games, all at the learner's
single global level. AI can mark the source as `ai-assisted`, but cannot change
ordering or level.

`GET /api/learners/:learnerId/plan` serves the newest stored plan and otherwise
builds one. The plan is useful for recommendations but is not a progression
model: it has no tracks, objectives, completion states, prerequisites, or next
level.

## 10. Current Game Shuffling

`/play` shuffles the five game cards per browser window using `shuffledForWindow`.
This is intentional window-level variety and should remain. It is not a
learning-plan or prerequisite-aware session sequence. `GamePlan` lists the
personalized games separately, but all items link directly to `/play/:gameId`
and there is no level-access check.

## 11. Current Home Screen

`src/app/play/page.tsx` shows greeting, stars, a compact `LevelProgress`,
`GamePlan`, stickers, and the five game cards. `LevelProgress` renders a row of
numbers with `i + 1 <= level` marked as complete; it does not distinguish
completed/current/locked states or show a track journey. The child can choose
any displayed game regardless of current level.

There is no `/api/learner/journey` equivalent and no dedicated journey
component. This is the primary UX gap described by the task.

## 12. Current Stitch Implementation

The repository documents Stitch project `1495487808742926612` and the child
home screen `94140a548156490da36a7ea50609708c`. The local implementation uses
existing `GameCard`, `Button`, `Card`-style utility classes, Tailwind tokens,
and the child-home composition in `src/app/play/page.tsx`.

The requested journey screens/design-system IDs are not present in the local
Stitch screen inventory, and no Stitch MCP tool is available in this runtime.
Therefore visual changes must follow `docs/UI_UX.md`, `docs/STITCH_INSTRUCTIONS.md`,
and existing components rather than inventing unavailable Stitch output.

## 13. Existing APIs

Relevant existing routes:

- `GET /api/games/:gameId/content?difficulty=&limit=` — pooled/fallback content
- `GET /api/learners/:learnerId` — learner document
- `GET|POST /api/learners/:learnerId/plan` — personalized plan
- `POST /api/learners/:learnerId/progress` — stars, game progress, promotion
- `GET /api/levels` and admin levels routes — level configuration
- event batch/sync routes — append-only gameplay telemetry

No route currently returns track/level state or enforces access to a requested
level. The minimal addition is a journey read route plus a server-side access
guard used by the progression/content path, while preserving current routes.

## 14. Existing Database Collections

Relevant collections are `learners`, `levels`, `content`, `learningPlans`,
`gameEvents`, `games`, and `difficultyRules`. Existing indexes support content
by game/difficulty/status/createdAt and learner/level reads.

There is no `learningTracks` collection and no level-completion collection.
Creating both would duplicate configuration/progress unnecessarily for the
current five-game MVP. Track metadata can be deterministic application
configuration; learner state can be extended in the existing `learners`
document with a backward-compatible optional per-track progress map.

## 15. Existing Tests

Unit tests use Node's test runner and cover adaptive rules, pool validation,
education gateway behavior, rate limiting, sketch content, and sketch
evaluation. Playwright covers landing, setup, play home, game loading, parent,
admin, canvas boot, and sketch drawing across four viewports.

Missing coverage:

- seed uniqueness and pool rotation;
- recent-content exclusion;
- level 4/5 configuration reaching gameplay;
- server-authoritative locked-level access;
- journey state and multiple tracks;
- learner isolation and parent journey visibility;
- progression-to-next-level end-to-end flow.

## 16. Problems Discovered

1. **Confirmed repetition root cause:** seed addition records repeat the same
   five questions because `b` is constant; the API then returns the oldest
   fixed slice on every request.
2. **Answer choices are not consistently rotated at the pool boundary:** seeded
   options are generated in a stable order and server selection is stable.
3. **Level/config drift:** five configured levels are reduced to three content
   difficulties; levels 4 and 5 do not reach their configured ranges.
4. **Progress granularity gap:** one global learner level is promoted from any
   game; no track/game-level completion state exists.
5. **Authorization gap:** the UI can display a level but no server endpoint
   rejects an arbitrary future level because level selection is not an API
   concept yet.
6. **Journey UI gap:** current home is a flat game list plus numeric progress;
   it lacks completed/current/locked states, track grouping, and next-action
   emphasis.
7. **Plan freshness gap:** the plan route returns the newest stored plan even
   after progress changes; POST is needed to rebuild, but the child home only
   performs GET.

## 17. Recommended Minimal Changes

1. Add deterministic, level-aware content selection helpers in the existing
   content repository/API. Use a request seed plus learner/history context when
   available; select from a larger candidate window, exclude recent content,
   and fall back only when necessary.
2. Fix seed generation to produce genuinely distinct validated math records and
   rotate answer options deterministically. Preserve `ContentDocSchema` and
   pool validators.
3. Add a level-to-config resolver for all five configured levels instead of
   clamping the content API to difficulty 1..3. Preserve `easy|medium|hard`
   storage compatibility by deriving ranges from the level config.
4. Add deterministic track metadata derived from the existing games:
   `numbers` (addition, subtraction), `creative` (sketch), and `visual`
   (clean-up, puzzle). Do not create a collection until admin-authored track
   configuration is actually required.
5. Extend learner progress with optional per-game level completion evidence and
   expose a journey read model. Keep the existing global promotion rule as the
   first MVP unlock authority; do not let client status unlock content.
6. Add a shared server guard for requested level access and use it from any new
   journey/content request. Existing direct game URLs continue to work at the
   learner's current level, but future-level requests must be rejected.
7. Replace `LevelProgress` with a child-friendly journey component that reuses
   current tokens/components and clearly labels completed/current/locked.
8. Rebuild the plan after progress changes or make the plan read path freshness
   aware; personalization remains advisory and cannot override unlock rules.
9. Add focused unit/API/Playwright tests before broad visual refinement.

## 18. Must Not Change

- deterministic answer validation and reward logic;
- PersonalizationService's advisory-only contract;
- existing API envelope and authentication boundaries;
- anonymous learner model;
- existing game registry or Phaser architecture;
- MCP dependency behavior: gameplay must remain independent of MCP latency;
- unrelated user changes currently present in `.env.example` and `opencode.json`.

## 19. Implementation Result

The confirmed gaps were addressed without replacing the existing learner,
content, personalization, or game systems:

- content selection now rotates a deterministic server candidate window,
  excludes recent IDs when possible, and suppresses duplicate problem
  identities;
- the seed now varies both operands and tags five curriculum levels; levels
  4-5 require tagged content and otherwise use validated level-configured
  fallback rather than reusing legacy hard content;
- answer options are deterministically rotated while preserving one correct
  answer;
- `GET /api/learners/:learnerId/journey` exposes three game-derived tracks and
  completed/current/locked states;
- game-content requests enforce future-level access server-side and the child
  UI shows a friendly locked state;
- the child home and parent progress surfaces now show the learning journey;
- stored plans are rebuilt when their level is stale;
- 104 unit tests and 84 Playwright tests pass; typecheck, lint, build, and
  Docker validation pass.
