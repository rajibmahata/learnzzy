# Learnzzy — Next Session

**Document:** Development Session Handoff  
**Version:** 1.0  
**Status:** Active / Living Handoff  
**Last Updated:** 2026-09-13

---

## 1. Purpose

This document defines what the next development session should understand and do before making implementation changes.

It is intentionally short and operational.

It should be updated at the end of each meaningful development session.

---

# 2. Current Project Context

Learnzzy is a child-focused educational games PWA.

MVP games:

```text
Addition / Numbers
Subtraction / Fly Away
Clean Up
Picture Puzzle
Shadow Sketch
```

Architecture:

```text
Next.js + TypeScript
Phaser 3
Tailwind + UI Library
MongoDB
Redis + BullMQ
GPT-5 nano/mini through AI abstraction
S3-compatible object storage
Cloudflare/CDN
Docker + Nginx + VPS
Sentry + structured logs
```

---

# 3. Most Important Rules Before Coding

Read these first:

```text
DECISIONS.md
BUSINESS_RULES.md
ARCHITECTURE.md
FEATURE_INDEX.md
BACKLOG.md
```

For the specific area being changed, also read:

```text
DATABASE.md
API.md
UI_UX.md
UI.md
UI_LIBRARY.md
AGENTIC_IMPLEMENTATION_PLAN.md
DEPLOYMENT.md
```

---

# 4. Current Product Direction

The child experience must remain:

```text
Fast
Simple
Visual
Positive
Deterministic
Safe
```

AI/agents remain:

```text
Background
Asynchronous
Validated
Observable
Cost-controlled
Least-privilege
```

---

# 5. Immediate Development Sequence

Unless the user explicitly changes priorities, continue in dependency order:

```text
1. Foundation
2. UI Library + PWA
3. Game Framework
4. Five Games
5. Sessions + Events
6. MongoDB Data Layer
7. Content Pools
8. AI Service
9. Agent Infrastructure
10. Content Agent
11. Quality/Safety Agent
12. Asset Agent
13. Admin Authentication
14. Admin Dashboard
15. Agent Command Center
16. Analytics
17. Difficulty Agent
18. Security + Privacy
19. Performance
20. Testing + QA
21. Deployment
```

Do not randomly jump between unrelated areas.

## Current Implementation Snapshot

The five-game MVP, Mongo content pool, AI abstraction, seven agents (content, quality, asset, analytics, difficulty, personalization, QA), retryable queue, admin authentication, admin command center, analytics endpoints, pool refill triggers, Docker Compose, and Nginx example are implemented. The adaptive personalized-learning layer is implemented: learner profiles with optional nickname + age band (4-5/6-7/8-9), 15 seeded level configs, server progress/promotion (3+ completions at 80%+, max +1 level), server reward mirror, interest signals (educational only), deterministic PersonalizationService with validated learning plans, learner setup (/welcome), level progress, personalized game plan, sticker collection (/stickers), per-window game shuffling, and admin learner-insights/levels/QA/personalization endpoints. The Education Gateway phase is implemented: provider interfaces + allowlisted registry + Tutor/OER/NCERT adapters (live HTTP contracts with deterministic mocks, all disabled by default), stable concept model (`src/lib/concepts.ts`), advisory-only personalization hook (plan order/level never change), OER grounding for the content agent with provenance stamps, 3-tier knowledge cache (Redis/memory -> provider -> Mongo), parent auth + single-use pairing + 10 parent pages + 5 public parent pages + child /link page, admin education diagnostics + dashboard panel, and 37 new gateway/parent/pairing tests. Sentry SDK is wired (inert without DSN; ErrorBoundary reports). Rate limiting is Redis-backed with instant memory fallback. Prod deploy assets exist (`docker-compose.prod.yml` with loopback-only web + log rotation, `deploy/nginx.prod.conf` TLS example, driver-based `npm run backup`, filled QA instructions). Two live-verified resilience fixes: fail-fast Redis clients with 10s negative-result caching (a Redis outage previously hung requests), and `COOKIE_SECURE=false` for local Docker HTTP auth (production stays Secure). Verification: 92 unit tests + 52 Playwright specs (mobile-320/mobile/tablet/desktop on system Chrome) green; typecheck/lint/build clean; Docker stack healthy with seeded pool; full parent pairing chain proven live.

Use `node scripts/admin-setup.mjs <password-min-12-chars>` to generate local admin environment values. Do not commit the resulting values.

