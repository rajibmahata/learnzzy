# Sketch White Canvas + Docker — Root Cause Report

Only confirmed causes are documented here. No speculation.

## 1. Symptom

`/play/sketch` (and, as discovered, all five games) rendered page UI but no
Phaser canvas in production builds (local `next start` and Docker alike).
The stage container appeared as an empty white box; no console errors, no
failed requests. Separately, admin login returned 401 in Docker.

## 2. Reproduction

- Playwright (system Chrome, desktop): `/play/sketch` → `canvasCount: 0`,
  container 828×483, WebGL available, zero console/page/network errors.
- Extended to all games: `addition/subtraction/clean-up/puzzle/sketch` all
  `canvasCount: 0` in production builds.
- Local prod build (`next start -p 3001`) reproduced identically → **not
  Docker-specific**.
- Phaser chunk `8f005c66.9917a48d15f6bbd3.js` requested, HTTP 200,
  1.39 MB, valid JS → import path healthy.

## 3. Root cause (sketch/white canvas)

`src/games/phaser/usePhaserGame.ts` called `scene.events.once("create", …)`
on a freshly constructed scene, **before** `new Phaser.Game()`.
In Phaser 3.80 the scene's `events` emitter is attached by the SceneManager
**during boot**, so it is `undefined` on a bare-constructed scene:

```text
TypeError: Cannot read properties of undefined (reading 'once')
```

The surrounding `.catch(() => {})` swallowed the exception silently, so the
game object was never created for ANY game — a total engine outage with zero
console output. Existing e2e only clicked DOM buttons, so nothing caught it.

## 4. Evidence

- Instrumented catch → exact `TypeError` above, then canvas appears after fix:
  `canvasCount: 1` for all five games (Docker + local prod).
- Chunk 200/valid-JS ruled out asset/build causes; identical local/Docker
  behavior ruled out Docker causes (network, volumes, env, MIME, CSP).

## 5. Local behavior

Same failure on local `next start`. (`npm run dev` was never proven working;
the "works outside Docker" impression came from DOM UI rendering, not from a
verified canvas.)

## 6. Docker behavior

No Docker-specific defect found: identical chunk set in image and local
`.next`, `/app/node_modules/phaser` present, assets served 200 with correct
MIME. Docker rebuilt + verified healthy post-fix.

## 7. MCP behavior

No tutor-mcp/oer-mcp/ncert-mcp containers exist in this environment; all
provider flags are `false`. The sketch game uses **no MCP, no image URL, no
S3**: its "diagram" is a Phaser vector guide rendered from validated pool
content (`guidePath`), and drawing/evaluation are fully local and
deterministic. Complete functionality verified with zero MCP involvement —
fallback holds by construction.

## 8. Asset behavior

No remote images involved. Static game assets (`/assets/*.svg`, icons) verified
200 inside Docker. The reported "missing image" was the absent canvas, not a
missing file.

## 9. Exact files responsible

- `src/games/phaser/usePhaserGame.ts` — pre-boot `scene.events.once` (crash)
  + silent `.catch` (invisibility). Fixed: readiness via Game `'ready'` event;
  catch now `console.warn`s.
- No scene files changed for the boot fix (all five healed by the one hook).

## 10. Fix

1. `usePhaserGame`: create `Game` first, resolve `ready` on `game.events`
   `'ready'` (fires after boot + scene `create()`), warn on failure.
2. Sketch color picker (task requirement, was missing): `setInkColor` on the
   scene API (cosmetic only; evaluation untouched) + 5-button crayon row
   (44px+, `aria-pressed`) in `SketchPlay`.
3. Import extensions (`./framework.ts` etc. in 3 game files) so node
   type-stripping can execute real sketch code in unit tests (tsconfig already
   allowed it; webpack/Next unaffected).
4. `scripts/write-env.mjs` (local-only helper, kept): rebuilds gitignored
   `.env` safely after shell-quoting corrupted it twice.

Secondary, found during Docker validation:
5. Password-hash delimiter `$` → `:` (`admin-auth`, `parent-auth`,
   `admin-setup.mjs`, docs) because compose dotenv AND Next dotenv-expand
   interpolate `$VAR` inside env values, silently corrupting `scrypt$…$…`
   hashes (this was the Docker admin-login 401; proven by the
   `"learnzzy" variable is not set` warning).

## 11. Why the fix works

Readiness now uses an event that can only fire after the engine it reports
on exists. The warn preserves graceful DOM fallback while making any future
boot failure visible in one console line. Color is render-state only and
cannot affect scoring/progression. `:` delimiters contain no
interpolation-sensitive characters in any shell, dotenv, or JS template.

## 12. Regression risks

- `game.events 'ready'` timing: verified across 5 games × 4 viewports;
  `showGuide`/API calls happen strictly after `ready`.
- Hash format change invalidates any previously issued admin/parent password
  hashes (none in production; dev smoke accounts re-created).
- Import-extension edits: typecheck/lint/build green; Next resolves them.

## 13. Tests performed

- Unit 97/97 (new `sketch-def.test.ts`: schema/determinism/variance/bounds).
- e2e 76/76: new `canvas.spec.ts` (all games boot exactly one non-collapsed
  canvas — guards this exact outage) + `sketch.spec.ts` (guide visible →
  color select → mouse draw → Done → feedback + screenshot).
- Docker: rebuilt image, all services healthy, canvases + sketch flow +
  admin login + pairing chain verified live against containers.
- MCP fallback: entire suite green with zero MCP containers and all flags off.
