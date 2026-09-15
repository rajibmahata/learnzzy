# LEARNZZY MCP + Dockerization — Architecture Assessment

**Date:** 2026-09-15
**Method:** full repository inspection (no assumptions; verified against code)
**Rule applied:** existing architecture first — reuse > extend > create only on genuine gaps

---

## 1. Existing application architecture

Next.js 14.2.5 + React 18 + TypeScript (strict) + Phaser 3.80 + Tailwind 3.4.
App Router: child routes (`/`, `/welcome`, `/play/*`, `/stickers`, `/link`),
parent routes (`/parents/*` public, `/parent/*` authed), admin (`/admin`),
API routes under `src/app/api/`. Path alias `@/* → ./src/*` (tsconfig).
Security headers set in `next.config.js` (nosniff, DENY framing,
strict referrer/permissions policies, HSTS, COOP). BullMQ/ioredis kept out of
client bundles via `serverComponentsExternalPackages`. No `pages/` dir, no
custom server; `npm start` serves the production build.

## 2. Existing Docker architecture

- `Dockerfile`: 3-stage (deps → builder → runtime), node:20-alpine, non-root
  `app` user, production `HEALTHCHECK` against `/api/health`.
- `docker-compose.yml`: `web` (build `.`, :3000), `mongo:7` (host :27018 —
  deliberately off default 27017 to avoid clashes), `redis:7-alpine`,
  named volumes, healthchecks on all three, `depends_on: service_healthy`.
- **No separate worker service** (removed deliberately): web registers BullMQ
  workers in-process when `REDIS_URL` is set (`src/queue/queue.ts`).
- `.dockerignore` excludes `node_modules`, `.next`, `.env*.local`, `.git`,
  test/e2e artifacts. No secrets baked in.
- **Verified live 2026-09-15:** `compose up -d --build` green; mongo/redis/web
  all `healthy`; seed + API smoke passed against containers.

## 3. Existing local development architecture

`run.bat` menu + direct modes (`dev`/`prod`/`docker`/`seed`/`help`): Node 18+
check, `npm install` guard, `.env.local` bootstrap from `.env.example`,
Docker preflight (CLI → daemon → compose plugin → `compose config`), and
port-conflict diagnostics via `docker ps`. Host dev talks to Docker
mongo/redis via mapped ports (`127.0.0.1:27018/6379`); in-Docker URIs use
service DNS (`mongo:27017`, `redis:6379`). Gameplay degrades gracefully
without DB (deterministic local content, BR-221).

## 4. Existing production/VPS architecture

`deploy/nginx.conf`: port 80 reverse proxy to `127.0.0.1:3000` with
`X-Forwarded-*`, websocket upgrade, 2 MiB body cap, `/health` bypass.
**Gaps (known, not started):** no TLS block in nginx (terminates upstream, e.g.
Cloudflare/VPS cert, per DEPLOYMENT.md), no prod compose override, no backup
job, no log rotation. Sentry DSN key exists in env but no SDK wired.

## 5. Existing MongoDB architecture

Lazy cached singleton (`src/db/mongodb.ts`); null when unconfigured (graceful
degradation). ~30 indexes in `ensureIndexes` covering games, configs, content,
versions, sessions, events, tasks/runs, agents, assets, learners, levels,
plans, signals, providers, knowledge cache, parents, links, pairing codes
(TTL), audit, AI usage. Repositories per aggregate (`src/repositories/`):
`ai-usage, content, educationKnowledge, events, learners, levels, parents,
sessions`. Raw DB calls never appear in UI/game code (DEC-042).

## 6. Existing Redis/BullMQ architecture

`ioredis` + `bullmq` 6.x. `src/queue/queue.ts`: lazy connection, per-queue
`Queue` + `Worker` (concurrency 2), 3 attempts with exponential backoff,
`removeOnComplete: 100`; without `REDIS_URL`, the same handler registry runs
in-process. Cache helper (`integrations/education/cache.ts`) is two-tier:
Redis when reachable, else bounded in-memory TTL map (500 entries).

## 7. Existing agent architecture

