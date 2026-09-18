# Learnzzy MCP VPS Deployment

**Parity rule:** VPS uses the same `docker-compose.yml` + `docker-compose.prod.yml` override as local. Only host-port exposure and TLS differ.

## Architecture on VPS

```
Internet
  ↓ 443/tcp
Nginx (host or container, TLS termination)
  ↓ http://127.0.0.1:3000
Learnzzy web (private)
  ↓ learnzzy network (no host ports)
Tutor/OER/NCERT/Qdrant/Mongo/Redis (private)
```

Only Nginx is public. MCPs never get public `location /tutor-mcp` blocks (intentional).

## Steps

### 1. Provision VPS

- Ubuntu 22.04+, Docker Engine + Compose plugin, Nginx (or host Nginx as in `deploy/nginx.prod.conf`).

### 2. Copy Repository + Secrets

```bash
git clone <repo> /opt/learnzzy && cd /opt/learnzzy
cp .env.example .env
# Edit .env on the VPS — never commit:
#   NEXT_PUBLIC_APP_URL=https://learnzzy.example.com
#   ADMIN_EMAIL, ADMIN_PASSWORD_HASH (via node scripts/admin-setup.mjs), ADMIN_AUTH_SECRET, PARENT_AUTH_SECRET
#   TUTOR_MCP_ENABLED=true
#   TUTOR_MCP_URL=http://tutor-mcp:3001
#   TUTOR_MCP_API_KEY=<strong random>
#   OER_MCP_ENABLED=true
#   OER_MCP_URL=http://oer-mcp:3002
#   OER_MCP_API_KEY=<strong random>
#   NCERT_MCP_ENABLED=false  # young-learner default
#   EDUCATION_GATEWAY_TIMEOUT_MS=5000
#   AI_API_KEY, SENTRY_DSN (optional)
#   COOKIE_SECURE is forced true in prod compose
```

Generate admin hash:

```bash
node scripts/admin-setup.mjs '<12+ char password>'
# Paste ADMIN_PASSWORD_HASH + ADMIN_AUTH_SECRET into .env
```

### 3. TLS (choose one)

- **Cloudflare proxy (orange cloud):** Nginx can stay on port 80 behind Cloudflare TLS; still set `COOKIE_SECURE=true` because `X-Forwarded-Proto: https`.
- **Let's Encrypt on VPS:** `certbot --nginx -d learnzzy.example.com`, then use `deploy/nginx.prod.conf` (replace `<production-domain>` and cert paths).

### 4. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps   # expect 7 services healthy (web + 3 MCPs + qdrant + mongo + redis)
docker compose logs --tail=100 web tutor-mcp oer-mcp ncert-mcp
npm run docker:health   # from deploy host against 127.0.0.1:3000
curl -f https://learnzzy.example.com/api/health
```

### 5. Seed & Verify Learning

```bash
# Seed content (uses VPS MONGODB_URI)
npm run seed

# Admin panel
# https://learnzzy.example.com/admin → login → Education providers panel
# Should show: tutor-mcp healthy, oer-mcp healthy, ncert-mcp disabled (or healthy if enabled)

# Child smoke (anonymous, no DB required)
curl https://learnzzy.example.com/api/games
```

## Prod Differences from Local

| Aspect | Local (`docker-compose.yml`) | VPS (`+ docker-compose.prod.yml`) |
|---|---|---|
| Host ports | 3000, 27018, 6379, 3001-3003, 6333 bound to 127.0.0.1 | Only Nginx 80/443 public; web 127.0.0.1:3000; Mongo/Redis/MCP/Qdrant `ports: []` (internal only) |
| Logs | stdout | `json-file` 10 MiB ×3 |
| Cookies | `COOKIE_SECURE=false` | `true` |
| Volumes | same named volumes | same |

## Updates

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
```

No data loss (volumes survive). Large NCERT/Qdrant data is not re-downloaded.

## Backup

```bash
npm run backup           # driver-based JSON dumps (see scripts/backup.mjs)
# Volumes: regular host backup of /var/lib/docker/volumes/learnzzy_mongo-data etc. is recommended.
```

## Rollback

Feature flags are instant: set `TUTOR_MCP_ENABLED=false` in `.env`, `docker compose ... up -d` (no rebuild). Learnzzy falls back to mocks.
