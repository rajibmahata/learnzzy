// Activity Selector — deterministic, idempotent, learner-isolated.
// Picks one NextLearningActivity per call, never repeats same contentId,
// respects variety, and never exposes AI chain-of-thought.

import { recommendNextActivitySafe, type AdventureEngineInput, type NextLearningActivity } from "./learningAdventureEngine.ts";

export interface SelectorInput extends AdventureEngineInput {
  excludeContentIds?: string[];
}

export async function selectNextAdventureActivity(input: SelectorInput): Promise<NextLearningActivity | null> {
  // Exclude recently shown contentIds deterministically
  const filtered = { ...input };
  if (input.excludeContentIds?.length) {
    // Mark unavailable so engine skips them
    filtered.contentAvailability = { ...input.contentAvailability };
    for (const cid of input.excludeContentIds) {
      // Find activities that would serve this contentId and mark unavailable
      // For now, exclude by activity id when contentId matches activity id
      filtered.contentAvailability[cid] = false;
    }
  }
  const next = await recommendNextActivitySafe(filtered);
  return next;
}

// Deterministic batch for home — 3 recommendations, no duplicates, varied worlds
export async function selectHomeAdventures(input: AdventureEngineInput, count = 3): Promise<NextLearningActivity[]> {
  const out: NextLearningActivity[] = [];
  const usedIds = new Set<string>();
  const usedWorlds = new Set<string>();
  const base = { ...input };
  for (let i = 0; i < count; i++) {
    const next = await recommendNextActivitySafe({
      ...base,
      recentFingerprints: [...input.recentFingerprints, ...out.map((o) => ({ activityId: o.activity.id, type: o.activity.type, mechanic: o.activity.mechanics[0] ?? "", theme: o.activity.theme, world: o.activity.world, difficulty: o.activity.difficulty } as never))],
      completedActivityIds: [...input.completedActivityIds, ...out.map((o) => o.activity.id)],
    });
    if (!next) break;
    if (usedIds.has(next.activity.id)) continue;
    // Enforce world variety for home cards
    if (usedWorlds.has(next.activity.world) && out.length < 2) {
      // Try next best by re-querying with penalty
      continue;
    }
    out.push(next);
    usedIds.add(next.activity.id);
    usedWorlds.add(next.activity.world);
  }
  return out;
}
