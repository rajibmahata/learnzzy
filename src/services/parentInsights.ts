import { getDb } from "@/db/mongodb";
import type { LearnerDoc } from "@/repositories/learners";
import { getConceptDef } from "@/lib/concepts";
import { evaluateSkill, skillLevelFor, skillSummaryLine, SKILL_GAMES } from "@/lib/skillLevels";
import { categoryProgress, flattenMasteryMap, type CategoryProgress } from "@/lib/knowledge";
import type { AnnotatedPlan } from "./educationAdvisory";

// Parent-facing learning summaries composed ONLY from validated Learnzzy
// data (learner doc, plans, aggregate events). Never exposes LLM/MCP raw
// output, chain-of-thought, or internal reasoning.
export interface ConceptProgress {
  conceptId: string;
  name: string;
  masteryPct: number;
  attempts: number;
}

export interface SkillProfile {
  gameId: string;
  name: string;
  level: number;
  masteryPct: number;
  recentAccuracyPct: number;
  trend: string;
  completions: number;
  hintsUsed: number;
  summary: string;
}

export interface LastResult {
  gameId: string;
  accuracy: number;
  stars: number;
  level: number;
  hintsUsed: number;
  durationMs?: number;
  at: string;
}

export interface ChildSummary {
  learnerId: string;
  nickname?: string;
  ageBand: string;
  level: number;
  totalStars: number;
  stickerCount: number;
  concepts: ConceptProgress[];
  strengths: string[];
  practiceOpportunities: string[];
  recommendedNext: { gameId: string; level: number; reason: string }[];
  advisoryFocus?: string;
  skills: SkillProfile[];
  lastResult: LastResult | null;
  discovery: {
    total: number;
    learned: number;
    mastered: number;
    needsReview: number;
    categories: CategoryProgress[];
  };
  academic?: {
    conceptsLearned: number;
    conceptsMastered: number;
    conceptsPracticing: number;
    streakDays: number;
    nextActivity: { game: string; concept: string; objective: string; reason: string } | null;
  };
}

const GAME_NAMES: Record<string, string> = {
  addition: "Number Adventure",
  subtraction: "Fly Away",
  "clean-up": "Clean Up",
  puzzle: "Picture Puzzle",
  sketch: "Shadow Sketch",
  discover: "Discovery World",
};

export function gameDisplayName(gameId: string): string {
  return GAME_NAMES[gameId] ?? gameId;
}

