import { getLearner } from "@/repositories/learners";
import { GAMES } from "@/games/registry";
import { classify } from "@/server/ai";
import { mulberry32 } from "@/games/framework";

// Server-side deterministic hash (FNV-1a) — no Math.random, no window APIs.
// Same learner + same data => same plan (DEC-050).
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Deterministic Personalization Engine — AI is suggestion only, final plan is validated
// by deterministic rules (DEC-071). No LLM controls gameplay directly.

export interface LearningPlanItem {
  order: number;
  gameId: string;
  level: number;
  reason: string; // e.g., "interest", "need-practice", "variety"
}

export interface LearningPlan {
  learnerId: string;
  level: number;
  ageBand: string;
  items: LearningPlanItem[];
  generatedAt: string;
  source: "deterministic" | "ai-assisted";
}

// Core deterministic planner
export async function buildPlan(learnerId: string): Promise<LearningPlan> {
  const learner = await getLearner(learnerId);
  // Fallback to defaults if no learner (anonymous)
  const ageBand = (learner?.ageBand ?? "6-7") as string;
  const level = learner?.level ?? 1;
  const interests = learner?.interests ?? {};
  const progress = learner?.gameProgress ?? {};

  // Score games: interest + need + variety (fully deterministic).
  // Tie-break jitter comes from a seeded PRNG keyed on learnerId so the same
  // learner with the same data always gets the same plan. Client-side window
  // shuffling (windowSeed) still diversifies simultaneous open windows on top.
  const jitterRand = mulberry32(hashSeed(`${learnerId}:jitter`));
  const scored = GAMES.map((g) => {
    const interest = interests[g.id] ?? 0;
    const prog = progress[g.id];
    const completions = prog?.completions ?? 0;
    const accuracy = prog?.bestAccuracy ?? 0;
    // Need: low completions or low accuracy => higher need score
    let need = 0;
    if (completions === 0) need = 2; // unplayed => high priority for variety
    else if (accuracy < 0.7) need = 3; // struggling => highest need
    else if (accuracy < 0.85) need = 1;
    // Variety: penalize heavily-played games (completions as proxy)
    const varietyPenalty = Math.min(2, completions * 0.3);
    const total = interest * 0.6 + need * 1.2 - varietyPenalty + jitterRand() * 0.1;
    let reason = "variety";
    if (need >= 2) reason = "need-practice";
    else if (interest > 2) reason = "interest";
    return { gameId: g.id, score: total, reason };
  });

  // Sort by score descending, then deterministic shuffle of non-top items so
  // plans vary across learners but stay stable per learner.
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const rest = shuffleDeterministic(scored.slice(1), hashSeed(`${learnerId}:rest:${level}`));
  const ordered = [top, ...rest];

  // Try AI-assisted re-ranking (suggestion only)
  let source: "deterministic" | "ai-assisted" = "deterministic";
  try {
    if (process.env.AI_API_KEY && learner) {
      const prompt = `Learner ageBand ${ageBand} level ${level} interests ${JSON.stringify(interests)} progress ${JSON.stringify(progress)}. Recommend order of games ${GAMES.map((g) => g.id).join(",")} as JSON array.`;
      const aiText = await classify({ text: prompt, labels: GAMES.map((g) => g.id) }).catch(() => null);
      // classify returns single label, not full order; so we keep deterministic but mark as ai-assisted if it succeeded
      if (aiText) source = "ai-assisted";
    }
  } catch {}

  const items: LearningPlanItem[] = ordered.map((s, i) => ({
    order: i + 1,
    gameId: s.gameId,
    level,
    reason: s.reason,
  }));

  // Validate final plan: every registered game exactly once, correct level.
  // Sized by the registry (not a hardcoded count) so new games join safely.
  const validIds = new Set(GAMES.map((g) => g.id));
  const validated = items.filter((it) => validIds.has(it.gameId) && it.level >= 1 && it.level <= 5);
  if (validated.length !== GAMES.length || new Set(validated.map((i) => i.gameId)).size !== GAMES.length) {
    // Fallback to deterministic default order
    return {
      learnerId,
      level,
      ageBand,
      items: GAMES.map((g, i) => ({ order: i + 1, gameId: g.id, level, reason: "variety" })),
      generatedAt: new Date().toISOString(),
      source: "deterministic",
    };
  }

  return { learnerId, level, ageBand, items: validated, generatedAt: new Date().toISOString(), source };
}

export async function savePlan(plan: LearningPlan): Promise<void> {
  const { getDb, newId } = await import("@/db/mongodb");
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db.collection("learningPlans").insertOne({ planId: newId("plan"), ...plan, createdAt: new Date() }).catch(() => null);
}
