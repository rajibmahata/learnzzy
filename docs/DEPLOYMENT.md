# Learnzzy — Deployment

## 1. Purpose

This document defines the production deployment architecture, environments, infrastructure, release process, security controls, monitoring, backup strategy, rollback process, and operational procedures for Learnzzy.

The deployment strategy follows the core Learnzzy principle:

> Keep the child experience fast, deterministic, safe, and reliable while AI and agentic automation operate behind the scenes.

Deployment must never make the child gameplay path dependent on an LLM, AI asset generation, or an agent worker being available.

---

## 2. Deployment Goals

The deployment platform must provide:

- Fast startup for the child PWA.
- Reliable gameplay on mobile, tablet, and desktop.
- HTTPS everywhere in production.
- CDN delivery for static assets and generated game assets.
- MongoDB as the primary application database.
- Redis for caching and BullMQ jobs.
- S3-compatible object storage for binary assets.
- Background AI/agent processing.
- Safe and repeatable releases.
- Health checks and observability.
- Automated backup and recovery procedures.
- Ability to roll back a bad release quickly.
- No client-side exposure of AI provider secrets.
- Separation between development, staging, and production.
- Minimal downtime during normal deployments.

---

# 3. Production Architecture

```text
                         Internet
                            |
                            v
                   +-------------------+
                   | Cloudflare / CDN   |
                   | DNS + TLS + Cache  |
                   +---------+---------+
                             |
                             v
                    +----------------+
                    | Nginx / HTTPS  |
                    | Reverse Proxy   |
                    +--------+-------+
                             |
             +---------------+----------------+
             |                                |
             v                                v
      +-------------+                  +---------------+
      | Next.js Web |                  | Admin Routes  |
      | Child PWA   |                  | Protected     |
      +------+------+                  +---------------+
             |
             v
       +-----------+
       | API Layer |
       +-----+-----+
             |
      +------+-------+-------------------+
      |              |                   |
      v              v                   v
 +---------+    +---------+       +-------------+
 | MongoDB |    | Redis   |       | S3 Storage  |
 | Primary |    | Cache + |       | Game Assets |
 | DB      |    | BullMQ  |       +-------------+
 +---------+    +----+----+
                     |
                     v
               +-----------+
               | Workers   |
               | Agents    |
               +-----+-----+
                     |
                     v
               +-----------+
               | AI APIs   |
               | Server    |
               | side only |
               +-----------+

              Observability
        Sentry + Logs + Metrics
```

---

# 4. Technology Baseline

The deployment baseline is:

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| Game Engine | Phaser 3 |
| UI | Tailwind CSS + reusable UI library |
| Backend | Next.js / Node.js |
| Database | MongoDB |
| Cache | Redis |
| Job Queue | BullMQ |
| AI | GPT-5 nano / GPT-5 mini via AI abstraction |
| Object Storage | S3-compatible storage |
| CDN / Edge | Cloudflare |
| Reverse Proxy | Nginx |
| Packaging | Docker |
| Host | VPS |
| Monitoring | Sentry + structured logs |
| Validation | Zod + deterministic business rules |

The exact AI provider, VPS provider, MongoDB hosting provider, Redis provider, and S3 provider remain configurable.

---

# 5. Environment Strategy

Learnzzy should use three logical environments.

## 5.1 Development

Purpose:

- Local development.
- Fast feature implementation.
- Unit and integration testing.
- Local MongoDB/Redis where practical.
- Mock or controlled AI usage.

Typical configuration:

```text
NODE_ENV=development
APP_ENV=development
```

Development must never use production secrets or production databases.

---

## 5.2 Staging

Purpose:

- Production-like validation.
- Release candidate testing.
- PWA testing.
- Mobile/tablet testing.
- Agent workflow testing.
- Database migration testing.
- Performance testing.

Typical configuration:

```text
NODE_ENV=production
APP_ENV=staging
```

Staging should use separate:

- MongoDB database/cluster.
- Redis instance/database.
- S3 bucket/prefix.
- AI credentials where possible.
- Admin accounts.
- Sentry environment.