Registry in `src/server/agent-store.ts` with least-privilege read/write lists
enforced by `assertWrite`; task lifecycle queued→running→completed/failed with
`agentRuns` + operational-only `agentEvents` (DEC-094, no chain-of-thought).
Handlers wired in `src/workers/ensure.ts`. Seven agents: content, quality &
safety, asset, analytics, difficulty, personalization, QA. No separate
"External Knowledge Agent" — gateway duties live in the gateway +
personalization agent (deliberate, avoids a redundant agent).

## 8. Existing personalization architecture

`src/services/personalizationService.ts`: deterministic interest + need +
variety scoring, learnerId-seeded jitter (no `Math.random`, no window APIs),
AI `classify` suggestion flips only the `source` flag. `validateAdvisory` /
`annotatePlan` (`educationAdvisory.ts`) let gateway output **annotate** plans
(focus game/concept, misconceptions, review timing) — order, level, score are
never touched. Latest plan served from `learningPlans`; personalization agent
adds evidence recording + advisory async (never on the read path).

## 9. Existing learner architecture

`learners` collection: `learnerId`, `sessionId`, optional nickname (≤20 chars),
age band (`4-5|6-7|8-9`), level 1–5, stars, stickerIds, per-game progress
(completions/bestAccuracy/lastLevel), interests. Anonymous by default (BR-004).
Public APIs: create/get learner, plan, progress (promotion: 3+ completions at
80%+, max +1 level), rewards mirror, signals. All write paths rate-limited;
client sync is fire-and-forget (`src/lib/learnerSync.ts`).

## 10. Existing parent architecture

`parents` (scrypt hash, parent-specific salt), `parentChildLinks`
(pending/active/revoked), `pairingCodes` (SHA-256 hash only, 15-min TTL,
atomic open→pending single-use, 5 confirms/hour/IP). Separate `lz_parent`
HttpOnly cookie (7-day TTL). APIs: register/login/logout/me, pairing
(create/approve/revoke/list), children summaries, per-child detail/plan/
insights/activity/progress — every child endpoint enforces an **active** link
server-side (`requireParentChild`). UI: 5 public `/parents/*` pages, 10
`/parent/*` pages sharing `ParentShell`, child `/link` code entry.

## 11. Existing authentication architecture

Two isolated schemes, same pattern (scrypt + HMAC-signed base64url cookie):
admin (`lz_admin`, 12h, env-configured single account) and parent
(`lz_parent`, 7d, Mongo-backed multi-account). Children: no auth (anonymous
sessions). Login/register/pairing endpoints rate-limited (5–8/window).
Audit log records auth + consequential actions. No CSRF tokens (SameSite=Lax
+ no cross-origin POST flows); noted as applicable-protection in API.md §33.

## 12. Existing API architecture

`{ success, data }` / `{ success: false, error: { code, message } }` envelope
with stable codes (401/403/404/422/429/503 in use). Coverage: games, content,
sessions, single+batch events, offline sync alias, learners (5 sub-resources),
levels, 40+ admin routes (agents/tasks/content/pools/assets/analytics/
difficulty/learners/levels/personalization/qa/commands/education/diagnostics),
parent (auth/pairing/children×5 views), pairing confirm, health. Zod on
inputs; provider outputs Zod-validated at the adapter boundary.

## 13. Existing testing architecture

`npm test` → `node --test` over `tests/`: 87 tests, 20 suites, all green.
Pattern: real-code tests for dependency-free modules (relative `.ts` imports;
no `@/` under type-stripping), mirror-tests for DB/agent services. New:
`education-gateway.test.ts` (37 tests: schemas, license gate, error codes,
flags, concepts, advisory/pairing/isolation mirrors). Playwright 1.63:
`playwright.config.ts` + `e2e/{child,parent,admin}.spec.ts`, 13 specs × 4
Chromium viewports (320/Pixel 7/Tab S4/desktop) on system Chrome (browser
download impossible on small disks — ENOSPC workaround documented);
**52/52 green**. `npm run test:e2e`.

## 14. Existing environment configuration

