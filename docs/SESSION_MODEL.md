# Session Model

```text
sessionId  →  learnerId  →  game events  →  result  →  progress  →  reward  →  sticker
```

- One gameplay session belongs to one learner: per-learner ids
  (`learnzzy.sessionId.{learnerId}`), bound server-side on first event sight
  (`sessions.learnerId`, additive — anonymous sessions keep working).
- Every ingested event carries its owning `learnerId` (per-event value wins,
  batch value is the fallback). Learners are never identified by name,
  nickname, or companion anywhere in the pipeline.
- The device pointer is `learnzzy.activeLearnerId`; switching it touches no
  other learner's stores (rewards/profile/session keys are all namespaced),
  and each queued event keeps the `learnerId` active at its creation, so a
  switch with a pending offline queue cannot misattribute analytics.
- Resume = reload profile + journey + level + progress + stickers + rewards +
  plan + parent-link status for the active id ("Welcome back, {nick}!",
  "{companion} is waiting!", Continue Adventure). Unfinished games do not
  auto-resume by design.