---

## 5.3 Production

Purpose:

- Real child gameplay.
- Production content pools.
- Production admin operations.
- Production agent workforce.

Typical configuration:

```text
NODE_ENV=production
APP_ENV=production
```

Production credentials and infrastructure must never be reused in development or staging.

---

# 6. Recommended Server Layout

A single VPS can be used for the initial MVP, provided resources are sufficient.

Example:

```text
VPS
├── nginx
├── learnzzy-web
├── learnzzy-worker
├── redis
└── monitoring/logging support
```

MongoDB and object storage should preferably be managed services or separately isolated infrastructure.

For a larger production deployment:

```text
Load Balancer
    |
    +---- Web Instance 1
    |
    +---- Web Instance 2
    |
    +---- Worker Instance 1
    |
    +---- Worker Instance 2
          |
          +---- MongoDB
          +---- Redis
          +---- S3
```

The application must remain stateless so additional web instances can be introduced later.

---

# 7. Docker Strategy

Learnzzy should be packaged using Docker.

Recommended logical images:

```text
learnzzy-web
learnzzy-worker
```

The web image contains:

- Next.js application.
- API routes.
- Child PWA.
- Admin application.

The worker image contains:

- BullMQ workers.
- Content Agent.
- Quality & Safety Agent.
- Asset Agent.
- Analytics Agent.
- Difficulty Agent.
- Scheduled/background processing.

Workers must not be required for ordinary child gameplay.

## 7.1 Current MVP Deployment Files

The repository includes:

- `Dockerfile`: multi-stage Node 20 image running as a non-root user.
- `docker-compose.yml`: web, MongoDB 7, and Redis 7 services.
- `deploy/nginx.conf`: reverse proxy and health route example.
- `.env.example`: server-only AI and admin configuration contract.

Start the baseline with:

```bash
docker compose up --build
```

Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `ADMIN_AUTH_SECRET` before
exposing the admin route. Generate the password hash with:

```bash
node scripts/admin-setup.mjs '<password-min-12-chars>'
```

The current queue registers BullMQ workers lazily when Redis is configured and
falls back to the same retrying handler execution in-process for local
development. A dedicated worker process and managed-service rollout remain
production hardening work.

---

# 8. Docker Build Requirements

Production images should:

- Use a supported Node.js LTS release.
- Use multi-stage builds.
- Install only production dependencies in the runtime image where practical.
- Run as a non-root user.
- Exclude development secrets.
- Exclude local `.env` files from the image.
- Use deterministic dependency installation.
- Include health-check support where appropriate.

Example conceptual stages:

```text
dependencies
      |
      v
builder
      |
      v
runtime
```

---

# 9. Environment Variables

Secrets must be injected at runtime.

Example categories:

```env
APP_ENV=
NODE_ENV=

NEXT_PUBLIC_APP_URL=

MONGODB_URI=
MONGODB_DB_NAME=

REDIS_URL=

S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

AI_API_KEY=
AI_MODEL_CONTENT=
AI_MODEL_COMPLEX=

SENTRY_DSN=
SENTRY_ENVIRONMENT=

SESSION_SECRET=
ADMIN_AUTH_SECRET=
```

Rules:

1. Never commit secrets to Git.
2. Never expose server secrets through `NEXT_PUBLIC_*`.
3. Never send AI API keys to the browser.
4. Never place database credentials in client bundles.
5. Rotate secrets periodically.
6. Use separate credentials for staging and production.
7. Limit credentials to the minimum required permissions.

---

# 10. Domain and DNS

Production should use the Learnzzy domain.

Example:

```text
learnzzy.example
www.learnzzy.example
```

Recommended routing:

```text
https://learnzzy.example
        |
        v
Cloudflare
        |
        v
Nginx
        |
        v
Learnzzy
```

DNS should point to the production edge/server according to the selected Cloudflare configuration.

HTTP should redirect to HTTPS.

---

# 11. Cloudflare / CDN