Remaining production-readiness work is physical-device QA, server-trusted scoring tokens, S3/CDN asset generation, managed-service deployment validation, and live MCP server deployments (gateway runs deterministic mocks until URLs/keys are configured).

---

# 6. Before Every Major Change

Perform:

```text
1. Read existing implementation.
2. Identify dependencies.
3. Identify affected APIs.
4. Identify affected MongoDB entities.
5. Identify affected UI components.
6. Check existing tests.
7. Check relevant documentation.
8. Check DECISIONS.md for constraints.
9. Check BUSINESS_RULES.md for invariants.
10. Preserve working behavior unless intentionally changing it.
```

---

# 7. Implementation Rules

## Gameplay

Never introduce:

```text
LLM calls per click
Live AI answer validation
AI arithmetic
AI-controlled protected scoring
Browser-authoritative scoring
```

## AI

Use AI only behind server-side abstractions.

All generated content must pass:

```text
Schema
  ↓
Deterministic
  ↓
Quality/Safety
  ↓
Approval
  ↓
Active
```

## Agents

Use:

```text
BullMQ
Redis
Least privilege
Retry
Idempotency
Auditability
```

## Assets

Always reuse suitable approved assets before generating new ones.

---

# 8. Current Documentation State

Recently established:

```text
DECISIONS.md
FEATURE_INDEX.md
KNOWN_ISSUES.md
LEARNING_TEMPLATE.md
MEMORY.md
NEXT_SESSION.md
```

These should remain synchronized with:

```text
BACKLOG.md
BUSINESS_RULES.md
ARCHITECTURE.md
DATABASE.md
API.md
```

---

# 9. What to Verify First in the Next Session

Before implementing new functionality, establish actual implementation status.

Check:

```text
[ ] Repository/project structure
[ ] Current git branch/status
[ ] Existing Next.js application
[ ] Phaser integration
[ ] MongoDB connection
[ ] Redis connection
[ ] BullMQ workers
[ ] Existing PWA setup
[ ] Existing game routes
[ ] Existing game modules
[ ] Existing UI components
[ ] Existing API routes
[ ] Existing tests
[ ] Environment configuration
[ ] Deployment state
```

Do not assume a documented feature has already been implemented.

---

# 10. Recommended First Task

The next session should begin with:

```text
UNDERSTAND
```

Then perform an implementation audit:

```text
Documentation
     +
Actual repository
     ↓
Gap analysis
     ↓
Prioritized implementation plan
```

Compare actual code against:

```text
FEATURE_INDEX.md
BACKLOG.md
BUSINESS_RULES.md
DECISIONS.md
```

Then identify the highest-priority verified gap.

---

# 11. If the User Asks “Continue”

Interpret “continue” as:

1. Read this handoff.
2. Inspect the actual current implementation.
3. Determine what is genuinely complete.
4. Do not trust stale assumptions.
5. Continue from the highest-priority unfinished dependency.
6. Preserve existing working functionality.
7. Test the change.
8. Update documentation.

---

# 12. Completion Requirements

Before declaring a feature done:

```text
Implementation
   ↓
Tests
   ↓
Security
   ↓
Performance
   ↓
UX / Accessibility
   ↓
Documentation
   ↓
Verification
```

A successful build alone is not sufficient.

---

# 13. Session Update Template

At the end of each session, update this section:

## Session 2026-09-13 (5) — Pool-wired plays + device-readiness pass

### Completed
- `src/lib/pool-client.ts`: `fetchPool()` (Zod-shaped) + `toAddition/SubtractionContent()` — pool treated as UNTRUSTED (DEC-071): math recomputed, exactly-one-correct + no-dupe + range + non-negativity enforced; invalid items dropped. Zero `@/` runtime imports so tests import the real TS via node type-stripping.
- `src/lib/useGameRounds.ts`: prefetches `total=5` validated rounds (BR-201), deterministic local top-up/fallback (BR-200/222), `reload()` for replay, cancellation-safe.
- Both plays: pool-first rounds with `contentId` on question/answer events (content analytics, BR-142), friendly `role="status"` loader on SSR/first paint, replay refetches.
- `tests/pool-client.test.ts` executes REAL validators (6 tests: accept-valid, reject wrong/dup/missing-correct/non-integer/BR-040 violations).
- PWA installability fix: manifest referenced `icon-192/512.png` that didn't exist → created square `icon-mark.svg` (rainbow mark, no wordmark — the wide lockup rasterized as cropped "earnz"), generated 192/512/maskable PNGs via sharp, manifest now PNG-only + maskable; apple-touch → 192 PNG.
- Answer rows `flex-wrap` → 2×2 on 320px screens (was fixed 4-across overflow).

