# Sticker System

## Catalog (`src/lib/stickers.ts`)

~50 emoji-only stickers (zero asset payload) across 8 categories: animals,
flowers, nature, food, space, transport, fantasy, discovery. Each entry:

```text
{ id, name, emoji, category, rarity, description, sortOrder, active }
```

Rarity (`common`/`special`/`rare`) only organizes the garden — every sticker
is obtainable through normal learning activity. The catalog is code-defined
and versioned with the app; extending it is additive (existing collections
keep working; `resolveStickerIds` skips unknown ids).

## Collection

- Server source of truth: `learner.stickerIds` (never duplicated — `$addToSet`
  + server-side selection over unowned ids only).
- `/stickers` ("{Name}'s Sticker Garden") is server-backed: `N / catalogSize`,
  per-category sections with undiscovered silhouettes (`?`, never failure
  framing), milestones, and "Keep exploring to discover more!".
- Device cache is per-learner (`learnzzy.rewards.v1.{learnerId}`), hydrated
  once per learner from `GET .../rewards`. The legacy shared key is retired.

## Milestones (derived, never stored)

5 → 🌟 Little Explorer · 10 → 🌈 Rainbow Collector · 25 → 🦋 Discovery
Friend · 50 → 🏆 Learnzzy Explorer. Computed from the count, so there is
nothing to duplicate or migrate. Milestones celebrate learning completion —
never minutes spent.

## Admin / parent

- Parent rewards view shows stars, sticker counts, and the recent achievement
  (`recentSticker` on the parent progress endpoint).
- Catalog administration (activate/deactivate, metadata) is currently
  code-review gated; a dedicated admin UI is tracked as follow-up (see
  BACKLOG). Reward history is queryable via `rewardClaims` (indexed by
  `claimId` unique and `learnerId + createdAt`).