Cloudflare should provide:

- DNS.
- TLS.
- DDoS protection.
- CDN caching.
- Static asset delivery.
- Optional WAF rules.
- Compression where appropriate.

Cache aggressively for immutable assets.

Recommended asset naming:

```text
/assets/{contentHash}/image.webp
/assets/{contentHash}/game.js
```

Hashed assets can safely use long cache lifetimes.

Do not cache private admin/API responses publicly.

---

# 12. Nginx

Nginx acts as the reverse proxy between the public internet and the application.

Responsibilities:

- TLS termination where applicable.
- HTTP → HTTPS redirect.
- Reverse proxy to Next.js.
- Request size limits.
- Basic rate limiting.
- Security headers.
- Compression where appropriate.
- Access logging.
- Health endpoint routing.

Conceptual routing:

```text
/health       -> Next.js health endpoint
/api/*        -> Next.js API
/admin/*      -> Next.js admin
/*            -> Next.js child PWA
```

Nginx must not contain application business logic.

---

# 13. Health Checks

At minimum provide:

```text
GET /health
GET /api/health
```

Example:

```json
{
  "status": "ok"
}
```

The health system should distinguish between:

### Liveness

Is the application process running?

### Readiness

Can the application safely serve traffic?

Readiness may verify required dependencies such as MongoDB and Redis, but dependency checks should be lightweight.

A temporary AI provider outage should not make the child application unavailable.

---

# 14. Startup and Shutdown

Application startup should:

1. Load validated configuration.
2. Initialize required application services.
3. Connect to MongoDB.
4. Initialize Redis connections where required.
5. Start serving requests only when ready.
6. Emit a structured startup log.

Graceful shutdown should:

1. Stop accepting new work.
2. Finish or safely requeue active background jobs.
3. Close Redis connections.
4. Close MongoDB connections.
5. Flush important logs/telemetry.
6. Exit cleanly.

Workers must not lose jobs during ordinary restarts.

---

# 15. MongoDB Deployment

MongoDB is the authoritative application database.

Production MongoDB should preferably use:

- Managed MongoDB service or properly maintained dedicated MongoDB infrastructure.
- Authentication enabled.
- TLS enabled.
- Automated backups.
- Monitoring.
- Restricted network access.
- Separate application credentials.
- Least-privilege database permissions.

Application configuration:

```text
MONGODB_URI
MONGODB_DB_NAME
```

The application must use the repository/data-access boundary defined in the architecture.

Do not allow admin natural-language commands to execute arbitrary MongoDB queries.

---

# 16. MongoDB Backup

Backups must be automated.

Minimum policy:

- Daily backup.
- Retain multiple backup points.
- Test restoration periodically.
- Keep production backups separate from the application host.
- Encrypt backups where supported.

Recovery planning must define:

```text
RPO = acceptable data loss
RTO = acceptable recovery time
```

Initial MVP targets should be explicitly configured before production launch.

---

# 17. Redis Deployment

Redis is used for:

- Cache.
- BullMQ queue state.
- Background jobs.
- Temporary coordination.

Redis is not the authoritative source for permanent gameplay data.

If Redis is unavailable:

- Child gameplay should continue wherever cached/static content allows.
- API endpoints that require Redis may degrade gracefully.
- Background agent jobs should retry after Redis recovery.
- Permanent data must remain in MongoDB.

---

# 18. BullMQ Workers

BullMQ runs background tasks such as:

```text
content-generation
quality-validation
asset-processing
analytics
difficulty-analysis
pool-refill
```

Example flow:

```text
Admin Command
      |
      v
Agent Task
      |
      v
BullMQ
      |
      v
Worker
      |
      v
Agent
      |
      v
Validation
      |
      v
MongoDB
```

Workers must support:

- Retry.
- Backoff.
- Idempotency.
- Job status.
- Failure handling.
- Dead-letter/error inspection where appropriate.
- Structured logging.

---

# 19. AI Deployment Rules

AI calls are server-side only.

Never:

```text
Browser -> AI provider
```

