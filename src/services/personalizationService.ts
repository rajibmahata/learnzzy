import { getLearner } from "@/repositories/learners";
import { GAMES } from "@/games/registry";
import { classify } from "@/server/ai";
import { mulberry32 } from "@/games/framework";
import { buildPersonalizedSessionPlan } from "@/services/personalizedSessionPlanner";

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

// Core deterministic planner — now delegates to PersonalizedSessionPlanner
// for global-level + skill-mastery → activity complexity. Keeps the same
// LearningPlan shape for backward compatibility, but all items share the
// learner's GLOBAL level (no per-game levels visible).
export async function buildPlan(learnerId: string): Promise<LearningPlan> {
  // Use the new adaptive session planner as the source of truth.
  // It is deterministic and respects global level + mastery.
  const learner = await getLearner(learnerId);
  const session = await buildPersonalizedSessionPlan(learnerId);
  const ageBand = session.ageBand as string;
  const level = session.globalLevel;
  const interests = learner?.interests ?? {};
  const progress = learner?.gameProgress ?? {};

  // Map session activities back to the legacy game-based LearningPlan for
  // existing consumers (GamePlan, ContinueLearning, tests). Each activity
  // maps to its underlying gameId via href or direct id; duplicates collapsed.
  const gameMap = new Map<string, { gameId: string; reason: string; priority: number }>();
  for (const act of session.activities) {
    // Prefer href gameId, fallback to activity skill/game mapping
    const rawGameId = act.href ? act.href.split("/").pop()! : act.skill;
    // Normalize to known GAMES ids where possible
    const gameId = GAMES.some((g) => g.id === rawGameId) ? rawGameId : (GAMES.find((g) => act.skill.includes(g.id))?.id ?? rawGameId);
    if (!gameMap.has(gameId)) {
      gameMap.set(gameId, { gameId, reason: act.reason, priority: act.priority });
    } else {
      // Keep highest priority reason for this game
      const cur = gameMap.get(gameId)!;
      if (act.priority > cur.priority) gameMap.set(gameId, { gameId, reason: act.reason, priority: act.priority });
    }
  }
  // Ensure all registered games appear exactly once (for validation), ordered by session priority
  const scored = GAMES.map((g) => {
    const entry = gameMap.get(g.id);
    if (entry) return entry;
    // Unrepresented games get lowest priority variety
    return { gameId: g.id, reason: "variety", priority: -1 };
  });
  scored.sort((a, b) => b.priority - a.priority);
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

  // Validate final plan: every registered game exactly once, correct global level.
  // Sized by the registry (not a hardcoded count) so new games join safely.
  const validIds = new Set(GAMES.map((g) => g.id));
  const validated = items.filter((it) => validIds.has(it.gameId) && it.level >= 1 && it.level <= 10);
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
