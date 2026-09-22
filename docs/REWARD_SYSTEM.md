# Reward System

## Principle

Every completed game, activity, or mission generates a reward, and the
**server decides the sticker**. The browser shows an optimistic placeholder
instantly (celebration never waits on network) and reconciles to the
authoritative award when the claim returns. Offline, the placeholder stays
local and hydrates later — gameplay never blocks.

## Flow

```text
Game completed
  → progress POST (stars/promotion/skills, idempotent via completionId)
  → claim POST { gameId, claimId } → server picks unowned catalog sticker
  → frontend celebration → sticker reveal → collection count update
```

- `POST /api/learners/{learnerId}/progress` accepts optional `completionId`.
  Repeats return `duplicate: true` without re-recording completions, stars, or
  promotions. `recentCompletionIds` (capped at 50) lives on the learner doc.
- `POST /api/learners/{learnerId}/rewards/claim` is the single issuance path.
  Client-supplied sticker ids are never honored. The legacy `POST .../rewards`
  route delegates to the same claim code (stars were removed from it — the
  progress path owns stars, fixing a historic double-count).
- `rewardClaims.claimId` has a unique index: the same completion submitted
  twice yields ONE sticker and `duplicate: true`, including under races
  (loser reads the winner's claim).
- `GET .../rewards` returns server truth: `stickers` (resolved catalog defs),
  `stickerCount`, `catalogSize`, `recentSticker`, and the current `milestone`.

## Uniqueness

Selection (`selectUnownedSticker`) only considers active catalog stickers the
learner does not own, rotated deterministically by `{learnerId}:{claimId}`.
Persistence uses `$addToSet`, so even concurrent claims cannot duplicate. When
the catalog is fully collected the claim returns `collectionComplete: true`
and no sticker — the UI celebrates the complete collection instead.

## Celebration UX (`Celebration`)

In-flow (never a blocking modal), ~instant: character in `celebrating` state,
short per-character praise line ("You did it!", "Great remembering!",
"Beautiful thinking!", "You found it!", "You found the word!"), sticker
reveal, stars, milestone badge, and collection count. Voice uses the existing
calm companion (soft, moderate, throttled) and never blocks. Reduced motion is
respected via `prefers-reduced-motion` (bounce/particles off; message, reveal,
character, and voice stay). No timers, pressure, streaks, scarcity, or loss
framing — the message is "I learned something and discovered something new."

## Security model

- No auth on child routes (device plays its own learner — same trust model as
  the rest of the app); the server still validates every completion and
  chooses every sticker.
- Rate limits: progress 30/min, rewards 20/min, claim 30/min per IP.
- Parent dashboard shows per-child stars, sticker counts, and the recent
  achievement — never a leaderboard.