Use:

```text
Browser
   |
   v
Learnzzy API / Worker
   |
   v
AI Service
   |
   v
AI Provider
```

AI must not be required for:

- Arithmetic.
- Scoring.
- Collision detection.
- Animation.
- Basic interaction.
- Answer validation.
- Immediate gameplay.

AI-generated content must pass:

```text
AI Output
   |
   v
Schema Validation
   |
   v
Deterministic Validation
   |
   v
Quality/Safety Validation
   |
   v
Approved
   |
   v
Active
```

---

# 20. Content Pool Deployment

The production system should maintain pre-generated content pools.

Initial target pools are documented in `DATABASE.md`.

The deployment must support:

```text
Pool healthy
      |
      v
No action

Pool below threshold
      |
      v
BullMQ refill job
      |
      v
Content Agent
      |
      v
Validation
      |
      v
MongoDB
```

A low content pool must never cause a child to wait synchronously for an LLM.

If a pool is temporarily exhausted, the application should use approved reusable content according to the content reuse rules rather than block gameplay.

---

# 21. Asset Deployment

Binary assets should be stored in S3-compatible object storage.

MongoDB stores:

- Asset ID.
- Version.
- Type.
- Dimensions.
- MIME type.
- Hash.
- Status.
- Tags.
- Storage key.
- CDN URL/reference metadata.

Example:

```text
S3
└── learnzzy/
    ├── games/
    ├── puzzles/
    ├── clean-up/
    ├── sketch/
    └── generated/
```

Assets should be:

- Optimized.
- Validated.
- Versioned.
- Content-hashed where practical.
- Served through CDN.

---

# 22. PWA Deployment

The production deployment must support:

- Web App Manifest.
- Service Worker.
- Installability.
- Cached application shell.
- Cached critical game assets.
- Offline-friendly gameplay where supported.
- Background synchronization of gameplay events where supported.

Offline behavior must never claim that server-side work completed when it did not.

Events created offline should be stored locally and synchronized when connectivity returns.

Server-side event processing must be idempotent.

---

# 23. Deployment Pipeline

Recommended pipeline:

```text
Developer
   |
   v
Git Push
   |
   v
CI
   |
   +--> Type Check
   +--> Lint
   +--> Unit Tests
   +--> Integration Tests
   +--> Build
   +--> Security Checks
   |
   v
Docker Image
   |
   v
Registry
   |
   v
Staging
   |
   v
Smoke Tests
   |
   v
Production Approval
   |
   v
Production Deployment
   |
   v
Health Checks
   |
   v
Release Complete
```

---

# 24. CI Checks

Every production-bound change should pass:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Where configured, also run:

- Dependency vulnerability scanning.
- Container scanning.
- Secret scanning.
- Integration tests.
- API contract tests.
- PWA checks.
- Accessibility checks.
- Critical gameplay tests.

A failed required check blocks deployment.

---

# 25. Git Strategy

Use protected branches.

Recommended:

```text
main
develop
feature/*
fix/*
```

Production deployments should come from a known, reviewed commit.

Every production deployment should have a release identifier.

Example:

```text
learnzzy-v1.0.0
```

or:

```text
commit: abc1234
```

---

# 26. Release Process

Before release:

1. Confirm CI is green.
2. Confirm database migrations are ready.
3. Confirm environment variables exist.
4. Confirm content pools are healthy.
5. Confirm asset/CDN availability.
6. Confirm backup status.
7. Deploy to staging.
8. Run smoke tests.
9. Test mobile/iPad/desktop critical flows.
10. Approve production deployment.

Production:

1. Pull the approved image.
2. Start the new application container.
3. Run health checks.
4. Route traffic to the new version.
5. Monitor errors.
6. Confirm child gameplay.
7. Confirm admin login.
8. Confirm worker health.
9. Confirm queues are processing.

---

# 27. Zero/Low Downtime Deployment

Where infrastructure permits:

