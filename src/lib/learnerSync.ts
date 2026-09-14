"use client";

import { getCachedProfile, cacheProfile, getLearnerId } from "./learner";
import { queueEvent } from "./events";

// Fire-and-forget server sync for game completion. Never blocks gameplay:
// all failures are swallowed so offline/deterministic-local play continues
// (BR-221). The server re-validates everything; client values are hints only.

export interface CompletionReport {
  gameId: string;
  accuracy: number; // 0..1 first-try accuracy
  stars: number;
  stickerId?: string;
  stickerEmoji?: string;
}

export function reportGameCompletion(r: CompletionReport): void {
  if (typeof window === "undefined") return;
  const profile = getCachedProfile();
  const learnerId = profile?.learnerId ?? getLearnerId();
  // Always record local analytics events, even without a learner profile.
  try {
    queueEvent({ event: "activity_completed", gameId: r.gameId, metadata: { accuracy: r.accuracy } });
    queueEvent({ event: "star_awarded", gameId: r.gameId, metadata: { stars: r.stars } });
    if (r.stickerId) queueEvent({ event: "sticker_awarded", gameId: r.gameId, metadata: { stickerId: r.stickerId } });
    queueEvent({ event: "interest_signal_recorded", gameId: r.gameId, metadata: { value: 1 } });
  } catch { /* analytics degrade gracefully */ }
  if (!learnerId) return;
  void (async () => {
    try {
      // 1. Progress (may trigger level promotion server-side)
      const pRes = await fetch(`/api/learners/${learnerId}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: r.gameId, accuracy: r.accuracy, stars: r.stars, stickerId: r.stickerId }),
      }).catch(() => null);
      if (pRes && pRes.ok) {
        const body = await pRes.json().catch(() => null);
        const promo = body?.data?.promotion as { promoted?: boolean; level?: number } | undefined;
        if (promo?.promoted && typeof promo.level === "number") {
          queueEvent({ event: "level_unlocked", gameId: r.gameId, metadata: { level: promo.level } });
          const cur = getCachedProfile();
          if (cur) cacheProfile({ ...cur, level: promo.level });
        }
      }
      // 2. Server reward mirror (idempotent by stickerId)
      await fetch(`/api/learners/${learnerId}/rewards`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: r.gameId, stars: r.stars, stickerId: r.stickerId, stickerEmoji: r.stickerEmoji }),
      }).catch(() => null);
      // 3. Interest signal (educational/game preferences only — never sensitive)
      await fetch(`/api/learners/${learnerId}/signals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal: "interest", gameId: r.gameId, value: 1 }),
      }).catch(() => null);
    } catch { /* offline — local rewards already applied, sync later via events */ }
  })();
}
