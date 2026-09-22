# Learner Identity

**`learnerId` is the identity. Everything else is display.**

```text
learnerId:  "learner_abc123"   # stable forever, never derived from name/age
displayName: "Aarvi"           # personalization only, optional, sanitized
nickname:    "Avi"             # what Learnzzy says; falls back to displayName
companion:   { characterId: "bunny", displayName: "Coco" }
avatar:      "🐰"              # legacy buddy emoji, kept as fallback
ageBand:     "6-7"             # complexity boundary only, setup-time
onboarding:  { completed, completedAt, version }
```

`greetingName()` = nickname → displayName → "Explorer". `companionEmoji()`
and `companionCallName()` resolve the companion with legacy fallbacks, so old
profiles render sensibly. Changing any display field never creates a new
`learnerId` — sessions, activities, progress, rewards, stickers, and signals
stay connected.

Child-safe edits go through `PATCH /api/learners/{learnerId}` (strict schema:
only `displayName`, `nickname`, `avatar`, `companion`, `onboardingCompleted`;
unknown fields and unknown `characterId` values are rejected with 422;
`ageBand`/level/progress are never writable there). No alias endpoints were
added — `/api/learners` (POST) and `/api/learners/{learnerId}` (GET/PATCH)
remain the only learner APIs.
