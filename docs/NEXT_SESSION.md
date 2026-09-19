# Learnzzy — Next Session

**Document:** Development Session Handoff  
**Version:** 1.1  
**Status:** Active / Living Handoff  
**Last Updated:** 2026-09-17

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

The learning-progress/content-variety gap is implemented. Read
`LEARNING_PROGRESS_ASSESSMENT.md` for confirmed causes and compatibility notes.
The child journey is derived from the existing global level and uses three
tracks (`numbers`, `creative`, `visual`); future-level content requests return
`403 LEVEL_LOCKED` server-side.

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

The five-game MVP, Mongo content pool, AI abstraction, eight agents (content, quality, asset, analytics, difficulty, personalization, QA, academic), retryable queue, admin authentication, admin command center, analytics endpoints, pool refill triggers, Docker Compose, and Nginx example are implemented. The adaptive personalized-learning layer is implemented: learner profiles with optional nickname + age band (4-5/6-7/8-9), 15 seeded level configs, server progress/promotion (3+ completions at 80%+, max +1 level), server reward mirror, interest signals (educational only), deterministic PersonalizationService with validated learning plans, learner setup (/welcome), level progress, personalized game plan, sticker collection (/stickers), per-window game shuffling, and admin learner-insights/levels/QA/personalization endpoints. The Education Gateway phase is implemented: provider interfaces + allowlisted registry + Tutor/OER/NCERT adapters (live HTTP contracts with deterministic mocks, all disabled by default), stable concept model (`src/lib/concepts.ts`), advisory-only personalization hook (plan order/level never change), OER grounding for the content agent with provenance stamps, 3-tier knowledge cache (Redis/memory -> provider -> Mongo), parent auth + single-use pairing + 10 parent pages + 5 public parent pages + child /link page, admin education diagnostics + dashboard panel (plus 2026-09-17 academic panel), and 37 new gateway/parent/pairing tests. The Agentic Academic Engine phase (2026-09-17) is implemented: `src/lib/academic.ts` (LEARN→MASTER stages, review-first ordering, §16 recommendations, `validateAcademicPlan` gate), `academicEngine` orchestrator + `academic-agent`, learner `/academic/plan|recommendation|voice|result` APIs, Voice Character Engine (5×11×5, `voiceAssets` cache, never live TTS in gameplay), dynamic visual themes + 5 cross-domain combos, numbers/vocabulary catalog growth (13 categories), parent academic rollup. Sentry SDK is wired (inert without DSN; ErrorBoundary reports). Rate limiting is Redis-backed with instant memory fallback. Prod deploy assets exist (`docker-compose.prod.yml` with loopback-only web + log rotation, `deploy/nginx.prod.conf` TLS example, driver-based `npm run backup`, filled QA instructions). Two live-verified resilience fixes: fail-fast Redis clients with 10s negative-result caching (a Redis outage previously hung requests), and `COOKIE_SECURE=false` for local Docker HTTP auth (production stays Secure). Verification: 156 unit tests (22 academic/voice/theme, 2026-09-17) + typecheck + lint + production build (81 routes) + `docker compose config` ✅ + dev-server health ✅; prior state 97 unit tests + 76 Playwright specs (mobile-320/mobile/tablet/desktop on system Chrome) green; Docker stack healthy with seeded pool; full parent pairing chain proven live. Sketch white-canvas root-caused and fixed (see `SKETCH_DOCKER_ROOT_CAUSE.md`); no Stitch MCP tool exists in this environment so Stitch screens could not be fetched live (KI-011 stands). Academic Playwright coverage + live-Mongo academic E2E still open (KI-019).

Use `node scripts/admin-setup.mjs <password-min-12-chars>` to generate local admin environment values. Do not commit the resulting values.

Remaining production-readiness work is physical-device QA, server-trusted scoring tokens, S3/CDN asset generation, managed-service deployment validation, live MCP server deployments (gateway runs deterministic mocks until URLs/keys are configured), live-Mongo academic E2E (KI-019), TTS binary generation for `voiceAssets` (KI-020), Playwright academic pass, and Stitch validation of the new admin/parent surfaces.

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

## Session 2026-09-17 (7) — Living Wonder visual upgrade (Stitch 12–20)

