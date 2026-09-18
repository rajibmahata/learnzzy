# Learnzzy MCP Troubleshooting

## Quick Diagnostics

```bash
docker compose ps
# All should show (healthy). If not:
docker compose logs --tail=100 tutor-mcp oer-mcp ncert-mcp qdrant mongo redis web
```

## Common Failures

### 1. `docker` shadowing on Windows (`C:\windows\system32\docker`)

**Symptom:** `docker compose` prints a document error instead of running.  
**Cause:** Windows `system32/docker` (containers feature) shadows `docker.exe`.  
**Fix:** Call explicit path (`docker.exe` or full Docker Desktop path) or delete/rename the shim. The project handles this via `run.bat docker`.

### 2. Port Conflicts (3000, 27018, 6379, 3001–3003, 6333)

**Symptom:** `address already in use`.  
**Fix:**

```bash
netstat -ano | findstr :3000
docker ps  # is an old learnzzy-web-1 squatting :3000 with --port-forward?
docker compose down
# Kill stray local mongod on 27017 if it blocks mapped 27018's inner port
```

Local dev needs `27018` for mongo host; in-Docker DNS stays `mongo:27017`.

### 3. MCP `unreachable` / `MCP_UNAVAILABLE`

**Checks:**

```bash
curl http://127.0.0.1:3001/health  # tutor
curl http://127.0.0.1:3002/health  # oer
curl http://127.0.0.1:3003/health  # ncert
docker compose exec tutor-mcp wget -qO- http://127.0.0.1:3001/health
docker compose exec web wget -qO- http://tutor-mcp:3001/health  # DNS test
```

**Causes:**
- MCP not started: `docker compose logs tutor-mcp`.
- Network isolation: all services must share `learnzzy` network (check `docker compose config | grep -A2 networks`).
- Auth mismatch: web's `TUTOR_MCP_API_KEY` must equal MCP's `PROVIDER_API_KEY` (same value in compose env). Mismatch → 401 `MCP_AUTH_ERROR`.

### 4. Auth Errors (401)

**Symptom:** Admin panel shows `unreachable` with lastError `MCP_AUTH_ERROR`.  
**Fix:** Set the *same* API key in both web and MCP envs:

```yaml
web: TUTOR_MCP_API_KEY=${TUTOR_MCP_API_KEY}
tutor-mcp: PROVIDER_API_KEY=${TUTOR_MCP_API_KEY}
```

Rotate via `.env` + `docker compose up -d`.

### 5. Timeout (`MCP_TIMEOUT`)

**Symptom:** `after 5000ms`.  
**Fix:** Increase `EDUCATION_GATEWAY_TIMEOUT_MS` (e.g. 8000) or investigate MCP CPU starvation (`docker stats`). Gateway retries twice (exponential 250/500ms), then serves cache/Mongo/mock — gameplay stays up.

### 6. Response Too Large

**Symptom:** `MCP_RESPONSE_TOO_LARGE` (>256 KiB).  
**Fix:** Provider must paginate; gateway never raises the cap (metadata only).

### 7. Stale Data / Wrong Learner (schema)

**Symptom:** `MCP_INVALID_RESPONSE: Tutor returned state for the wrong learner`.  
**Fix:** Tutor MCP validates `learnerId` echo; check evidence payload (`learnerId` header). Mock mode bypasses this.

### 8. Tutor Evidence Not Persisting

**Check:**

```bash
docker compose exec tutor-mcp cat /data/tutor/tutor-evidence.json | head
docker volume inspect learnzzy_tutor-data
```

If `down -v` was used, volume was wiped — re-seed is not needed (evidence rebuilds from gameplay), but counts reset.

### 9. Qdrant Unhealthy

```bash
curl http://127.0.0.1:6333/healthz
docker compose logs qdrant
```

NCERT works without Qdrant (file fallback); Qdrant is optional until real vectors are loaded.

### 10. Child Gameplay Broken When MCP Down

**Should never happen.** Gateway fallback is deterministic. If it does:

- Check `src/integrations/education/gateway.ts` still catches → Mongo knowledge cache → `[]`.
- Ensure `TUTOR_MCP_ENABLED=false` path returns mock (registry).
- Check Sentry for `MCP_...` breadcrumbs, not gameplay errors.

### 11. Admin Panel Shows `disabled`

Expected when flags are `false`. To enable:

```bash
# .env
TUTOR_MCP_ENABLED=true
TUTOR_MCP_URL=http://tutor-mcp:3001   # inside Docker; host dev uses http://127.0.0.1:3001
docker compose up -d  # recreates web with new env
```

### 12. Build Failures (MCP)

```bash
docker compose build --no-cache tutor-mcp oer-mcp ncert-mcp
```

MCP image is `node:20-alpine` + stdlib only; no native deps, so `better-sqlite3` issues do not apply.

### 13. Logs

```bash
docker compose logs -f web tutor-mcp oer-mcp ncert-mcp
docker compose logs --tail=200 qdrant
# Prod (json-file, 10MiB x3):
docker logs learnzzy-web-1 --tail=200
```

Audit: Admin → Education providers panel shows `lastSuccessAt`, `lastFailureAt`, `lastErrorCode`, `errorCount24h`, `latencyMs`.

### Getting Help

Collect:

```bash
docker compose ps
docker compose config | head -n 80
npm run docker:health
docker compose logs --tail=100 tutor-mcp oer-mcp ncert-mcp
```
