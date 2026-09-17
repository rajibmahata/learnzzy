# SKETCH Content Assessment — Visual Learning Enhancement

**Date:** 2026-09-16 · **Author:** principal engineer · **Status:** assessment (pre-implementation)
**Rule:** repository is the technical source of truth; Stitch is the visual source of truth.

## 1. Current Sketch architecture

- Definition: `src/games/sketch.ts` — `SketchDefSchema { shape (1–30 chars), guidePath (8–200 pts, 0–100 space), tolerance (3–20), coverageThreshold (0.3–0.9) }`.
- Shapes: exactly 4 (`circle`, `square`, `triangle`, `star`); difficulty gates the pool (L1: circle/square; L2: +triangle; L3: all 4).
- No task types, no instructions, no hints, no learning objectives in the model. UI hardcodes `TRACE THE {shape}`.
- Flow: `SketchPlay.tsx` → `useGameRounds<SketchDef>` (pool-first, 5 rounds, recent-content exclusion, deterministic local fallback) → `SketchStage` (Phaser) → `evaluateTracing` (deterministic geometry) → rewards/progress/events → `Celebration`.
- Evaluation (`src/games/sketch-eval.ts`): guide-point coverage within tolerance; forgiving by design (BR-072); dependency-free and unit-tested.

## 2. Current canvas architecture

- `src/games/phaser/sketchScene.ts`: pointer events (mouse/touch/stylus), ink layer (depth 5) above guide layer (depth 1), dotted guide rendering, `getDrawing()` returns strokes in 0–100 guide space, `setInkColor` (cosmetic only), `clear()` keeps guide.
- `SketchStage.tsx`: `aria-label="Trace the {shape}. Drawing canvas."`, 720×420 aspect box, DOM fallback when not booted, API calls gated on `booted` (post-`removeChild` fix).
- Controls in `SketchPlay`: 5-crayon color row (44px+, `aria-pressed`), Clear, Done ✓, `aria-live` feedback. No erase/undo (Clear covers it; undo deferred, not required).
- No MCP/AI call exists in the stroke path. Verified by code inspection (no network in scene).

## 3. Current asset pipeline

- Sketch uses **zero image URLs**: guides are vectors (`guidePath`) rendered by Phaser. There is no remote diagram to 404 — the historic white canvas was engine boot, not assets (guarded by `e2e/canvas.spec.ts` + `sketch.spec.ts`).
- Local SVGs (`/assets/apple.svg`, `/assets/bird.svg`) serve addition/subtraction via `load.svg` with explicit raster size; cached by `sw.js`.
- `Asset Agent` (`src/agents/asset.ts`): metadata registry, reuse-first, hash dedupe, binary generation recorded as `pending` (no image provider wired). No S3/CDN integration exists in `src/` (verified by search). Binaries stay out of MongoDB per DEC-041.
- Implication: sketch "diagrams" should remain vector guide-paths (offline-capable, deterministic, zero CORS/storage failure modes). No agent-generated raster images for sketch in v1.

## 4. Current content schema

- `ContentDoc` (`src/lib/content.ts`): contentId/gameId/difficulty/level(1–5 optional)/contentType/status/version/source/validation/payload/assetIds/tags/usage. Lifecycle draft→validating→approved→active; only `active` playable.
- Scene games store the whole definition in `payload`; the content API returns `question: payload` for clean-up/puzzle/sketch.
- Client validators (`src/lib/pool-client.ts:toSketchContent`): shape/guide/tolerance/coverage only. Quality gate (`src/agents/quality.ts` sketch branch): guide length only + safety sweep + exact-dupe check.
- Seed (`scripts/seed.mjs:sketchDocs`): 30 docs, **circle/square only**, tolerance 9, no levels, no instructions/hints; mirrored to medium/hard by the existing mirror loop.

## 5. Current game API