### Completed
- Stitch screens 12–20 unretrievable (no MCP tool/URLs; STITCH_INSTRUCTIONS.md + KI-021); built from written specs + tokens, logic preserved, pixel parity NOT claimed (DEC-186).
- Character system (`lib/characters.ts` + `CharacterGuide` + CSS states) in all 6 plays + `Celebration`; Number Orchard/Breeze Valley per-round themes (pool passthrough + deterministic fallback, Phaser defaults unchanged); working Read-aloud + persisted mute; `WonderWorlds` selector; landing SkyDrift; Sketch vector-trace root-cause (no image deps) + Starlight frame.
- 13 new character/theme tests.

### Verified
- `typecheck` ✅, `lint` ✅, unit 169/169 ✅, `next build` ✅, Playwright 51/51 ✅ (system Chrome, mobile-320/mobile/tablet/desktop, fresh prod build).

### Known Issues / Notes
- KI-021 (Stitch parity open), KI-022 (Docker CLI shadowed), KI-019/020 still open; :3000 held by stale `learnzzy-web-1` port-forward — kill/recreate before local :3000 work.

### Next Actions
1. Re-fetch Stitch 12–20 hosted URLs when tooling exists; do the §27 side-by-side comparison.
2. `run.bat docker` from an elevated shell (delete `C:\windows\system32\docker` first) + seed + KI-019 E2E.
3. Physical-device pass (touch, install, offline, TalkBack/VoiceOver).

## Session 2026-09-18 (9) — Worksheet-inspired Learning Playground

### Completed
- Category-first playground: 7 Learning Worlds on `/play` (+ now `/` via `HomeContinue` + category grid, DEC-189) → `/learn/[category]` → 16 activities (DEC-188). Generic engine (deterministic generators + ComplexityProfile + registry + activities content API + ActivityPlayer); shipped engines linked, never duplicated.
- Age changes the problem (counting 1–10 → 1–50 → 1–100+, ordering 3 → 4–5 → 5–7 nums, phonics letters → words → sentences); performance moves via existing per-skill skillLevels (±1, rolling, never one-mistake drops).
- Results flow through game-events + academic/result → parent dashboards + academic engine with no new contracts; MCP/gateway untouched (advisory-only, fail-closed).

### Verified
- `typecheck` ✅, `lint` ✅ (pre-existing img warnings only), unit 182/182 ✅ (8 new), `next build` ✅ (76 routes incl. `/api/activities/[activityId]/content` + `/learn/*`).

### Known Issues / Notes
- KI-019/020 still open; Playwright /learn pass + Stitch validation of category/activity surfaces not yet run; physical devices still outstanding.

### Next Actions
1. Playwright pass: 4–5 / 6–7 / 8–9 learner Home → Category → Activity → Answer → Result → Next → Progress (incl. mobile 320px).
2. Seed + KI-019 live-Mongo academic E2E incl. new activity skills; TTS pipeline (KI-020).
3. Physical-device pass; parent-journey screenshot re-fetch.

## Session 2026-09-18 (10) — Animal Wonderland Rich + Home Learning World + trace-write fix

### Completed
- Validated landing against new Stitch `d14a9b61` (Child-First 3D Play Home) + `4b8445bd` (ANIMATION_45 Rich) via `curl -L` (`.stitch/...` + `public/images/stitch/home-child-first-v2.png`); Rich scene: 5 candy mushrooms + 5 bobbing apples + 15 warm stars + 4 birds + tap jump burst + snappier camera. Updated `AnimalWonderland3D` to match (camera 4.5/20, mushrooms, apples, 15 stars, 4 birds, `pointerdown` jump).
- Landing now category-primary per spec §2/§3: hero → giant CTA → `HomeContinue` (Good-morning + plan-first Continue card, `GET .../plan` best-effort) → 7-category `CATEGORIES` grid (tactile, `→` affordance) → secondary 5-tile quick shortcuts → games gallery → voice board → safety. `BrandLogo` every header `→ /play`.
- Bug: `genTraceWrite` `answerIndex: 0` (shuffle-blind) → `options.indexOf(answer)` with tightened `tests/activity-content.test.ts:18` (`options[answerIndex]==answer` across all bands/generators, expanded trace-write loop). Hygiene: `resolveComplexity` dead `nudge` branching removed.

