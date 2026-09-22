"use client";

import { getCachedProfile, cacheProfile, getLearnerId } from "./learner";
import { queueEvent } from "./events";

// Fire-and-forget-safe server sync for game completion. Never blocks gameplay:
// all failures resolve to null so offline/deterministic-local play continues
// (BR-221). The server re-validates everything; client values are hints only.
//
// Flow per completion:
//   1. progress (idempotent via completionId; owns stars/promotion/skills)
//   2. claim   (server-authoritative UNIQUE sticker; idempotent via claimId)
//   3. signals (interests)
// Callers reconcile the returned sticker into the local collection.

export interface CompletionReport {
  gameId: string;
  accuracy: number; // 0..1 first-try accuracy
  stars: number;
  stickerId?: string;
  stickerEmoji?: string;
  hintsUsed?: number;
  durationMs?: number;
  completionId?: string;
}

export interface ClaimSummary {
  sticker: { id: string; emoji: string; name: string } | null;
  stickerCount: number;
  milestone: { emoji: string; name: string; message: string } | null;
  collectionComplete: boolean;
  duplicate: boolean;
}

function newCompletionId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `completion_${(crypto as { randomUUID: () => string }).randomUUID().replace(/-/g, "").slice(0, 16)}`;
    }
  } catch {}
  return `completion_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface GameCompletionResult {
  claim: ClaimSummary | null;
  promotion: { promoted: boolean; level: number } | null;
  skill: { action: string; level: number; message: string } | null;
}

export function reportGameCompletion(r: CompletionReport): Promise<GameCompletionResult | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const profile = getCachedProfile();
  const learnerId = profile?.learnerId ?? getLearnerId();
  // Always record local analytics events, even without a learner profile.
  try {
    queueEvent({ event: "activity_completed", gameId: r.gameId, metadata: { accuracy: r.accuracy } });
    queueEvent({ event: "star_awarded", gameId: r.gameId, metadata: { stars: r.stars } });
    if (r.stickerId) queueEvent({ event: "sticker_awarded", gameId: r.gameId, metadata: { stickerId: r.stickerId } });
    queueEvent({ event: "interest_signal_recorded", gameId: r.gameId, metadata: { value: 1 } });
  } catch { /* analytics degrade gracefully */ }
  if (!learnerId) return Promise.resolve(null);
  return (async (): Promise<GameCompletionResult | null> => {
    let promotion: { promoted: boolean; level: number } | null = null;
    let skill: { action: string; level: number; message: string } | null = null;
    try {
      const completionId = r.completionId ?? newCompletionId();
      // 1. Progress (may trigger global promotion + per-skill adjustment server-side)
      const pRes = await fetch(`/api/learners/${learnerId}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: r.gameId, accuracy: r.accuracy, stars: r.stars, stickerId: r.stickerId, hintsUsed: r.hintsUsed ?? 0, durationMs: r.durationMs, completionId }),
      }).catch(() => null);
      if (pRes && pRes.ok) {
        const body = await pRes.json().catch(() => null);
        const promo = body?.data?.promotion as { promoted?: boolean; level?: number } | undefined;
        if (promo) {
          promotion = { promoted: !!promo.promoted, level: promo.level ?? (getCachedProfile()?.level ?? 1) };
          if (promo.promoted && typeof promo.level === "number") {
            queueEvent({ event: "level_unlocked", gameId: r.gameId, metadata: { level: promo.level } });
            const cur = getCachedProfile();
            if (cur) cacheProfile({ ...cur, level: promo.level });
          }
        }
        // Per-skill adjustment is observable through the same event pipeline.
        const skillData = body?.data?.skill as { action?: string; level?: number; message?: string } | undefined;
        if (skillData && typeof skillData.level === "number") {
          skill = { action: skillData.action ?? "stabilize", level: skillData.level, message: skillData.message ?? "" };
          if ((skillData.action === "promote" || skillData.action === "reduce") && typeof skillData.level === "number") {
            queueEvent({ event: "level_unlocked", gameId: r.gameId, metadata: { level: skillData.level, skill: true, action: skillData.action } });
            // Persist per-skill level locally for immediate UI feedback (server is authoritative, but cache avoids flash).
            const cur = getCachedProfile();
            if (cur) {
              const gameLevels = { ...(cur as unknown as { gameLevels?: Record<string, number> }).gameLevels, [r.gameId]: skillData.level };
              cacheProfile({ ...cur, gameLevels } as unknown as typeof cur);
            }
          }
        }
      }
      // 2. Authoritative sticker claim (server picks an unowned catalog sticker)
      const cRes = await fetch(`/api/learners/${learnerId}/rewards/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: r.gameId, accuracy: r.accuracy, claimId: completionId }),
      }).catch(() => null);
      let claim: ClaimSummary | null = null;
      if (cRes && cRes.ok) {
        const body = await cRes.json().catch(() => null);
        const d = body?.data;
        if (d) {
          claim = {
            sticker: d.sticker ? { id: d.sticker.id, emoji: d.sticker.emoji, name: d.sticker.name } : null,
            stickerCount: typeof d.stickerCount === "number" ? d.stickerCount : 0,
            milestone: d.milestone ?? null,
            collectionComplete: Boolean(d.collectionComplete),
            duplicate: Boolean(d.duplicate),
          };
        }
      }
      // 3. Interest signal (educational/game preferences only — never sensitive)
      await fetch(`/api/learners/${learnerId}/signals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal: "interest", gameId: r.gameId, value: 1 }),
      }).catch(() => null);
      return { claim, promotion, skill };
    } catch { /* offline — local rewards already applied, sync later via events */ }
    return null;
  })();
}