### Verified
- `typecheck` ✅, `lint` ✅, `test` ✅ 17/17, `build` ✅ (game routes ~5.7 kB, First Load flat).
- Live: SSR shows loader correctly; pool serves 5 seeded items; `/manifest.json` + all 3 PNGs 200.

### Device-readiness audit (static, vs UI_UX §33/34/38/47)
- PASS: touch ≥56px everywhere (IconButton 56, answers 56h/72w+, Button lg/xl, full-card links); safe-areas (`pt-safe/pb-safe`, `viewport-fit=cover`); portrait+landscape (stage `aspect-ratio` + Phaser FIT, scrolling page); reduced-motion (CSS kill-switch + static scene placement); contrast (dark ink on light surfaces); keyboard (native buttons, skip link, focus-visible); screen readers (labels, `aria-live` stars/feedback, canvas `aria-hidden` with DOM equivalents); PWA (manifest/SW/icons/maskable/theme-color).
- ACCEPTED tradeoff: `maximum-scale=1, user-scalable=no` blocks pinch-zoom (per Stitch game spec; standard for tap games).
- STILL NEEDS physical device: real touch feel, Phaser canvas perf on low-end Android, iPad split/orientation, install prompt flow, voice-over/TalkBack pass, offline airplane-mode run.

### Next Actions
1. Physical device pass (Android phone, iPhone, iPad, desktop): play both games end-to-end, install PWA, airplane-mode offline run.
2. Server-trusted scoring follow-up (verification token instead of `correctAnswer` in pool responses) — API.md §9.1.
3. Clean-up renderer (LZ-070) on the same hook/scale pattern.

## Session 2026-09-13 (4) — Phaser scenes for addition + subtraction (LZ-040/041/043/051/061)

### Completed
- Hybrid approach (ARCHITECTURE.md: game route owns a Phaser game; website stays in Next.js): Phaser canvas renders the visual stage, DOM keeps answers/counts (a11y preserved).
- `src/games/phaser/layout.ts`: pure deterministic `gridPositions()` (centered grid, adaptive emoji size 26–46px).
- `src/games/phaser/usePhaserGame.ts`: dynamic `import("phaser")` (SSR-safe), FIT+CENTER_BOTH scale (LZ-043 resize), destroy-on-unmount, graceful no-WebGL fallback.
- `additionScene.ts`: pop-in apples per group (Back.easeOut, stagger), success = right group drifts middle + pulse + plus pulse.
- `subtractionScene.ts`: branch perch, flyers tween up-right + fade with stagger (LZ-061), `-N Flew Away` label, remaining pulse on success. Both respect `prefers-reduced-motion`.
- `AdditionStage`/`SubtractionStage` wrappers (aria-hidden canvas, `touch-action: manipulation`); integrated into both plays with `successTick`; authoritative numbers stay in DOM pills.
- `tests/phaser-layout.test.js`: empty/invalid, bounds+uniqueness (1–20), determinism, dense-size shrink.

### Verified
- `typecheck` ✅, `lint` ✅, `test` ✅ 11/11, `build` ✅ (phaser code-split: +1.3/1.4 kB on game routes, First Load unchanged ~94–113 kB).
- Live SSR HTML: stage container + pills (`5+3`, answers include exactly one `8`) correct; canvas hydrates client-side (empty SSR div expected). Pool API still serves `seed-*`.

### Known Issues / Notes
- Plays still use local `createRound` (client deterministic); pool-API fetch wiring is a later gameplay-data step.
- Canvas visuals not pixel-verified headless — needs a real phone/iPad/desktop pass (touch, orientation, reduced-motion).

### Next Actions
1. Wire plays to `GET /api/games/[gameId]/content` (pool-first, local fallback) + server-trusted scoring follow-up.
2. Device pass: touch, portrait/landscape, reduced-motion, safe-areas.
3. Clean-up renderer (LZ-070) reusing the same hook/scale pattern.

## Session 2026-09-13 (3) — Provision MongoDB → seed → verify pool-served content

### Completed
- Provisioned local dev MongoDB 7.0.14 (`fastdl.mongodb.org`, curl.exe — PS `Invoke-WebRequest` hits a non-interactive proxy prompt). Binary + data in `.dev/` (gitignored, zip removed); `mongod --dbpath .dev/data --port 27017 --bind_ip 127.0.0.1` running.
- `.env.local` (gitignored): `MONGODB_URI=mongodb://127.0.0.1:27017`, `MONGODB_DB_NAME=learnzzy_dev`.
- `scripts/seed.mjs` now loads `.env.local` itself (no dotenv dep); `npm run seed` → `upserted=200` (re-runnable).
- Counts: `games 5`, `content 200` (100 addition + 100 subtraction, all easy/active), `gameEvents`/`sessions` persisting.