export async function buildChildSummary(learner: LearnerDoc): Promise<ChildSummary> {
  const db = await getDb().catch(() => null);
  // Concept mastery from per-game progress (same aggregation as Tutor mock).
  const { conceptsForGame } = await import("@/lib/concepts");
  const conceptAgg = new Map<string, { attempts: number; correct: number }>();
  for (const [gameId, p] of Object.entries(learner.gameProgress ?? {})) {
    const attempts = p.completions * 5;
    const correct = Math.round(attempts * (p.bestAccuracy ?? 0));
    for (const cid of conceptsForGame(gameId, p.lastLevel || learner.level)) {
      const cur = conceptAgg.get(cid) ?? { attempts: 0, correct: 0 };
      cur.attempts += attempts;
      cur.correct += correct;
      conceptAgg.set(cid, cur);
    }
  }
  const concepts: ConceptProgress[] = [...conceptAgg.entries()].map(([conceptId, v]) => ({
    conceptId,
    name: getConceptDef(conceptId)?.name ?? conceptId,
    masteryPct: v.attempts === 0 ? 0 : Math.round((v.correct / v.attempts) * 100),
    attempts: v.attempts,
  }));
  concepts.sort((a, b) => b.masteryPct - a.masteryPct);
  // Per-skill adaptive profiles from real rolling performance (one level per
  // game — a strong skill never inflates a struggling one).
  const skills: SkillProfile[] = SKILL_GAMES.map((gameId) => {
    const prog = learner.gameProgress?.[gameId];
    const evaluation = evaluateSkill({
      completions: prog?.completions ?? 0,
      recentAccuracy: prog?.recentAccuracy ?? [],
      hintsUsed: prog?.hintsUsed ?? 0,
    });
    const level = skillLevelFor(learner, gameId);
    return {
      gameId,
      name: gameDisplayName(gameId),
      level,
      masteryPct: evaluation.masteryPct,
      recentAccuracyPct: Math.round(evaluation.avgAccuracy * 100),
      trend: evaluation.trend,
      completions: prog?.completions ?? 0,
      hintsUsed: prog?.hintsUsed ?? 0,
      summary: skillSummaryLine(gameId, level, evaluation),
    };
  });
  const withData = concepts.filter((c) => c.attempts > 0);
  const strengths = [
    ...skills.filter((s) => s.trend === "strong").map((s) => s.summary),
    ...withData.filter((c) => c.masteryPct >= 80).slice(0, 3).map((c) => c.name),
  ].slice(0, 4);
  const practiceOpportunities = [
    ...skills.filter((s) => s.trend === "needs_practice").map((s) => s.summary),
    ...withData.filter((c) => c.masteryPct < 70).slice(0, 3).map((c) => c.name),
  ].slice(0, 4);
  const lastResult = learner.lastResult
    ? {
        gameId: learner.lastResult.gameId,
        accuracy: learner.lastResult.accuracy,
        stars: learner.lastResult.stars,
        level: learner.lastResult.level,
        hintsUsed: learner.lastResult.hintsUsed,
        ...(typeof learner.lastResult.durationMs === "number" ? { durationMs: learner.lastResult.durationMs } : {}),
        at: learner.lastResult.at instanceof Date ? learner.lastResult.at.toISOString() : String(learner.lastResult.at),
      }
    : null;

  let recommendedNext: ChildSummary["recommendedNext"] = [];
  let advisoryFocus: string | undefined;
  if (db) {
    const plan = (await db
      .collection("learningPlans")
      .findOne({ learnerId: learner.learnerId }, { sort: { createdAt: -1 } })
      .catch(() => null)) as (AnnotatedPlan & { items: { gameId: string; level: number; reason: string }[] }) | null;
    if (plan) {
      recommendedNext = plan.items.slice(0, 3).map((i) => ({ gameId: i.gameId, level: i.level, reason: i.reason }));
      if (plan.advisory) {
        const focus = getConceptDef(plan.advisory.focusConceptId ?? "");
        advisoryFocus = focus ? `Focus: ${focus.name}` : `Focus: ${gameDisplayName(plan.advisory.focusGameId)}`;
      }
    }
  }
  const categories = categoryProgress(
    Object.fromEntries(
      Object.entries(flattenMasteryMap(learner.conceptMastery)).map(([id, m]) => [
        id,
        {
          exposures: m.exposures ?? 0,
          attempts: m.attempts ?? 0,
          correct: m.correct ?? 0,
          status: (m.status ?? "new") as "new" | "learning" | "practicing" | "mastered" | "needs_review",
        },
      ])
    )
  );
  const discovery = {
    total: categories.reduce((s, c) => s + c.total, 0),
    learned: categories.reduce((s, c) => s + c.learned, 0),
    mastered: categories.reduce((s, c) => s + c.mastered, 0),
    needsReview: categories.reduce((s, c) => s + c.needsReview, 0),
    categories: categories.filter((c) => c.learned > 0),
  };
  // Academic rollup: validated plans + mastery counts + streak (parent-safe
  // summaries only, never chain-of-thought or provider internals).
  const flat = flattenMasteryMap(learner.conceptMastery);
  const masteryVals = Object.values(flat);
  const conceptsLearned = masteryVals.filter((m) => m.status && m.status !== "new").length;
  const conceptsMastered = masteryVals.filter((m) => m.status === "mastered").length;
  const conceptsPracticing = masteryVals.filter((m) => m.status === "practicing" || m.status === "learning" || m.status === "needs_review").length;
  let academicNext: ChildSummary["academic"] extends infer A ? A extends { nextActivity: infer N } ? N : never : never = null;
  let streakDays = 0;
  if (db) {
    try {
      const aplan = await db
        .collection("academicPlans")
        .findOne({ learnerId: learner.learnerId }, { sort: { createdAtDb: -1 } })
        .catch(() => null);
      if (aplan) {
        const { parentReasonText } = await import("@/lib/academic");
        const { getConceptDef } = await import("@/lib/concepts");
        const { getConcept } = await import("@/lib/knowledge");
        const cname = getConceptDef(String(aplan.concept))?.name ?? getConcept(String(aplan.concept))?.names.en ?? String(aplan.concept);
        academicNext = {
          game: String(aplan.game),
          concept: String(aplan.concept),
          objective: String(aplan.objective),
          reason: parentReasonText(aplan.reasonCode, cname),
        };
      }
      // Streak: consecutive days with game completions (events), capped at 30.
      const days = await db
        .collection("gameEvents")
        .aggregate([
          { $match: { sessionId: learner.sessionId } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$serverTimestamp" } } } },
          { $sort: { _id: -1 } },
          { $limit: 30 },
        ])
        .toArray()
        .catch(() => []);
      const daySet = new Set((days as { _id: string }[]).map((d) => d._id));
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const key = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
        if (daySet.has(key)) streakDays++;
        else if (i > 0) break;
      }
    } catch {
      // Parent summary degrades gracefully.
    }
  }
  return {
    learnerId: learner.learnerId,
    nickname: learner.nickname,
    ageBand: learner.ageBand,
    level: learner.level,
    totalStars: learner.totalStars,
    stickerCount: learner.stickerIds.length,
    concepts,
    strengths,
    practiceOpportunities,
    recommendedNext,
    advisoryFocus,
    skills,
    lastResult,
    discovery,
    academic: {
      conceptsLearned,
      conceptsMastered,
      conceptsPracticing,
      streakDays,
      nextActivity: academicNext,
    },
  };
}

export async function recentActivity(learnerId: string, sessionId: string | undefined, limit = 20) {
  const db = await getDb().catch(() => null);
  if (!db || !sessionId) return [];
  void learnerId; // reserved for future learnerId-indexed events; session scoping today
  const rows = await db
    .collection("gameEvents")
    .find({ sessionId })
    .sort({ serverTimestamp: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .project({ _id: 0, event: 1, gameId: 1, serverTimestamp: 1 })
    .toArray()
    .catch(() => []);
  return rows;
}