`.env.example` is the contract (data, AI, 9 MCP vars incl.
`EDUCATION_GATEWAY_TIMEOUT_MS`, observability, admin, parent secret fallback).
All MCP flags default `false`; live adapters require flag **and** URL
(fail-closed). Only `NEXT_PUBLIC_APP_URL` is client-exposed (sitemap/robots).
`.env.local` is gitignored; `.dockerignore` keeps secrets out of images.

## 15. Existing Nginx/deployment architecture

See §4. Compose is dev-oriented (binds 3000/27018/6379 to host); no prod
override file, no TLS, no registry image pins beyond `mongo:7`/`redis:7-alpine`.

## 16. Existing Stitch integration

`docs/STITCH_INSTRUCTIONS.md` (7 screens; prompt's screens 10–11 absent
locally) + `UI.md/UI_LIBRARY.md/UI_UX.md` patterns. **No Stitch MCP tool
exists in this environment** — parent/learner screens were built from existing
components + docs (logged KI-011). No Stitch URLs/assets were invented.

## 17. Existing MCP integration

Fully present under `src/integrations/education/`: `types` (Zod contracts +
provenance), `errors` (7 classified codes), `provider` (3 interfaces),
`config` (flags), `http` (timeout/retry/256 KiB cap, allowlisted paths),
`cache`, `health` (+ `educationProviderEvents`), `provenance` (license gate:
CC BY/SA, CC0, public-domain in; NC/College-Board/state-copyright out),
`registry` (allowlist; live-or-mock), `gateway` (3-tier: cache → provider →
Mongo → empty), `tutor|oer|ncert` adapters (documented REST-shim contracts +
curated mocks), `init` (idempotent bootstrap). Concept model in
`src/lib/concepts.ts` (14 concepts across 5 games). OER grounding wired into
content agent (`groundingTopic` → prompt context + `sourceProvenance` stamp;
validation pipeline untouched). Live repos researched (tutor-mcp: 46 OAuth
tools; oer-mcp: 8 tools, mixed licenses; ncert-mcp: REST+graph, grades 7–12).

## 18. What can be reused

Gateway, adapters, mocks, concept model, advisory validator, knowledge cache
repo, parent auth/pairing, admin diagnostics + dashboard panel, QA suite,
rate limiter, audit, seed, run.bat preflight, compose healthchecks, e2e
harness — i.e. nearly everything the target architecture names.

## 19. What must be added

Only genuine gaps: (a) live MCP server deployments + URLs/keys (infra, not
code — set env vars); (b) prod compose override/TLS/backup (deployment
hardening); (c) Sentry SDK wiring; (d) any prompt sections beyond §4 not yet
received (prompt was truncated).

## 20. What must NOT be changed

PersonalizationService ordering/level logic; deterministic game engine;
content lifecycle (`draft→validating→approved→active`); agent least-privilege
lists; anonymous-child model; plan determinism (QA-enforced); passing tests.

## 21. Risks

- Live MCP latency/cost if enabled without cache warmup → mitigated by
  15m/6h TTLs + budgets + async-only invocation.
- OER/NCERT license leakage into pool → mitigated by license gate +
  provenance stamps + quality agent still in path.
- Tutor OAuth/MCP-protocol mismatch (real servers speak MCP+OAuth, adapters
  expect REST shims) → documented contract; needs shim or native client later.
- Single-instance rate limiter noted for multi-instance prod.

## 22. Compatibility considerations

All provider integrations are additive: new files, new routes, new
collections; zero changes to gameplay, plan, or existing API contracts.
Mocks keep every flow green with all flags off. Compose port move
(27017→27018) is the one breaking local default — documented in
`.env.example`, `run.bat`, and `NEXT_SESSION.md`.

## 23. Recommended implementation sequence

1. Assessment (this file) → 2. receive/confirm remaining prompt sections →
3. fill only proven gaps (prod override/TLS/Sentry/live MCP wiring) →
4. extend tests → 5. verify (typecheck/lint/unit/build/e2e/smoke) →
5. commit/push. No new services without a proven gap.
