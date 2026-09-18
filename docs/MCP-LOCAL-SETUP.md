# Learnzzy MCP Local Setup (Docker-first)

**Goal:** Run Learnzzy + Tutor/OER/NCERT + Qdrant locally with one command, identical to VPS.

## Prerequisites

- Docker Desktop (or Engine) + Compose plugin (`docker compose version`)
- Node 18+ (for host `npm run docker:health`)
- No local Mongo on 27017 (compose host-maps mongo to 27018)

## One-Time Setup

```bash
cp .env.example .env.local
# Edit .env.local if you want live MCPs:
# TUTOR_MCP_ENABLED=true
# TUTOR_MCP_URL=http://127.0.0.1:3001   # host dev
# OER_MCP_ENABLED=true
# OER_MCP_URL=http://127.0.0.1:3002
# NCERT_MCP_ENABLED=true
# NCERT_MCP_URL=http://127.0.0.1:3003
# Inside Docker, web auto-uses http://tutor-mcp:3001 etc. (set in compose)

# Admin credentials (if not already set)
node scripts/admin-setup.mjs MyAdminPass123

# If you keep MCPs enabled, optionally set API keys:
# TUTOR_MCP_API_KEY=dev-tutor-key
# OER_MCP_API_KEY=dev-oer-key
# NCERT_MCP_API_KEY=dev-ncert-key
# Then also set them in compose env or .env (same keys for web and MCPs)
```

## Bring Up Everything

```bash
docker compose up -d --build
# or: run.bat docker  (Windows helper, same effect + preflight)

# Follow logs
docker compose logs -f --tail=100 web tutor-mcp oer-mcp ncert-mcp qdrant
```

## Verify

```bash
docker compose ps
# All should be (healthy) after ~45s: web, mongo, redis, tutor-mcp, oer-mcp, ncert-mcp, qdrant

npm run docker:health
# Checks:
#   web /api/health, /api/games
#   tutor-mcp /health + /capabilities
#   oer-mcp /health
#   ncert-mcp /health
#   qdrant /healthz

# Manual health probes (no auth needed)
curl http://127.0.0.1:3001/health        # tutor
curl http://127.0.0.1:3002/health        # oer
curl http://127.0.0.1:3003/health        # ncert
curl http://127.0.0.1:6333/healthz       # qdrant
curl http://localhost:3000/api/health   # web

# Admin health panel (after login at http://localhost:3000/admin)
curl -H "Cookie: lz_admin=<from login>" http://localhost:3000/api/admin/education/health
```

## Development Modes

| Mode | How | MCP URLs |
|---|---|---|
| Host dev (Next.js on host, DB+MCPs in Docker) | `npm run dev` | `http://127.0.0.1:3001` etc. Enable flags, set URLs to localhost ports |
| Full Docker (web in Docker) | `docker compose up -d` | Inside web: `http://tutor-mcp:3001` (compose default, no .env edit needed) |

The gateway works either way; host dev + Docker MCPs is the recommended live-MCP dev mode (fast HMR, real MCPs).

## Provider Enable/Disable

Each MCP is independent:

```env
TUTOR_MCP_ENABLED=true
OER_MCP_ENABLED=true
NCERT_MCP_ENABLED=false  # young-learner MVP doesn't need full CBSE
```

If `false` or URL empty, Learnzzy serves deterministic mocks — child gameplay never breaks.

## Persistent Data

```bash
docker volume ls | findstr learnzzy
# learnzzy_mongo-data, redis-data, tutor-data, oer-data, ncert-data, qdrant-data
```

Rebuild without data loss:

```bash
docker compose up -d --build   # volumes survive
```

Wipe for clean test:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
npm run seed   # repopulate 200 content rows (mongo)
```

## Seeding

```bash
npm run seed
# uses MONGODB_URI from .env.local (127.0.0.1:27018 locally, mongo:27017 in compose)
```

## Troubleshooting

See `MCP-TROUBLESHOOTING.md` for: port conflicts, stale port-forward, auth errors, timeout tuning.
