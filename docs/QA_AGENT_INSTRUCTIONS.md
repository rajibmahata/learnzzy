# Learnzzy — QA Agent Instructions

How to validate Learnzzy (human QA or the Test & QA Agent). Run in order;
stop and file an issue on the first red gate.

## 0. Prereqs

```bash
npm install
cp .env.example .env.local   # then set MONGODB_URI / admin creds as needed
```

Docker path: `run.bat docker` (Windows) or `docker compose up -d --build`.
Mongo on host port **27018**, Redis on **6379**.

## 1. Static gates (must all pass)

```bash
npm run typecheck
npm run lint
npm test          # 87 unit tests, 20 suites
npm run build
```

## 2. Seed + smoke

```bash
npm run seed                                   # 15 levels + content pools
npm start &
curl localhost:3000/api/health                # {"status":"ok"}
curl localhost:3000/api/games                 # 5 games
curl "localhost:3000/api/games/addition/content?difficulty=easy&limit=2"
```

Pool IDs must start with `seed-` (pool hit, not fallback).

## 3. Adaptive-learning checks

- `POST /api/learners {nickname?, ageBand}` → 201, `level: 1`.
- `GET /api/learners/:id/plan` → 5 items, valid gameIds, reasons in
  `{interest, need-practice, variety}`.
- `POST .../progress {gameId, accuracy: 1}` ×3 → promotion to level 2 on the
  3rd only (never earlier, never +2).
- Same plan twice → byte-identical items (determinism).
- `learners` docs contain no `email/phone/location/photo` fields.

## 4. Gateway checks (all flags off by default)

- Tutor disabled → plan still builds; `source: "deterministic"`.
- OER search with no URL → `[]`, no throw; gameplay unaffected.
- Invalid provider payloads → `MCP_INVALID_RESPONSE`, never raw text upstream.
- License gate: CC BY/CC0 in; NC-SA / College Board / state-copyright out.
- Admin: `GET /api/admin/education/health` (auth) shows 3 providers +
  cache stats; no secrets/URLs leak.

## 5. Parent + pairing checks

- Register/login/logout/me round-trip; wrong password → 401, never which-field.
- Pairing: create code → confirm from learner → second confirm fails (409/400);
  expired code fails; approve → child visible; revoke → 403 afterwards.
- Cross-parent: parent B cannot read parent A's child (403).
- No cookie → all `/api/parent/*` return 401.

## 6. E2E (system Chrome)

```bash
npm run test:e2e   # 52 specs × 4 viewports (320/mobile/tablet/desktop)
```

Requires a free :3000 (kill stale `next dev`/`npm start` first — stale servers
poison runs via `reuseExistingServer`). No Playwright browser download needed.

## 7. Production checklist

- `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
- mongo/redis have no host binds; web on loopback only; nginx TLS active.
- `npm run backup` writes timestamped JSON dump (verify `_manifest.json`).
- Sentry DSN set → trigger test error → appears in Sentry; unset → console only.
- Admin + parent logins rate-limit (429 + Retry-After) under burst.

## 8. Recording results

- Unit/e2e failures → fix code, not thresholds.
- New behavior → new test in `tests/` first.
- Update `docs/KNOWN_ISSUES.md` for anything deferred; never silently skip.
