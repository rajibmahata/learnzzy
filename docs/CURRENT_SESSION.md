# CURRENT SESSION: Learnzzy

**Date:** 2026-09-13
**Focus:** Agent workforce, admin operations, deployment hardening
**Owner:** OpenCode

## Objective
Complete the MVP background workforce and the first usable admin command center without making the child path dependent on AI or infrastructure.

## Tasks

- [x] Register five least-privilege agents and persist task/run/event lifecycle.
- [x] Add BullMQ/Redis queue with in-process retrying fallback.
- [x] Add deterministic content generation with AI assist and validation gates.
- [x] Add pool monitoring, idempotent refill, and gameplay-safe refill triggers.
- [x] Add admin auth, rate limiting, protected APIs, dashboard, approvals, analytics, and health.
- [x] Add Docker Compose, Nginx, headers, and environment examples.
- [x] Pass lint, typecheck, test, and production build.

## Decisions
- Child APIs only serve `status: "active"` content; low pools refill asynchronously.
- Admin auth uses an env-configured scrypt password hash and signed, HttpOnly cookie session.
- Redis is durable when configured; local development executes the same handlers in-process.

## Blockers
- Physical iOS/Android/iPad touch, install, offline, accessibility, and low-end performance testing still require devices.
- Production secrets, managed MongoDB/Redis, S3, CDN, and Sentry are deployment tasks, not committed to the repository.

## Next
- Configure `.env.local` using `node scripts/admin-setup.mjs <password>` for local admin smoke testing.
- Run `docker compose up --build` in an environment with Docker, then seed Mongo separately.
- Add server-trusted scoring tokens and full content version UI before production launch.
