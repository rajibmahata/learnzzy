# Learnzzy — Known Issues

**Document:** Known Issues & Risk Register  
**Version:** 1.1  
**Status:** Active / Living Document  
**Last Updated:** 2026-09-17

---

## 1. Purpose

This document records known, suspected, or anticipated issues in Learnzzy.

It prevents the development team and coding agents from treating an unverified area as complete.

This file should contain only issues that are:

- observed in implementation/testing;
- explicitly accepted as a current limitation;
- known architectural/product risks;
- or intentionally deferred.

Do not invent bugs to populate this document.

---

# 2. Status Legend

| Status | Meaning |
|---|---|
| `OPEN` | Known issue requiring action |
| `INVESTIGATING` | Root cause is being investigated |
| `BLOCKED` | Cannot proceed because of a dependency |
| `DEFERRED` | Intentionally postponed |
| `MITIGATED` | Workaround/control exists |
| `RESOLVED` | Verified fixed |
| `WONT_FIX` | Deliberately accepted |

---

# 3. Severity

| Severity | Meaning |
|---|---|
| `P0` | Critical: security, data loss, production blocker, unsafe child experience |
| `P1` | High: core gameplay/product functionality materially affected |
| `P2` | Medium: important UX, performance, operational, or maintainability issue |
| `P3` | Low: enhancement, polish, or non-critical limitation |

---

# 4. Current Known Issues

At the time this document was created, no implementation-specific defect should be marked as confirmed unless verified against the current codebase.

| ID | Issue | Severity | Status | Area | Workaround / Next Action |
|---|---|---:|---|---|---|
| KI-001 | No implementation defect should be inferred from architecture documents alone | P0 | OPEN | Governance | Verify against actual implementation before logging a concrete defect |
| KI-002 | Exact production difficulty thresholds are not finalized | P2 | DEFERRED | Difficulty | Keep thresholds configurable and use approved baseline rules |
| KI-003 | Exact reward values are not finalized | P2 | DEFERRED | Rewards | Keep reward configuration external to game logic |
| KI-004 | Exact content-pool thresholds require production tuning | P2 | DEFERRED | Content | Use configurable minimum/target/batch values |
| KI-005 | Exact AI provider implementation is not fixed | P2 | DEFERRED | AI | Keep AI behind `AIService` abstraction |
| KI-006 | Exact admin authentication provider is not fixed | P1 | DEFERRED | Admin | Preserve authentication boundary and secure server-side sessions |
| KI-007 | Exact analytics warehouse is not fixed | P2 | DEFERRED | Analytics | MongoDB remains source of operational analytics until a future warehouse is justified |
| KI-008 | AI drawing evaluation is intentionally outside MVP | P2 | DEFERRED | Sketch | Use deterministic initial evaluation |
| KI-009 | Advanced adaptive learning is intentionally outside MVP | P2 | DEFERRED | Learning | Use configurable difficulty and recommendations |
| KI-010 | Large-scale localization is intentionally outside MVP | P3 | DEFERRED | Content | Design content structures so localization can be added later |
| KI-011 | Stitch MCP unavailable in this environment; screens 10–11 (Learner Setup & Parent Link, Parent Learning Journey) fetched from docs, not live | P2 | MITIGATED | Design | Parent/learner UI built from existing components + UI.md; re-verify against live Stitch when MCP access exists |
| KI-012 | Playwright browser download fails on small disks (ENOSPC) | P2 | MITIGATED | QA | e2e runs on system Chrome via channel (`PLAYWRIGHT_CHROME_PATH` override supported) |
| KI-013 | Live Tutor/OER/NCERT servers not deployed; gateway uses deterministic mocks | P2 | MITIGATED | Integrations | All providers disabled by default; mocks implement the same validated interfaces; wire URLs/keys to go live |
| KI-014 | Stale dev/prod servers on :3000 poison Playwright runs via reuseExistingServer | P2 | RESOLVED | QA | Kill stale node processes before e2e; health-check-only reuse documented in playwright.config |
| KI-015 | Redis outage hung API requests (ioredis infinite reconnect + never-settling init promises) | P1 | RESOLVED | Resilience | Fail-fast clients (no reconnect, 500ms–1s ping probe, op timeouts) + 10s negative-result caching in limiter, education cache, queue bootstrap |
| KI-016 | Secure session cookies broke all logins over local Docker HTTP | P1 | RESOLVED | Auth | `COOKIE_SECURE=false` in base compose for local HTTP; `"true"` in prod override; Secure stays the default |
| KI-017 | `scene.events.once` on unbooted scenes crashed all 5 Phaser games silently (white stages, zero console output) | P0 | RESOLVED | Games | Readiness via Game `ready` event; catch now warns; `e2e/canvas.spec.ts` guards regression. See `SKETCH_DOCKER_ROOT_CAUSE.md` |
| KI-018 | `$` delimiters in password hashes corrupted by compose dotenv + Next dotenv-expand (`$VAR` interpolation) | P1 | RESOLVED | Auth | Hash format changed to `scrypt:<salt>:<hex>`; old hashes invalid |
| KI-019 | Academic-plan APIs verified at unit/build level only; live-Mongo E2E (Learn→Master→Parent loop via `run.bat docker`) not yet run — dev-server probe without Mongo returns 404 for learner reads by design (pre-existing no-DB fallback) | P1 | OPEN | Academic | Unit 156/156 + `next build` green; run `docker compose up --build`, seed, then exercise `/academic/plan|recommendation|voice|result` with a real learnerId |
| KI-020 | `voiceAssets` rows queue as `status: pending` with `audioUrl: null` — no real TTS binary generation pipeline yet; playback uses device speechSynthesis | P2 | DEFERRED | Voice | Cache contract + deterministic keys implemented and tested; generation/CDN upload is content-pipeline work, gameplay never waits for it |
| KI-021 | Stitch screens 12–20 (Living Wonder set) retrieved live 2026-09-18 (7 HTML + 9 screenshots via Stitch MCP + `curl -L`); pixel parity intentionally NOT claimed — deviations logged (DEC-187) | P2 | RESOLVED | Design | Cache + optimized WebP postcards in place; see STITCH_INSTRUCTIONS.md retrieval status |
| KI-022 | Bare `docker` resolves to `C:\windows\system32\docker` in this shell (known run.bat trap); production image build verified 2026-09-18 via explicit `docker.exe` path (`learnzzy:stitch-check` built OK, daemon 29.8.0) | P2 | MITIGATED | Deploy | Invoke `docker.exe` by full path, or delete the shadowing file from an elevated prompt and rerun `run.bat docker` for full-stack verification |