### Verified (prod `next start`, real Mongo)
- `GET /api/games/addition/content?difficulty=1&limit=3` → `seed-add-easy-000…`, `2+3=5`, options `5/6/4/7` (no fallback).
- `GET .../subtraction/content?difficulty=easy` → `seed-sub-easy-000…`, `3-1=2`; string difficulty param works.
- Events idempotency at storage level: first `accepted:1`, replay `duplicates:1`, collection count stays 1.
- `POST /api/sessions` → 201 + row in `sessions` (previously only verified ephemeral).

### Known Issues / Notes
- `mongod` left running for future sessions; restart with the same `--dbpath` command if rebooted. No auth on local dev Mongo (bind 127.0.0.1 only — never expose; production uses managed MongoDB + auth per DATABASE.md/DEPLOYMENT.md).
- `gameConfigs` collection empty (0) — expected, lands with admin/difficulty milestone.
- Staging/prod still need managed MongoDB + `MONGODB_URI` secrets; `.env.local` is dev-only.

### Next Actions
1. Phaser scenes for addition/subtraction (LZ-040/051/061).
2. AI service abstraction + agent infra (LZ-130–145) after gameplay visuals stable.

## Session 2026-09-13 (2) — Data layer: sessions, events persistence, content pool

### Completed
- Added `mongodb` driver; `src/db/mongodb.ts` lazy cached connection, `isMongoConfigured()`, graceful `null` when `MONGODB_URI` unset (BR-221 gameplay never breaks).
- Indexes per DATABASE.md §25: `games`, `gameConfigs`, `content` (contentId unique; game+difficulty+status; game+status), `contentVersions`, `sessions`, `gameEvents` (eventId unique; session+time; game+event+time), `agentTasks`.
- Repositories: `sessions.ts` (anonymous create + touch, ephemeral fallback), `events.ts` (append-only, idempotent on `eventId`, duplicate→duplicates count), `content.ts` (`active`-only reads, pool status vs `CONTENT_POOLS` thresholds).
- `src/lib/content.ts`: harmonized `ContentStatus` (`draft→validating→approved→active` + rejected/disabled), `ContentDocSchema`, `validateAddition/SubtractionPayload` (exactly-one-correct, no-dupes, non-negative), pool thresholds.
- `src/lib/difficulty.ts`: resolves doc drift — `1↔easy, 2↔medium, 3↔hard` single source of truth.
- APIs: `POST /api/sessions` (201, no PII, ephemeral fallback), `POST /api/game-events/batch` now persists via repo (was stub), `GET /api/games`, `GET /api/games/[gameId]/content` (pool-first, deterministic server fallback so gameplay never empty — BR-222; correctAnswer included for current client-side MVP, token-based scoring noted as follow-up).
- `scripts/seed.mjs` + `npm run seed`: upserts 5 games + 100 addition + 100 subtraction easy/active docs, math re-validated before write, safe re-runs.
- `tests/content.test.js`: lifecycle (only active playable), addition/subtraction validators, difficulty mapping.

### Verified
- `typecheck` ✅, `lint` ✅, `test` ✅ 7/7, `build` ✅ 12 routes.
- Live smoke (prod `next start`, no DB): sessions → ephemeral `sess_*` 201; content → 2 fallback items, `1+1=2` correct; events batch → accepted:1. Graceful degradation confirmed.

### Known Issues
- Seed script not yet run against a real Mongo (no `MONGODB_URI` in this env) — run `npm run seed` once DB is provisioned.
- No admin auth yet: pool-status helper is repo-level only, no admin route exposed (correct until LZ-200).
- Content fallback still sends `correctAnswer` to client (matches current client-side games; server-trusted scoring is a later milestone per API.md §9.1).

### Next Actions
1. Provision MongoDB (dev) → run `npm run seed` → verify pool-served (non-fallback) content.
2. Phaser scenes for addition/subtraction (LZ-040/051/061).
3. AI service abstraction + agent infra (only after 1–2 stable).

## Session 2026-09-13 — Foundation + Child slice (Phases 0–2)