- `GET /api/games/[gameId]/content`: pool-first (`getActiveContent`, status=active, seed + recentIds exclusion), level lock (`403 LEVEL_LOCKED` via `isLevelUnlocked`), deterministic fallback (`createSketchDef`), async refill trigger. `correctAnswer` intentionally omitted from math responses (BR-022).
- Sketch fallback: `sceneFallback` → `createSketchDef(seed, lvl)` — same 4-shape pool (repetition root cause #1).
- Events: `drawing_started/completed` (coverage, strokes, duration, shape), `retry_started`, `hint_used` (schema-accepted, never emitted by any UI — gap).

## 6. Current level system

- Global learner level 1–5; 15 level configs (`levels` collection, seeded): per age band (4-5/6-7/8-9) with maxOperand/pieceCount/targets/tolerance/rounds.
- Journey tracks (`src/lib/learningJourney.ts`): numbers (addition/subtraction), **creative (sketch)**, visual (clean-up/puzzle); current/playable/locked; server enforces via `isLevelUnlocked` in content API.
- Sketch ignores per-level tolerance config (hardcodes 9/7/0.6); seed ignores `level` for sketch. Gap.

## 7. Current personalization

- `PersonalizationService.buildPlan`: deterministic **game-level** sequencing (interest + need + variety, seeded jitter, AI advisory only). No per-activity/task-type recommendation. Plans carry gameId+level, never contentIds.
- Sketch activities therefore cannot be personalized beyond "play sketch at level N" — sufficient for v1; per-activity recommendation stays out (deterministic rules authoritative).

## 8. Current asset generation

- None for sketch (by design — vectors). Asset Agent handles metadata for future raster needs; extending it with sketch raster types is explicitly out of scope for v1 (would add storage/CORS failure modes with no pedagogical need).

## 9. Current drawing implementation

- Immediate pointer pipeline, color select, clear, submit; evaluation local and instant. Missing: erase/undo (Clear suffices), hint affordance, instruction variety. No changes needed to the stroke pipeline.

## 10. Current content repetition behavior

Root causes of "same diagram":
1. Only 4 shapes exist; seed holds just circle/square (30 near-identical docs).
2. Fallback generator draws from the same 4-shape pool.
3. No instruction/hint/task metadata to differentiate activities.
- Anti-repeat machinery itself is sound and reused as-is: server recent-exclusion (`selectWithRecentExclusion`), per-window shuffling (`useGameRounds` + `windowSeed`), `LEVEL_LOCKED` gating. Frontend must NOT add another randomizer.

## 11. Current tests

- Unit (106): `sketch-def` (schema/determinism/variance/bounds), `sketch-eval` (completion/partial/tolerance), `pool-client` (validators incl. sketch), `adaptive`, `education-gateway`, `learning-progress`, `content`, `math`, `phaser-layout`, `rate-limit`.
- E2E: `canvas.spec` (all games boot exactly one canvas), `sketch.spec` (guide → color → draw → Done → feedback), `child/admin/parent/learning-journey` specs.
- Gaps: no multi-shape library test, no instruction/hint tests, no recent-avoidance test for sketch, no hint-open e2e.

## 12. Current Stitch design

- Sources on disk: `docs/stitch_learnzzy_educational_kids_playground/` (child-home, learner-setup, parent-journey, admin ×3, brand logo, `design-system.md` "Playful Wonder"). No sketch-dedicated screen; sketch visual intent comes from the child-home sketch card + design tokens (tactile bevels, 56px+ targets, warm cream, pill geometry, `Plus Jakarta Sans`).
- Live Stitch MCP is unavailable in this environment (established); do not claim live-fetched parity. Parent-journey screenshot URL expired (HTTP 400) — HTML reference only.

## 13. Gaps (prioritized)

1. **P0 — Sketch library poverty:** 4 shapes; seed has 2. Same diagram repeats.
2. **P0 — No instruction/hint model or UI** (all games; `hint_used` event orphaned).
3. **P1 — Task-type monotony:** everything is free trace; no dots/pattern/complete variants.
4. **P1 — Level-blind sketch:** tolerance/level config exists but unused; seed has no levels.
5. **P1 — Addition/Subtraction copy monotony:** generators vary, but per-round instruction/hint text is static.
6. **P2 — "Edison":** name appears only in `e2e/sketch.spec.ts` comment; no repo presence (likely Stitch mascot naming). No action except documenting.
7. **Out of scope (documented, not gaps):** raster/MCP-generated diagrams, S3/CDN, erase/undo, per-activity AI recommendation, live MCP containers (compose runs web/mongo/redis only; gateway is fail-closed mocks).

## 14. Recommended implementation

1. Extend `SketchDef` with optional `taskType` (`trace|dots|pattern`), `instruction` (≤80), `hint` (≤160) — backward compatible; thread through `toSketchContent`, quality gate, content-agent `deterministicBatch`, and seed. Mechanics stay "trace this path" (what the canvas supports); pedagogy varies.
2. Add deterministic guide generators per level band (L1 shapes → L2 objects → L3 combos → L4 patterns/symmetry → L5 scenes) as point sets; seed ~50 meaningfully distinct docs with level + instruction + hint + tags.
3. `SketchPlay`: instruction from content (fallback `TRACE THE {shape}`), `[? Hint]` tactile button + dismissible panel (Stitch tokens), `hint_used` event on open, `aria` labels throughout.
4. Addition/Subtraction: deterministic `instructionFor`/`hintFor` pure functions of operands (template rotates by sum) + same `[? Hint]` affordance + `hint_used` events. No pool/model change.
5. Tests: extend `sketch-def` (new shapes/tasks/instructions), pool-client sketch passthrough, hint/instruction unit tests, e2e hint-open + instruction-visible on sketch/addition/subtraction, Docker seed + canvas-nonwhite verification.
6. Validate: lint/typecheck/unit → seed compose mongo → content-API variety check → Playwright → document in `SKETCH_CONTENT_IMPLEMENTATION.md`.
