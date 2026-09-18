# Learnzzy MCP Docker Architecture

**Date:** 2026-09-18  
**Status:** Implemented (Docker-first, private network)  
**Services:** `web` + `mongo` + `redis` + `tutor-mcp` + `oer-mcp` + `ncert-mcp` + `qdrant`

## 1. Goal
Run Tutor/OER/NCERT as private Docker services behind Learnzzy's Education Gateway, with identical local/VPS topology, graceful degradation, and no child-browser exposure.

```
Child
  ↓
Learnzzy (Next.js, deterministic engine)
  ↓
Gameplay Events → Analytics → Learning Signals → PersonalizationService
  ↓
Education Gateway (src/integrations/education/gateway.ts)
  ├── Tutor MCP   → learner state / evidence / next activity
  ├── OER MCP     → educational knowledge / concept
  └── NCERT MCP   → curriculum / prerequisites
  ↓
Validated Learning Plan → Approved Content → Game → Result → Parent Dashboard
```

MCP failure never breaks gameplay; PersonalizationService falls back to deterministic plan + approved Mongo content.

## 2. MCP Repositories — Inspection Results (Phase 1)

No external public repositories were supplied; the Learnzzy codebase already defines the *REST shim contracts* that any deployed MCP must satisfy (see `src/integrations/education/*-provider.ts` headers). This implementation therefore ships minimal Dockerized shim servers that implement those exact contracts — the “official build/run instructions + minimal Docker wrapper” pattern, without forking third-party code.

| Provider | Contract (REST shim) | Transport | Default Port (container) | Health | Auth | Storage | External Deps |
|---|---|---|---|---|---|---|---|
| Tutor | `POST /learner-state`, `/learning-evidence`, `/next-activity` | HTTP JSON (POST, 256 KiB cap) | 3001 | `GET /health`, `/readiness`, `/capabilities` | Optional `Bearer` API key (`TUTOR_MCP_API_KEY`) | `/data/tutor/tutor-evidence.json` (volume) | none (in-memory + file) |
| OER | `POST /search`, `/concept` | HTTP JSON | 3002 | same | Optional `OER_MCP_API_KEY` | `/data/oer` (future) | none |
| NCERT | `POST /search-curriculum`, `/prerequisites` (+ aliases `/search/content`, `/graph/prerequisites`) | HTTP JSON | 3003 | same | Optional `NCERT_MCP_API_KEY` | `/data/ncert` + Qdrant | `qdrant:6333` (vector search, optional) |

*Why HTTP not stdio:* The Learnzzy adapters use `providerFetch` (fetch + timeout/retry, `http.ts:21`), not MCP stdio. The shim therefore exposes HTTP; a future native MCP client can be added without changing Learnzzy (adapter interface is stable).  
*Why not invent ports:* Ports above match the pre-existing MCP documentation (3001/3002/3003 inside the `learnzzy` bridge) and are not exposed publicly in prod.  
*Why optional auth:* `config.ts` treats missing `*_API_KEY` as unauthenticated private network traffic; when set, `src/server.js:requireAuth` enforces `Authorization: Bearer`.

Qdrant (NCERT vector) is included as `qdrant/qdrant:v1.9.4` because the assessment (`LEARNZZY_MCP_ARCHITECTURE_ASSESSMENT.md:16`) notes NCERT MCP's REST+graph/Qdrant needs. It is isolated behind the same network, health-checked via `GET /healthz`.

## 3. Dockerization (Phase 2)

**Location:** `services/mcp/` — single unified image, three runtime roles via `PROVIDER` env.

- `Dockerfile` — `node:20-alpine` multi-stage base, non-root `appuser`, `HEALTHCHECK wget /health`, `EXPOSE 3001 3002 3003`, `CMD ["node","src/server.js"]`, graceful `SIGTERM` (5s fallback).
- `.dockerignore` — excludes `node_modules`, `.git`, `data/*`.
- `package.json` — zero deps (Node stdlib `http` only); no build step.
- `src/server.js` — single file, 400 LOC: auth middleware, JSON body limit 256 KiB, file persistence under `DATA_DIR`, structured error codes, `capabilities`, `metrics`.

Each MCP inherits the same Dockerfile; compose injects `PROVIDER` and `PORT`:

```yaml
tutor-mcp: PROVIDER=tutor-mcp PORT=3001 DATA_DIR=/data/tutor
oer-mcp:   PROVIDER=oer-mcp   PORT=3002 DATA_DIR=/data/oer
ncert-mcp: PROVIDER=ncert-mcp PORT=3003 DATA_DIR=/data/ncert QDRANT_URL=http://qdrant:6333
```

Resource boundaries: default Docker limits (no explicit caps; VPS can add `deploy.resources.limits` per host). Logging: `json-file` with rotation in prod compose.

## 4. Learnzzy Docker Network (Phase 3)

**Network:** `learnzzy` (bridge), declared top-level in `docker-compose.yml:1`. All services attach to it.

**Service DNS (container-to-container):**
- `http://tutor-mcp:3001`
- `http://oer-mcp:3002`
- `http://ncert-mcp:3003`
- `http://qdrant:6333`
- `mongodb://mongo:27017`, `redis://redis:6379`