### Completed
- Scaffolded Next.js 14 + TS + Tailwind + Zod + Phaser (lazy, not yet in gameplay canvas) foundation.
- Playful Wonder tokens → `src/styles/tokens.css` + `tailwind.config.ts`; `next/font` Plus Jakarta Sans.
- PWA: `manifest.json`, `sw.js` app-shell cache, installable meta, safe-areas, offline `/play` fallback.
- UI: `Button/IconButton/Card/Badge/Progress`; child: `GameCard/GameHeader/StarCounter/AnswerButton/Celebration/GameShell`; brand: `BrandLogo` (Stitch SVG, local).
- Game framework: `GameDefinition`, lifecycle, `mulberry32` seeded RNG, `GAME_ROUNDS=5`, difficulty ranges L1 1–5 / L2 1–10 / L3 1–20.
- Addition (BR-030–033) + Subtraction (BR-040–043): deterministic generators, Zod schemas, exactly-one-correct + no-duplicate options, visual-quantity consistency, non-negative subtraction.
- Routes: `/`, `/play`, `/play/addition`, `/play/subtraction`, `/play/[slug]` friendly soon-state; `GET /health`, `GET /api/health`, `POST /api/game-events/batch` (Zod-validated, idempotent stub).
- Anonymous session + offline event queue (`clientEventId`, batched fire-and-forget, never blocks gameplay).
- `Dockerfile` (multi-stage, non-root), `.env.example` (server-only AI keys), `.gitignore`, `tests/math.test.js`.

### In Progress
- None — slice is integrated. Next: data layer (LZ-100–124: sessions API, MongoDB repos, content pool + deterministic seed) then AI service + agents.

### Blocked
- None. Note: Stitch MCP `get_project` failed (`Incompatible auth server`); used local `docs/stitch_*` cache as design source.

### Verified
- `npm run typecheck` ✅, `npm run lint` ✅ (0 warnings), `npm test` ✅ (3/3), `npm run build` ✅ (10 routes, First Load ~94–111 kB).

### Known Issues
- Phaser installed but gameplay currently DOM-driven (no Phaser Scene yet) — LZ-040 partially open; canvas integration is next game-framework step.
- Clean-up / puzzle / sketch show friendly soon-state (intentional, BR-222 compliant) — not playable yet.
- `POST /api/game-events/batch` validates but does not persist (MongoDB milestone pending).
- No MongoDB/Redis/BullMQ/AI/admin yet — per DEC-170 order.

### Decisions Made
- Adopted Stitch 56px min touch (72px answers) over UI.md 44px baseline; kept docs as truth, Stitch as design source.
- Rejected CDN Tailwind + `lh3.googleusercontent` art in implementation; tokens vendored, art via emoji placeholders until asset pipeline (DEC-080).
- `Array.from(set)` over Set-spread for TS ES2017 compat; `node --test tests/math.test.js` script fix for Windows.

### Next Actions
1. Data layer: `POST /api/sessions`, MongoDB connection + repos (`games, gameConfigs, content, sessions, gameEvents`) + indexes + seed (LZ-100–113).
2. Content pool: Zod per-game schemas, status lifecycle (`draft→validating→approved→active`), pool thresholds, deterministic seeder (LZ-120–124).
3. Phaser scenes for addition/subtraction (LZ-040/051/061) + clean-up renderer (LZ-070).
4. AI service abstraction + agent infra (LZ-130–145) only after 1–3 are stable.

### Files Changed
- New: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `Dockerfile`, `.env.example`, `next-env.d.ts`, `src/**`, `public/manifest.json`, `public/sw.js`, `public/icons/icon.svg`, `tests/math.test.js`.

### Tests Run
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — all pass.

### Deployment Status
- Production build passes locally. No staging/prod deploy, no env secrets configured.

```markdown
## Session YYYY-MM-DD

### Completed
- ...

### In Progress
- ...

### Blocked
- ...

### Verified
- ...

### Known Issues
- ...

### Decisions Made
- ...

### Next Actions
1. ...
2. ...
3. ...

### Files Changed
- ...

### Tests Run
- ...

### Deployment Status
- ...
```

---

# 14. Handoff Rules

The next session must not:

- assume unfinished work is complete;
- invent implementation status;
- bypass business rules;
- bypass validation;
- introduce live AI gameplay dependencies;
- expose secrets;
- give agents unrestricted access;
- overwrite production content blindly;
- skip tests because the change looks small.

---

# 15. Final Handoff Principle

> **Start every new session by reconciling the documented plan with the actual codebase. Then implement the smallest correct next step, test it, and update the project memory.**