### Verified
- `typecheck` ✅, `lint` ✅, `npm test` 189/189 (47 suites, was 182) ✅, `next build` ✅.

### Known Issues / Notes
- KI-019/020 still open; Playwright /learn + new HomeContinue mobile-320 pass not yet run in this env (requires `npm start` + browsers); physical devices outstanding.

### Next Actions
1. `npx playwright test e2e/learn.spec.ts e2e/child.spec.ts --project=mobile-320` against prod `npm start`.
2. Seed + KI-019 live-Mongo E2E incl. new trace-write/complexity paths; KI-020 TTS for `voiceAssets`.
3. Physical-device pass + re-fetch of any next Stitch revision.

## Session 2026-09-18 (11/12) — Calm Voice + Organized Wonder Play + Docker-First MCP

### Completed
- Voice (11): calm warm female `VoiceScript` (13 events, 5 locales, 800ms pause), `CHARACTER_VOICES` 0.82–0.88/0.97–1.05 throttle 900ms, `STATE_LINES` calm. TTS cached + fallback. 190/190 unit.
- Play gaps (12): `/play` 18→25: added 7 missing tiles (`more-less`, `count-by-tens`, `trace-number-name`, `matching`, `odd-one-out`, `pattern`, `shape-match`) grouped by World (Numbers 8, Words 2, Write 3, Think 7, Shapes 3, Discover&Puzzles 2) + 6 Stitch Category Hub cards (`1b8480cd` hub) + `WonderArchipelago3D` (`a1812/9fa2` ANIMATION_48) wonderland. All tiles child-friendly Stitch gradients/tactile.
- Docker-first MCP (12): unified shim `services/mcp` (node:20-alpine non-root, HEALTHCHECK, volumes `tutor-data` etc.) for `tutor:3001`/`oer:3002`/`ncert:3003` + `qdrant:6333` on private `learnzzy` network, prod hides ports, `npm run docker:health`. Gateway advisory, fail-closed.

### Verified
- `typecheck` ✅, `lint` ✅, `npm test` 190/190 ✅, `docker compose config` ✅, `next build` ✅.

### Known Issues / Notes
- KI-019/020 still open; Docker `up -d` full 7-service health needs `tutor-data` etc. volumes first run; Playwright `/play` 25-tile pass pending; physical devices outstanding.

## Session 2026-09-18 (8) — Stitch 12–20 live retrieval + attractiveness pass

### Completed
- Unblocked Stitch MCP (`STITCH_API_KEY` in env; `@file` bodies for Windows curl); `list_screens` + 10× `get_screen`; `curl -L` fetched 7 HTML + 9 screenshots; 3 art boards optimized to 640px WebP postcards in `public/assets/`. KI-021 RESOLVED.
- Inspected all screens vs the running app first; kept Pip (Stitch-canonical), kept Teddy for subtraction (tested mapping wins).
- New `lib/worlds.ts` + `WonderBits.tsx` + 3 CSS keyframes; restyled Worlds selector, Play Home Pip/Spin, Addition, Subtraction, Clean Up, Puzzle, Sketch — presentation only. 5 new unit tests.
- Deviations logged as DEC-187 (no live WebGL Shader; mechanics/scores/pools/agents/voice/e2e untouched; Stitch names display-only).

### Verified
- `typecheck` ✅, `lint` ✅, unit 174/174 ✅, `next build` ✅, Playwright child/sketch/discover/adaptive/learning-journey ✅ (mobile, prod build), screenshot review of `/play` + addition + clean-up ✅, `docker build learnzzy:stitch-check` ✅ via explicit `docker.exe` path.

### Known Issues / Notes
- KI-019/020 still open; parent-journey screenshot still expired; physical devices still outstanding. Bare `docker` still shadowed (KI-022) — use the full `docker.exe` path.

### Next Actions
1. Re-fetch the expired parent-journey screenshot from a fresh Stitch URL.
2. Seed + KI-019 live-Mongo academic E2E; TTS pipeline (KI-020).
3. Physical-device pass (touch, install, offline, TalkBack/VoiceOver).

## Session 2026-09-17 (6) — Agentic Academic Engine + multi-character voice