```text
Current Version
      |
      | still serving
      v
New Version starts
      |
      v
Health check
      |
      v
Traffic switches
      |
      v
Old Version drains
      |
      v
Old Version stops
```

Do not terminate the currently healthy application before the replacement passes readiness checks.

For a small single-VPS deployment, a short controlled restart may be acceptable during MVP, but the architecture should remain compatible with rolling deployment later.

---

# 28. Database Migrations

MongoDB schema evolution must be backward-compatible whenever possible.

Preferred sequence:

```text
1. Deploy code that supports old + new shape.
2. Migrate existing data.
3. Verify migration.
4. Enable new behavior.
5. Remove old compatibility code later.
```

Avoid deploying a new application version that immediately requires fields that old documents do not contain.

Every migration should be:

- Versioned.
- Repeat-safe where possible.
- Logged.
- Tested in staging.
- Recoverable.

---

# 29. Rollback Strategy

Rollback must be possible without rebuilding the application.

Keep previous production images available.

Example:

```text
Current
learnzzy-web:v1.4.0

Previous
learnzzy-web:v1.3.2
```

Rollback procedure:

```text
Detect incident
      |
      v
Stop new release
      |
      v
Restore previous image
      |
      v
Health check
      |
      v
Verify gameplay
      |
      v
Monitor
```

Database changes must be designed carefully because application rollback and database rollback are different operations.

Prefer backward-compatible migrations over destructive schema changes.

---

# 30. Incident Severity

Suggested levels:

### SEV-1

Major child-facing outage or severe data/security incident.

Examples:

- Site unavailable.
- Gameplay broadly broken.
- Data corruption.
- Critical security breach.

### SEV-2

Significant degradation.

Examples:

- Major game unavailable.
- Admin system unavailable.
- High error rate.
- Agent system failing continuously.

### SEV-3

Limited issue.

Examples:

- One game has a defect.
- Non-critical analytics issue.
- Minor admin UI problem.

### SEV-4

Low-impact defect or improvement.

---

# 31. Monitoring

Monitor at least:

### Application

- Request count.
- Error rate.
- Response latency.
- HTTP status codes.
- Startup failures.
- Memory usage.
- CPU usage.

### Gameplay

- Session starts.
- Game starts.
- Completion rate.
- Error rate.
- Event ingestion failures.
- Offline sync failures.

### Content

- Pool size.
- Generation success.
- Validation rejection rate.
- Content activation rate.
- Duplicate rate.

### Agents

- Queue depth.
- Job latency.
- Success/failure rate.
- Retry count.
- Worker availability.
- AI token usage.
- Estimated AI cost.

### Infrastructure

- CPU.
- RAM.
- Disk.
- Network.
- MongoDB health.
- Redis health.
- Object storage availability.

---

# 32. Sentry

Sentry should be used for application error monitoring.

Configure separate environments:

```text
development
staging
production
```

Errors should include useful context such as:

- Request ID.
- Route.
- Game ID where relevant.
- Content ID where relevant.
- Agent task ID where relevant.
- Release version.

Do not send unnecessary child PII to Sentry.

---

# 33. Structured Logging

Use structured JSON-style logs.

Example:

```json
{
  "level": "info",
  "event": "game_completed",
  "gameId": "addition",
  "sessionId": "session_123",
  "release": "v1.2.0"
}
```

Logs should avoid:

- Passwords.
- API keys.
- Authentication tokens.
- AI secrets.
- Unnecessary child information.
- Full prompt contents when not operationally required.

---

# 34. Security

Production security requirements:

- HTTPS only.
- Secure cookies.
- Strong admin authentication.
- Role-based authorization.
- Rate limiting.
- Input validation.
- Output validation.
- Security headers.
- Dependency updates.
- Firewall configuration.
- Restricted database access.
- Restricted Redis access.
- Secrets outside Git.
- Regular credential rotation.
- Audit logging for consequential admin actions.

The browser is never trusted for:

- Scores.
- Difficulty.
- Completion claims.
- Administrative authorization.
- Content activation.

---

# 35. Admin Deployment

Admin routes must be protected.