Never `localhost` inside containers. Host dev uses `127.0.0.1:3001` etc. via mapped ports (`127.0.0.1:3001:3001` etc., loopback-only).

## 5. Persistent Data (Phase 4)

| Service | Volume | Mount | Content | Init |
|---|---|---|---|---|
| tutor-mcp | `tutor-data` | `/data/tutor` | `tutor-evidence.json` (learner evidences, capped 200/learner) | `mkdir -p /data/tutor` on start, no download |
| oer-mcp | `oer-data` | `/data/oer` | future OER DB / JSON | empty until provider populates |
| ncert-mcp | `ncert-data` + `qdrant-data` | `/data/ncert` + `/qdrant/storage` | SQLite + curriculum indexes + Qdrant vectors | Qdrant persists vectors; MCP JSON persists prerequisites; no rebuild on restart |

No large dataset re-download on restart; volumes survive `down` (require `down -v` to wipe).

## 6. Education Gateway (Phases 5–6)

Existing gateway (`src/integrations/education/`) already satisfies spec:

- **Types:** `types.ts` Zod schemas + `ProviderName`.
- **Provider:** `provider.ts` 3 interfaces.
- **Registry:** `registry.ts` allowlist (`tutor-mcp`/`oer-mcp`/`ncert-mcp`), `resolveProvider` (live-or-mock, fail-closed).
- **Gateway:** `gateway.ts` single facade with `withObservation` (cache → provider → Mongo fallback → empty), `recordProviderEvent`, classification.
- **Errors/Cache/Health/Provenance:** `errors.ts` (7 codes), `cache.ts` (Redis or bounded memory), `health.ts` (rolling + `educationProviderEvents`), `provenance.ts` (license gate).
- **Responsibilities:** feature flags (`config.ts`), auth, timeout (`EDUCATION_GATEWAY_TIMEOUT_MS` 5000), retries (exponential 250/500/1000, 2 retries), rate limiting, caching (6h knowledge, 15m learner state), schema validation, provenance, health, circuit breaker (degraded after 5 errors/hour), fallback, structured logging (correlationId), metrics via `health.ts`.

MCP failure path: `gateway → catch → Mongo knowledgeCache → []`, personalization continues, child sees approved content.

## 7. Environment Configuration (Phase 7)

`.env.example` / `.env.local.example`:

```
TUTOR_MCP_ENABLED=false
TUTOR_MCP_URL=http://tutor-mcp:3001     # inside Docker; host dev: http://127.0.0.1:3001
TUTOR_MCP_API_KEY=
OER_MCP_ENABLED=false
OER_MCP_URL=http://oer-mcp:3002
OER_MCP_API_KEY=
NCERT_MCP_ENABLED=false
NCERT_MCP_URL=http://ncert-mcp:3003
NCERT_MCP_API_KEY=
EDUCATION_GATEWAY_TIMEOUT_MS=5000
QDRANT_URL=http://qdrant:6333            # host dev: http://127.0.0.1:6333
```

All flags default `false` (fail-closed); live adapter requires flag **and** URL. Never commit secrets. Prod sets `TUTOR_MCP_ENABLED=true` + URL + API key via VPS env.

## 8. Startup Order & Health

Compose `depends_on: condition: service_healthy`:

```
qdrant → ncert-mcp → tutor-mcp/oer-mcp → mongo/redis → web
```

Healthchecks:
- MCPs: `wget -qO- http://127.0.0.1:3001/health` (15s interval)
- mongo/redis/qdrant: native `mongosh`/`redis-cli`/`wget /healthz`
- web: `wget /api/health`

Learnzzy does not block indefinitely on MCP startup; `health.ts` marks unreachable, gateway serves mocks until healthy.

## 9. Security & Parity (Phases 12–14)

- Private `learnzzy` network; MCP ports not published in prod (`docker-compose.prod.yml` clears `ports: []`), only Nginx 80/443 public via `127.0.0.1:3000`.
- No arbitrary MCP URL: registry is static (`registeredProviders()`), `providerFetch` rejects `..` and non-`/` paths, allowlisted `Authorization: Bearer`.
- No secrets in Git, no browser exposure, payload 256 KiB cap, timeout 5s, SSRF protection via allowlist.
- Structure same locally and on VPS; only difference is port exposure and `COOKIE_SECURE` (false locally, true prod).

## 10. Verification

See `MCP-LOCAL-SETUP.md` for `docker compose up -d` → `npm run docker:health` → `docker compose ps` → `logs` → real gateway call.

Final acceptance: `Browser → Learnzzy → Education Gateway → Docker network → Tutor/OER/NCERT → validated result` works locally when flags enabled.

## 11. Decisions & Non-Goals

- No rewrite of learning engine; MCPs extend academic intelligence only.
- No SDK injection into child browser.
- No live MCP latency on child critical path.

See `docs/MCP-INTEGRATION.md` for gateway details and `MCP-TROUBLESHOOTING.md` for failure recovery.
