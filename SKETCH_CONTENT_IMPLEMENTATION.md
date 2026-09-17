# SKETCH Content Implementation — Visual Learning Enhancement

**Date:** 2026-09-16 · **Author:** principal engineer · **Status:** implemented + verified
Companion: `SKETCH_CONTENT_ASSESSMENT.md` (pre-implementation assessment).

## 1. Existing architecture (reused, not duplicated)

Single content model (`ContentDoc`), single pool system with server-side
recent-exclusion + per-window shuffling, single level system (1–5 + age bands),
single journey (`creative` track owns sketch), deterministic
`PersonalizationService` (game-level only), existing agents
(content/quality/asset), fail-closed education gateway, single Phaser
`sketchScene` stroke pipeline. No second database, randomizer, level, or asset
system was created.

## 2. Existing Sketch implementation

4 shapes, hardcoded `TRACE THE {shape}` heading, no hints, seed held 30
circle/square-only docs, fallback drew from the same 4-shape pool.

## 3. Root cause of poor/repetitive content

Library poverty (4 shapes; 2 seeded) + fallback sharing the same pool + zero
instruction/hint/task metadata to differentiate activities. The
anti-repeat machinery (recent exclusion, window shuffling, level lock) was
already correct and is reused unchanged.

## 4. Content changes (`src/games/sketch.ts`)

- `SketchDef` extended with **optional** `taskType` (`trace|dots|pattern`),
  `instruction` (≤80), `hint` (≤160) — every legacy pool item still validates.
- 20 diagram generators (point sets in 0–100 space, all bounds/length checked):
  shapes → objects (sun/tree/flower/balloon/cloud/fish/car) → combos
  (house/rocket/boat/butterfly/kite/robot) → patterns (pattern-triangles,
  dots-star, dots-house) → scenes (landscape, cat).
- `SKETCH_ACTIVITIES`: 23 leveled entries, each with task + short instruction
  + nudge-style hint. `createSketchActivity(seed, level)` is deterministic per
  seed; tolerance tightens by level (14→8), L1 coverage 0.5 else 0.6.
- `createSketchDef` kept byte-compatible for existing callers/tests.

## 5. New diagrams

23 activities (see `SKETCH_ACTIVITIES`): circle, square, triangle, rectangle,
dots-star (L1); sun, tree, flower, balloon, cloud, fish, car (L2); house,
rocket, boat, butterfly, kite, robot (L3); pattern-triangles, dots-house,
star (L4); landscape, cat (L5).

## 6. New task types

`trace` (full path), `dots` (sparse connect-the-dots waypoints), `pattern`
(repeating motif) — exactly what the canvas supports mechanically. Enum is
validated in pool-client + quality gate; extensible without migration.

## 7. Instruction system

Content-driven (`sketch.instruction`, fallback `TRACE THE {shape}`);
addition/subtraction use deterministic `addInstruction`/`subInstruction`
(sum-rotated templates). Always short, imperative, age-appropriate.

## 8. Hint system

`[? Hint]` tactile button (56px+, Stitch tokens) → dismissible `role="dialog"`
panel ("Got it!" / aria "Close hint"). Sketch hints come from content;
math hints derive from operands (`Start at 4 and count 3 more.`). Opening a
hint emits the (previously orphaned) `hint_used` event with contentId.
Hints nudge; they never reveal answers (asserted in tests).

## 9. Addition changes

No pool/model change needed (generators + 100-seed variety already exist):
added derived rotating instructions + operand-specific hints + hint UI.
`./framework` imports made explicit (`.ts`) to match sketch/cleanup precedent
and allow real-code unit tests under node type-stripping.

## 10. Subtraction changes

Same pattern: `subInstruction`/`subHint` (non-negative-safe copy) + hint UI.
`start - removed` authority untouched.

## 11. Level changes

Sketch docs now carry `level` (1–5); tolerance/coverage scale by level;
content API `level` filter + `LEVEL_LOCKED` enforcement apply unchanged;
journey `creative` track shows current/playable/locked as before. No level
system was duplicated.

## 12. Personalization integration

Unchanged by design: planner recommends game+level; activity variety comes
from the enlarged pool + recent-exclusion + window shuffle. Deterministic
rules stay authoritative; AI remains advisory-only.

## 13. MCP integration

Unchanged: Tutor/OER/NCERT gateway stays fail-closed mocks (disabled by
default); OER grounding path for the content agent untouched. No MCP call
exists in stroke/answer paths (verified). Compose runs web/mongo/redis only —
there are no MCP containers to stop, so "MCP failure" is the default state
and gameplay is proven independent of it.

## 14. Asset pipeline

Sketch remains vector-only (no URLs, no CORS/storage failure modes);
addition/subtraction keep local SVG sprites via `load.svg`. Asset Agent
untouched (raster generation stays `pending` by design).

## 15. Docker behavior

- `scripts/seed.mjs`: sketch section rewritten (23 leveled activities +
  guides + copy + `level` field); seed → 69 active sketch docs / 23 shapes;
  30 legacy ID-only-duplicate circle/square docs deleted from the pool.
- `docker compose build web` + `up -d web` (mongo/redis + volumes untouched);
  API variety verified live (12 distinct activities across 5 seeded requests).

## 16. Tests

- Unit 115/115: extended `sketch-def` (all catalog guides valid/in-bounds,
  task+instruction+hint per level, determinism, tolerance gradient, copy
  rejection), `pool-client` (copy passthrough + legacy compat + rejection),
  new `game-copy` (real math copy derivation, no answer leak).
- E2E (mobile-320, against container): canvas 5/5, child 8/8 (new addition +
  subtraction hint tests), sketch 2/2 (new instruction + hint open/close test).
- White-canvas guards still green; hint dialog uses `role="dialog"` + labels;
  touch targets ≥56px; `aria-pressed` on crayons preserved.

## 17. Stitch validation

Applied Playful Wonder tokens from `docs/.../design-system.md` (tactile
`? Hint` pill, `safe-panel` dialog, primary bevel CTA). No sketch-dedicated
Stitch screen exists; intent sourced from child-home card + tokens (live MCP
unavailable; parent-journey screenshot still expired — HTML reference only).