Required routes include:

```text
/admin/login
/admin
/admin/agents
/admin/content
/admin/assets
/admin/analytics
/admin/difficulty
/admin/system
/admin/settings
```

Natural-language admin commands must pass through:

```text
Authentication
      |
      v
Authorization
      |
      v
Intent Parsing
      |
      v
Permission Check
      |
      v
Confirmation if required
      |
      v
Agent Task
      |
      v
Execution
      |
      v
Audit Log
```

Natural language must never become unrestricted database access.

---

# 36. Agent Worker Security

Agents must use least privilege.

Example:

| Agent | Required access |
|---|---|
| Content | Content generation collections |
| Quality/Safety | Read candidate content, write validation result |
| Asset | Asset metadata/storage workflow |
| Analytics | Read event/aggregate data |
| Difficulty | Read analytics, write recommendations |

Agents should not have unrestricted production shell, database, or filesystem access.

---

# 37. Rate Limiting

Rate limit:

- Public APIs.
- Session creation.
- Event ingestion.
- Admin commands.
- Content generation requests.
- Asset generation.
- Authentication endpoints.

Expensive AI operations should have stricter limits.

A malicious or accidental request must not create uncontrolled AI expenditure.

---

# 38. AI Cost Protection

AI usage must be tracked.

Record:

```text
provider
model
task type
request count
input tokens
output tokens
estimated cost
timestamp
status
```

Recommended routing:

```text
Simple structured task
        |
        v
GPT-5 nano

More complex task
        |
        v
GPT-5 mini
```

The exact model mapping remains configurable.

Never use a more expensive model when the task does not require it.

---

# 39. Production Content Safety

Deployment must not automatically make arbitrary AI output playable.

Only content with:

```text
status = active
```

should enter the child gameplay pool.

Required sequence:

```text
draft
  |
validating
  |
approved
  |
active
```

Rejected or disabled content must not be served to children.

---

# 40. Disaster Recovery

Disaster scenarios include:

- VPS failure.
- MongoDB failure.
- Redis failure.
- S3 failure.
- Cloudflare/DNS issue.
- Bad deployment.
- Data corruption.
- Credential compromise.

Recovery priority:

```text
1. Protect children and stop harmful behavior.
2. Restore application availability.
3. Restore MongoDB.
4. Restore required Redis/job infrastructure.
5. Restore asset/CDN access.
6. Resume background agents.
7. Verify data integrity.
8. Resume normal operations.
```

---

# 41. Redis Recovery

Redis contains temporary/cache/job state and should not be treated as the source of truth.

After Redis recovery:

- Reconnect application.
- Reconnect workers.
- Reconcile pending background operations where required.
- Rebuild cache from MongoDB.
- Verify BullMQ queues.
- Resume pool refill and agent jobs.

Permanent gameplay records remain in MongoDB.

---

# 42. MongoDB Recovery

After restoring MongoDB:

1. Verify connectivity.
2. Verify collection/index availability.
3. Verify critical invariants.
4. Verify content statuses.
5. Verify game configurations.
6. Verify admin records.
7. Verify event ingestion.
8. Run application health checks.
9. Enable normal traffic.

Do not immediately enable all agents until the database is confirmed healthy.

---

# 43. Maintenance Mode

A controlled maintenance mechanism should be available.

Example configuration:

```text
maintenance.enabled = true
```

During maintenance:

- Child users should receive a friendly maintenance experience.
- Admin emergency access should remain available where safe.
- APIs should return a clear maintenance response.
- Existing local/offline functionality should behave safely.
- No false completion should be reported.

---

# 44. Operational Runbooks

Create runbooks for:

```text
RUNBOOK-001 Application outage
RUNBOOK-002 High API error rate
RUNBOOK-003 MongoDB unavailable
RUNBOOK-004 Redis unavailable
RUNBOOK-005 Worker/queue failure
RUNBOOK-006 AI provider outage
RUNBOOK-007 Content pool exhaustion
RUNBOOK-008 Bad deployment rollback
RUNBOOK-009 Security incident
RUNBOOK-010 Backup restoration
```

