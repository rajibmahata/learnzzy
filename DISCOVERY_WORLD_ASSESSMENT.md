# Discovery World Assessment — Adaptive Learning + New Games

**Date:** 2026-09-16 · **Status:** assessment (pre-implementation)
**Rule:** repository is technical truth; Stitch is visual truth. No rewrites, no duplicates.

## 1. What already exists (reuse, don't rebuild)

| Need | Existing owner | Reuse plan |
|---|---|---|
| Per-skill levels 1–5 | `gameLevels` + `src/lib/skillLevels.ts` (evaluate/decide, rolling last-5, +1/-1, floor/ceiling) | New game plugs in; no engine change |
| Structured results | `recordGameResult` (completions, best, rolling window, hints, stars, lastResult) | Discover reports through it |
| Content anti-repeat | server recent-exclusion + per-window shuffle + `LEVEL_LOCKED` | Discover catalog uses window shuffle + localStorage recent list |
| Game sequencing | `PersonalizationService.buildPlan` (interest+need+variety, deterministic) | Generalize length check 5→`GAMES.length`; discover joins automatically |
| Journey | `learningJourney.ts` tracks (numbers/creative/visual), global unlock | Add `discover` to creative track gameIds |
| Concept model | `src/lib/concepts.ts` (stable ids, games mapping, planner bridge) | Add `discover` mapping + discovery concept ids |
| Parent visibility | ChildSummary (skills/trends/lastResult/strengths) + progress/activity/learning pages | Skills API already renders any played game; extend concepts with discovery counts |
| Rewards/stickers | `useRewards` + per-game pools with `??` fallback | Add discover pool entry (fallback would cover, explicit is clearer) |
| Agent pipeline | content/quality/asset/analytics/difficulty/personalization/QA | No change needed for v1 (deterministic catalog) |
| MCP gateway | fail-closed Tutor/OER/NCERT mocks | Advisory-only; gameplay never waits |
| UI primitives | GameShell/Header/Card/AnswerButton/Celebration/Button, Playful Wonder tokens | Discover screens compose these |
| Regression guards | 125 unit + 25 mobile e2e incl. canvas/correctness specs | Extend, don't replace |

## 2. Gaps (honest)

1. **No knowledge taxonomy** — no animals/colors/shapes data anywhere.
2. **No concept mastery store** — insights derive concepts from game aggregates only.
3. **No discovery mechanic** — 5 games, all skill-drill; nothing LEARN→RECALL.
4. **No audio/i18n** — only `locale` passthrough on sessions; `<html lang="en">`.
5. **Planner length hardcoded to 5** (`validated.length !== 5`), journey test pins 3 tracks / 5 gameIds, adaptive mirror pins 5.
6. **"Edison"** appears nowhere in code (e2e comment only) — treated as Stitch-side naming, no action.

## 3. Out of scope for this pass (documented)

- Raster/licensed photo assets (copyright + storage + CORS risk) → emoji visuals (offline, consistent, already the app's visual language for deco).
- Full hi/bn/ta/te translation of ~70 concepts → schema is locale-ready with EN complete + fallback; translation is content-pipeline work.
- Missing-number/borrowing/word-problem operators, erase/undo, per-activity AI recommendation, dedicated Daily Adventure UI (data hook provided), physical-device QA.

## 4. Implementation plan (this turn)

1. `src/lib/knowledge.ts` (new, dependency-free): categories (10), ~70 concepts `{id, category, en, emoji, fact, level({1,2,3} bands), tags}`, locale names type + `conceptName(c, locale)` fallback, mastery machine (`new→learning→practicing→mastered→needs_review` from exposures/recognitions), category rollups, `buildDailyAdventure()` from plan + catalog, deterministic pick helpers (seeded, recent-avoiding).
2. `src/lib/audio.ts` (new): guarded `speak()` via `speechSynthesis` (on-device, never network), `audioAvailable()`.
3. Learner model: `conceptMastery` record + repo `recordConceptSignal(conceptId, kind)`; wire into discover flow.
4. Game id `discover`: registry entry, `SKILL_GAMES` + display, `CONTENT_POOLS` entry, content-API allowlist, rewards pool, `conceptsForGame` mapping, creative-track gameIds, planner length generalization + mirror/test updates.
5. Route `/play/discover` (`DiscoverPlay`): LEARN card (emoji, name, speak, fact, NEXT) → RECOGNIZE quiz (image + 3 names) → FIND/MATCH (name → 4 emojis incl. count variant) → results via `recordGameResult` path (progress API), concept signals recorded, Celebration + rewards. Uses pool of catalog picks (seeded per window + recent list), NOT Math.random gameplay logic.
6. Parent: discovery counts (`learned/mastered/needsReview/total`) into ChildSummary + learning page card; skills surface discover automatically.
7. Tests: knowledge unit (taxonomy/mastery/i18n/adventure/rotation), e2e discover journey (learn→hear?→recognize→match→complete→parent sees), planner/journey mirror updates.
8. Docker: rebuild + redeploy web, seed not needed (no pool rows), run e2e vs container, verify MCP-less operation.