### Completed
- Anti-duplication survey first: reused `educationGateway`, `conceptsForGame`/`getConceptDef`, `validateAdvisory`, `buildPlan`, per-skill `skillLevels`, knowledge mastery, Admin providers panel, `parentInsights`. New code only where nothing existed.
- `src/lib/academic.ts` (pure, 22 focused tests): LEARN→PRACTICE→PLAY→RECALL→REVIEW→MASTER machine, review-first concept ordering, interest+need balance, §16 `recommendGame`, no-jump `decideNextStep`, parent-safe reasons, `validateAcademicPlan` gate (rejects CoT/banned/level-jumps).
- `src/services/academicEngine.ts` orchestrator (gateway calls failure-isolated, deterministic fallback) + `src/repositories/academicPlans.ts` + 8th `academic-agent` (queue `academic-plan`).
- Learner `/academic/plan|recommendation|voice|result` APIs (rate-limited, Zod) + `GET /api/admin/academic/plans`; parent insights/progress `academic` rollup; Progress page streak + Next card; Admin academic panel.
- `src/lib/voice.ts` (5 chars × 11 events × 5 locales, Parrot ladder) + `voiceAssets` cache service (never live TTS in request path) + `speakWithCharacter` client ext; Discovery uses plan character best-effort.
- `src/lib/visualThemes.ts` (10 themes, math-invariant) + 5 cross-domain combos; content-agent objects widened (math unchanged).
- Knowledge: `numbers`/`words` categories (13 total), prepared hi/bn/ta/te names; OER +4 summaries; NCERT foundational Grade-1 rows marked explicitly non-official.
- `tests/knowledge.test.ts` locale test updated to the new prepared names.

### Verified
- `typecheck` ✅, `lint` ✅, unit 156/156 ✅, `next build` ✅ (81 routes), `docker compose config` ✅, dev-server `/api/health` + `/api/games` ✅.

### Known Issues / Notes
- KI-019: live-Mongo academic E2E not run (no Mongo here; learner reads 404 by pre-existing no-DB design). KI-020: `voiceAssets` queue as `pending` (no TTS binaries yet; device speech used).
- Playwright academic pass + Stitch validation not run in this environment.

### Next Actions
1. `docker compose up --build` + seed, then exercise the four academic APIs + parent/admin surfaces with a real learnerId (KI-019).
2. TTS generation pipeline to fill `voiceAssets.audioUrl` (KI-020).
3. Playwright academic failure-injection pass (MCP down, TTS down, multilingual, themes, auth).
4. Stitch validation of admin academic panel + parent learning card.

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

## Session 2026-09-18 (13) — All 25 Validated — Big & Small Fix

### Completed
- Fix `Big & Small` `src/lib/activityContent.ts:239` — identical `text-4xl` visuals made maths invisible; now `visualMeta {sizes, wantBiggest}` + scaled pills (`0.7→1.8` for 4–5, `0.9→1.3` for 8–9) with `1..n` badges, deterministic `answer = indexOf(n-1|0)+1`, age-graded subtlety. Verified 300 seeds across bands/levels.
- Validated all 25 `All Wonder Adventures` via `validate-adventures.mjs` + `validate-api.mjs`: `activityFor` + `generateActivityContent` across `4-5/6-7/8-9` — `25 ok, 0 fail, no duplicate hrefs, all categories valid` (Numbers 8, Words 2, Write 3, Think 7, Shapes 3, Discover&Puzzles 2). `GET /api/activities/...` still `globalLevel+mastery`.
- MCP not required for deterministic generation; Education Gateway fallback remains.

### Verified
- `npm test` 190/190, `npx tsc --noEmit` 0, `docker compose config` OK, `next build` green (via previous).

### Known Issues / Notes
- KI-019/020 still open; Playwright 25-tile flow pending in this env; physical devices outstanding.

### Next Actions
1. `npx playwright test e2e/learn.spec.ts --project=mobile-320` for 25-tile open + Big & Small visual scale on device.
2. Seed + KI-019 live-Mongo: verify `big-small` `visualMeta` persists and `GET /api/activities/big-small/content` returns scaled sizes.
3. Physical-device pass + remove `validate-*.mjs` temp scripts.

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