Each runbook should define:

- Symptoms.
- Detection.
- Immediate action.
- Verification.
- Recovery.
- Rollback.
- Post-incident actions.

---

# 45. AI Provider Outage

An AI provider outage must not take Learnzzy gameplay offline.

Expected behavior:

```text
AI unavailable
     |
     +--> Existing approved content continues
     |
     +--> Cached content continues
     |
     +--> New content generation pauses/retries
     |
     +--> Agent jobs enter retry/backoff
     |
     +--> Admin sees degraded AI status
```

The child should not see an AI error merely because background generation is unavailable.

---

# 46. Content Pool Exhaustion

If a pool becomes empty:

1. Log the event.
2. Trigger refill.
3. Use approved reusable content where allowed.
4. Do not synchronously call the LLM.
5. Do not expose internal generation errors to children.
6. Alert the admin system if the condition persists.

---

# 47. Performance Deployment Requirements

Production should optimize:

- Initial JavaScript.
- Phaser loading.
- Image sizes.
- Asset formats.
- CDN caching.
- API latency.
- Database indexes.
- Content prefetching.
- Lazy loading.
- Route-level code splitting.

Child gameplay should not wait for:

- AI generation.
- Analytics aggregation.
- Agent execution.
- Admin operations.

---

# 48. Mobile and Tablet Verification

Before production release, test at minimum:

- Android phone.
- iPhone.
- iPad.
- Android tablet.
- Desktop browser.

Test:

- Touch interactions.
- Orientation changes.
- Safe areas.
- PWA installation.
- Offline shell.
- Resume after backgrounding.
- Slow network.
- Reconnection.
- Game completion.
- Event synchronization.

---

# 49. Production Smoke Test

After every production deployment:

```text
1. GET /health
2. GET /api/health
3. Open home page
4. Start a session
5. Open Numbers
6. Complete one activity
7. Verify animation
8. Verify answer validation
9. Verify completion event
10. Verify admin login
11. Verify worker status
12. Verify queue processing
```

A failed critical smoke test should trigger rollback evaluation.

---

# 50. Deployment Checklist

## Infrastructure

- [ ] VPS/server ready.
- [ ] Firewall configured.
- [ ] Docker installed.
- [ ] Nginx configured.
- [ ] Cloudflare configured.
- [ ] HTTPS working.
- [ ] MongoDB ready.
- [ ] Redis ready.
- [ ] S3 storage ready.

## Application

- [ ] Production build passes.
- [ ] Environment variables configured.
- [ ] Health endpoints work.
- [ ] PWA manifest works.
- [ ] Service worker works.
- [ ] Static assets load.
- [ ] API responds correctly.

## Security

- [ ] No secrets in Git.
- [ ] Admin authentication enabled.
- [ ] Authorization enabled.
- [ ] Rate limiting enabled.
- [ ] Database access restricted.
- [ ] Redis access restricted.
- [ ] HTTPS enforced.
- [ ] Security headers configured.

## AI/Agents

- [ ] AI keys are server-side.
- [ ] AI model configuration verified.
- [ ] AI cost tracking enabled.
- [ ] BullMQ workers running.
- [ ] Retry/backoff configured.
- [ ] Agent permissions verified.
- [ ] Content validation enabled.

## Data

- [ ] MongoDB backup verified.
- [ ] Indexes verified.
- [ ] Content pool healthy.
- [ ] Asset storage verified.
- [ ] Event ingestion verified.

## Observability

- [ ] Sentry configured.
- [ ] Structured logging enabled.
- [ ] Health checks monitored.
- [ ] Worker/queue monitoring enabled.
- [ ] AI usage monitoring enabled.

## Release

- [ ] Staging passed.
- [ ] Smoke tests passed.
- [ ] Release version recorded.
- [ ] Rollback image available.
- [ ] Production deployment approved.

---

# 51. MVP Deployment Topology

For the initial Learnzzy MVP, keep infrastructure intentionally simple.