**Important:** KI-002 through KI-010 are scope/decision limitations, not confirmed software bugs.

---

# 5. Architectural Risks to Watch

## KI-RISK-001 — Live AI accidentally enters gameplay

**Severity:** P0  
**Status:** OPEN — continuous architectural guardrail

Gameplay must never wait for an LLM request.

Check:

```text
Child
  ↓
Game
  ↓
Validated Content
  ↓
Deterministic Logic
```

Not:

```text
Child
  ↓
LLM
  ↓
Answer
```

---

## KI-RISK-002 — Browser becomes source of truth

**Severity:** P0  
**Status:** OPEN — continuous architectural guardrail

The browser must not be trusted for protected:

- scoring;
- progression;
- answer correctness;
- game configuration.

---

## KI-RISK-003 — Invalid AI content reaches active pool

**Severity:** P0  
**Status:** OPEN — continuous architectural guardrail

Required:

```text
AI output
  ↓
Schema validation
  ↓
Deterministic validation
  ↓
Quality/safety validation
  ↓
Approval where required
  ↓
Active
```

---

## KI-RISK-004 — Agent receives excessive permissions

**Severity:** P0  
**Status:** OPEN — continuous architectural guardrail

Agents must use least privilege.

Consequential operations require authorization and confirmation where configured.

---

## KI-RISK-005 — Asset generation becomes expensive or slow

**Severity:** P1  
**Status:** OPEN — operational risk

Mitigation:

```text
Search existing asset
  ↓
Reuse
  ↓
Generate only if needed
  ↓
Validate
  ↓
Optimize
  ↓
Store/CDN
```

---

## KI-RISK-006 — Offline events are duplicated

**Severity:** P1  
**Status:** OPEN — design risk

Use client-generated event IDs and idempotent server ingestion.

---

# 6. Product Limitations

Current intentional limitations include:

- No mandatory child account.
- No public child profiles.
- No child-to-child public chat.
- No intrusive gameplay advertising.
- No pay-to-progress.
- No gambling-like reward mechanics.
- No advanced AI tutor in MVP.
- No detailed individual child behavioral profiling.
- No requirement for live AI during play.

These are product boundaries, not defects.

---

# 7. How to Add a New Issue

Every new issue should include:

```text
ID
Title
Severity
Status
Area
Environment
Observed behavior
Expected behavior
Reproduction steps
Impact
Root cause (if known)
Workaround
Proposed fix
Affected documents
Affected backlog IDs
Owner
Created date
Updated date
```

Example:

```markdown
## KI-011 — Puzzle drag offset on iPad landscape

**Severity:** P1
**Status:** OPEN
**Area:** Puzzle
**Environment:** iPad / Safari / landscape

### Observed
...

### Expected
...

### Reproduction
1. ...
2. ...
3. ...

### Impact
...

### Proposed fix
...

### Related
- BACKLOG.md: LZ-081
- UI_UX.md
```

---

# 8. Issue Governance

When an issue is resolved:

1. Fix implementation.
2. Add/update automated tests.
3. Verify on affected devices.
4. Review related business rules.
5. Update documentation.
6. Mark the issue `RESOLVED`.
7. Record the relevant backlog item as complete only after acceptance criteria pass.

Never mark an issue resolved solely because code was changed.

---

# 9. Relationship to Other Documents

| Document | Purpose |
|---|---|
| `KNOWN_ISSUES.md` | Known defects, risks, and accepted limitations |
| `BACKLOG.md` | Work items and implementation status |
| `DECISIONS.md` | Product/architecture decisions |
| `BUSINESS_RULES.md` | Mandatory domain behavior |
| `FEATURE_INDEX.md` | Feature navigation |
| `NEXT_SESSION.md` | Handoff for the next development session |

---

# 10. Final Rule

> **Do not hide known problems. Do not invent problems. Record verified facts, risks, limitations, and the next action clearly.**
