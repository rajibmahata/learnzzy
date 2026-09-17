# CHANGELOG: Learnzzy

## [Unreleased]

### Added
- Five deterministic child games with validated Mongo-backed content pools.
- Five-agent registry, task/run/event persistence, retries, BullMQ/Redis integration, and local fallback.
- AI provider abstraction with model routing, usage tracking, budgets, and mock mode.
- Admin authentication, protected operations APIs, content approvals, pool refill, analytics, and command center UI.
- Docker Compose, Nginx reverse-proxy example, security headers, and admin setup script.
- Adaptive personalized-learning layer: learner profiles (optional nickname + age band), 15 seeded level configs, server progress/promotion, server reward mirror, interest signals, deterministic personalization engine with validated learning plans, personalization + QA agents (7 total), learner setup/plan/sticker-collection UI, per-window game shuffling, and admin learner-insights/levels/QA/personalization endpoints.
- Education Gateway (`src/integrations/education/`): provider interfaces, allowlisted registry, Tutor/OER/NCERT adapters with live HTTP contracts + deterministic mocks (all disabled by default), Zod validation, provenance + license gate, 3-tier cache, classified errors with retry/backoff, and health tracking.
- Stable concept model (`src/lib/concepts.ts`) bridging games, planner, providers, and parent progress.
- Advisory-only planner hook: gateway recommendations annotate plans; order/level/score never change.
- OER grounding for content generation with provenance stamps on produced docs.
- Parent experience: scrypt auth + HttpOnly sessions, single-use expiring pairing codes, active-link authorization, child summaries/insights/activity/progress/plan APIs, 10 parent pages, 5 public parent pages, child `/link` page, landing footer links.
- Admin education diagnostics (`providers/health/provenance`) + command-center providers panel.
- 37 gateway/parent/pairing unit tests; 52 Playwright specs across 4 viewports on system Chrome.
- Sentry SDK wired (client/server/edge configs, ErrorBoundary reporting; inert without DSN).
- Redis-backed fixed-window rate limiting on all 16 write/auth endpoints with instant memory fallback.
- Production deploy assets: `docker-compose.prod.yml` (loopback-only web, log rotation), `deploy/nginx.prod.conf` (TLS example), `npm run backup` driver-based JSON dumps, completed QA agent instructions.
- Resilience fixes (live-verified): fail-fast Redis clients + 10s negative-result caching in limiter, education cache, and BullMQ bootstrap (Redis outage previously hung requests); `COOKIE_SECURE` escape for local Docker HTTP auth while production stays Secure; `PARENT_AUTH_SECRET` plumbed through compose with `.env` auto-generation via `scripts/docker-env.mjs`.
- Sketch/Docker root-cause fix: Phaser boot read `scene.events` before SceneManager attached it, crashing all 5 games silently in production (`SKETCH_DOCKER_ROOT_CAUSE.md`); readiness now uses the Game `ready` event and boot failures warn. Added sketch color picker (cosmetic-only), canvas boot + sketch draw e2e, and sketch definition unit tests.
- Password hashes use `:` delimiters (`scrypt:<salt>:<hex>`) because `$` is interpolated by compose dotenv and Next dotenv-expand; old `$` hashes are invalid.
- Learning progression/content gap fixed: the seed now produces 25 distinct
  level-one addition combinations instead of a constant second operand; server
  content selection rotates a deterministic candidate window, excludes recent
  content IDs, and avoids duplicate problem identities. Added level-aware
  fallback ranges, server-side locked-level responses, three deterministic
  tracks, `/api/learners/:learnerId/journey`, child journey UI, parent journey
  summary, and focused learning-progress tests.

### Changed
- `/api/games` now exposes all five MVP games as active.
- Empty or low content pools trigger asynchronous refill without blocking gameplay.

### Fixed
- Added strict validation for generated math, scene structure, safety terms, duplicates, and content lifecycle.

### Removed
- None.