Recommended:

```text
Cloudflare
    |
    v
Single VPS
├── Nginx
├── Next.js Web Container
├── BullMQ Worker Container
└── Redis Container

Managed Services
├── MongoDB
└── S3-compatible Storage
```

This minimizes operational complexity while preserving the architecture needed to scale.

As traffic grows:

```text
Cloudflare
    |
Load Balancer
    |
+-------------------+
|                   |
v                   v
Web 1              Web 2
|                   |
+---------+---------+
          |
      MongoDB
          |
       Redis
          |
    +-----+-----+
    |           |
 Worker 1    Worker 2
```

---

# 52. Scaling Strategy

Scale in this order:

### Stage 1 — MVP

- Single web instance.
- Single worker.
- Managed MongoDB.
- Redis.
- S3.
- Cloudflare.

### Stage 2 — Growing traffic

- Separate web and worker resources.
- Increase MongoDB capacity.
- Increase Redis capacity.
- CDN optimization.
- Add second web instance.

### Stage 3 — Production scale

- Multiple web instances.
- Multiple workers.
- Dedicated queue workers by workload.
- MongoDB replica/managed scaling.
- Redis high availability.
- More advanced observability.
- Dedicated analytics infrastructure if needed.

The application should not require a major rewrite between stages.

---

# 53. Deployment Invariants

The following are mandatory:

1. MongoDB remains the primary persistent database.
2. Redis is not the source of truth for permanent data.
3. AI keys remain server-side.
4. Child gameplay never depends synchronously on AI.
5. Arithmetic remains deterministic.
6. Browser state is never authoritative for scoring.
7. Only approved/active content is playable.
8. AI-generated content is validated before activation.
9. Background jobs are retryable and observable.
10. Admin actions are authenticated and authorized.
11. Consequential admin operations require confirmation.
12. Production secrets are never committed to Git.
13. Deployments must be health-checked.
14. A previous application release must remain available for rollback.
15. Database changes should be backward-compatible whenever practical.
16. Child privacy remains a deployment requirement, not only an application feature.
17. Monitoring must not collect unnecessary child PII.
18. An AI outage must not make existing gameplay unavailable.

---

# 54. Definition of Done — Deployment

Deployment infrastructure is considered ready when:

- [ ] Development, staging, and production environments are separated.
- [ ] Docker production images build successfully.
- [ ] Nginx reverse proxy is configured.
- [ ] Cloudflare/DNS/HTTPS is configured.
- [ ] MongoDB production access is secured.
- [ ] Redis and BullMQ are operational.
- [ ] S3-compatible storage is operational.
- [ ] PWA is installable.
- [ ] Health endpoints work.
- [ ] CI/CD pipeline passes.
- [ ] Production smoke tests pass.
- [ ] Sentry and structured logs are active.
- [ ] Backups are automated.
- [ ] Restore procedure is tested.
- [ ] Rollback procedure is tested.
- [ ] AI secrets are server-side.
- [ ] Agent workers are running safely.
- [ ] Content pool refill works asynchronously.
- [ ] AI outage behavior is verified.
- [ ] Mobile/iPad/desktop critical flows pass.
- [ ] Security checklist is complete.

---

# 55. Final Deployment Principle

Learnzzy should deploy as a **reliable deterministic learning application with an asynchronous AI workforce**, not as an AI application that happens to contain games.

The production hierarchy is:

```text
Cloudflare / CDN
       |
     Nginx
       |
   Next.js PWA/API
       |
+------+----------------+
|                       |
v                       v
MongoDB               Redis
|                       |
v                       v
Persistent data      BullMQ
                        |
                        v
                    AI Agents
                        |
                        v
              Validated Content/Assets
                        |
                        v
                     MongoDB
```

The child experience remains the highest-priority runtime path.

AI, agents, analytics, content generation, asset generation, and difficulty analysis remain asynchronous supporting systems.

**Core deployment rule:**

> If the AI workforce stops, Learnzzy should still be able to play approved games.
