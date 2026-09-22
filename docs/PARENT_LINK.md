# Parent Link

Reuses the existing pairing architecture unchanged — no second relationship
model, no new endpoints.

```text
Parent (authed) creates code  →  child confirms on /link  →  PENDING
→  parent approves  →  ACTIVE  →  parent dashboard shows the child
```

- Codes: cryptographically random, short-lived, single-use, rate-limited
  (5 confirms/hour/IP against guessing). No QR support exists.
- Confirm-then-approve means the child confirmation (§16) and parent approval
  (§14) steps are both covered by the one flow; nothing secret about the
  parent is exposed to the child.
- Statuses: `pending` → `active`, plus `expired` (new code required, never
  reused) and `revoked` (disconnect keeps learner data intact; only the
  relationship ends).
- Every child-data endpoint requires an authenticated parent **plus** an
  active `parentChildLinks` record.
- Parent views show identity (`displayName`, nickname, companion) alongside
  journey, skills, rewards, and stickers — never chain-of-thought, prompts,
  keys, or raw event internals (insights are parent-friendly summaries).
