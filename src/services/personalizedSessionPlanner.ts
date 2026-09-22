import { getLearner } from "@/repositories/learners";
import { ACTIVITY_REGISTRY, type ActivityDef } from "@/lib/activityRegistry";
import { resolveComplexity, type AgeBand, type ComplexityProfile } from "@/lib/complexity";
import { evaluateSkill, type SkillHistory } from "@/lib/skillLevels";
import { mulberry32 } from "@/games/framework";
import { WORLD_EVENT_CONFIGS } from "@/lib/worldRewards";
import type { AgeBand as LearnerAgeBand } from "@/repositories/learners";

// Deterministic hash for seeding (FNV-1a)
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface LearningGoal {
  skill: string;
  targetMastery: number;
  reason: string;
}

export interface PersonalizedActivity {
  activityId: string;
  category: string;
  skill: string;
  activityType: string;
  complexity: ComplexityProfile;
  reason: string;
  priority: number;
  href?: string;
  title: string;
  icon: string;
  /** Admin explainability: why was this selected? (skill+difficulty+theme+reason) */
  explainability?: { skill: string; difficulty: number; theme?: string; reason: string };
}

export interface PersonalizedSessionPlan {
  learnerId: string;
  globalLevel: number;
  ageBand: AgeBand;
  activities: PersonalizedActivity[];
  learningGoals: LearningGoal[];
  generatedAt: string;
  expiresAt?: string;
  source: "deterministic" | "ai-assisted";
}

interface SkillMastery {
  skill: string;
  mastery: number; // 0..1
  trend: "strong" | "steady" | "needs_practice" | "improving";
  sampleSize: number;
  completions: number;
}

function computeSkillMastery(
  learner: Awaited<ReturnType<typeof getLearner>>,
  skill: string
): SkillMastery {
  if (!learner) return { skill, mastery: 0.5, trend: "steady", sampleSize: 0, completions: 0 };
  // Find all activities that use this skill to aggregate progress
  const related = ACTIVITY_REGISTRY.filter((a) => a.skills.includes(skill));
  const gameIds = new Set<string>();
  for (const a of related) {
    // Map skill to gameId where possible; fallback to activity id
    if (a.href) {
      const gid = a.href.split("/").pop() ?? a.id;
      gameIds.add(gid);
    } else {
      gameIds.add(a.id);
    }
  }
  // Also include direct skill name as gameId for legacy gameProgress keys
  gameIds.add(skill);
  for (const a of related) for (const s of a.skills) gameIds.add(s);

  let totalCompletions = 0;
  const allRecent: number[] = [];
  let totalHints = 0;
  for (const gid of gameIds) {
    const prog = (learner.gameProgress as Record<string, { completions: number; recentAccuracy?: number[]; hintsUsed?: number } | undefined>)[gid];
    if (prog) {
      totalCompletions += prog.completions ?? 0;
      if (Array.isArray(prog.recentAccuracy)) allRecent.push(...prog.recentAccuracy);
      totalHints += prog.hintsUsed ?? 0;
    }
  }
  // Also check conceptMastery for skill-like concepts
  // Use last 5 recent for trend
  const history: SkillHistory = { completions: totalCompletions, recentAccuracy: allRecent.slice(-10), hintsUsed: totalHints };
  const evaled = evaluateSkill(history);
  return {
    skill,
    mastery: evaled.avgAccuracy,
    trend: evaled.trend,
    sampleSize: evaled.sampleSize,
    completions: totalCompletions,
  };
}

function masteryToComplexityAdjustment(mastery: number): number {
  // Strong mastery → slightly higher complexity within age band
  // Developing → baseline or slightly lower
  if (mastery >= 0.85) return 1;
  if (mastery >= 0.6) return 0;
  if (mastery >= 0.4) return -0; // keep baseline, but could be -1 for very weak
  return -1; // needs practice
}

function buildLearningGoals(masteries: SkillMastery[]): LearningGoal[] {
  // Pick 2-3 goals: weakest skills that need practice, plus one strength to celebrate
  const sorted = [...masteries].sort((a, b) => a.mastery - b.mastery);
  const goals: LearningGoal[] = [];
  for (const m of sorted.slice(0, 2)) {
    if (m.mastery < 0.7) {
      goals.push({ skill: m.skill, targetMastery: 0.8, reason: m.trend === "needs_practice" ? "needs_practice" : "developing" });
    }
  }
  // Add a strength goal
  const strongest = [...masteries].sort((a, b) => b.mastery - a.mastery)[0];
  if (strongest && strongest.mastery >= 0.8) {
    goals.push({ skill: strongest.skill, targetMastery: 0.9, reason: "strength" });
  }
  return goals.slice(0, 3);
}

/**
 * Deterministic Personalized Session Planner
 * Order: Learner Profile → Learning Signals → Eligible Activities → Interest+Need Analysis → Game Selection → Complexity Selection → Content Selection → Small controlled randomization → Personalized Session
 */
export async function buildPersonalizedSessionPlan(learnerId: string): Promise<PersonalizedSessionPlan> {
  const learner = await getLearner(learnerId);
  const ageBand = (learner?.ageBand ?? "6-7") as AgeBand;
  const globalLevel = Math.max(1, Math.min(6, learner?.level ?? 1));
  const interests = learner?.interests ?? {};
  const progress = learner?.gameProgress ?? {};

  // 1. Compute mastery for each distinct skill
  const allSkills = [...new Set(ACTIVITY_REGISTRY.flatMap((a) => a.skills))];
  const masteries = new Map<string, SkillMastery>();
  for (const skill of allSkills) {
    masteries.set(skill, computeSkillMastery(learner, skill));
  }

  // 2. Filter eligible activities by ageBand
  const eligible: ActivityDef[] = ACTIVITY_REGISTRY.filter((a) => (a.ageBands as string[]).includes(ageBand));

  // Collect owned world reward tags for soft personalization (§23): a dino sticker
  // gently nudges jungle/counting activities, never forces them.
  const ownedStickerIds = (learner?.stickerIds ?? []) as string[];
  const ownedWorldEvents = ownedStickerIds.map((id) => WORLD_EVENT_CONFIGS[id]).filter(Boolean);
  const ownedThemes = new Set(ownedWorldEvents.flatMap((e) => e.learningThemes));
  const ownedGameAffinity = new Set(ownedWorldEvents.flatMap((e) => e.gameAffinity));

  // 3. Score each activity: interest + need + mastery gap + variety + recency + engagement/novelty (adaptive) + world rewards
  const adaptiveOn = process.env.ADAPTIVE_ENGINE_ENABLED === "true";
  const scored = eligible.map((a) => {
    const skill = a.skills[0] ?? a.id;
    const mastery = masteries.get(skill)?.mastery ?? 0.5;
    const interest = interests[a.id] ?? interests[skill] ?? 0;
    // Also check gameId interests for href-based activities
    const gameId = a.href ? a.href.split("/").pop()! : a.id;
    const gameInterest = interests[gameId] ?? 0;
    const totalInterest = Math.max(interest, gameInterest);

    const prog = progress[a.id] ?? progress[gameId] ?? progress[skill];
    const completions = (prog as { completions?: number } | undefined)?.completions ?? 0;
    const recentAcc = (prog as { recentAccuracy?: number[] } | undefined)?.recentAccuracy ?? [];
    const lastAcc = recentAcc.length ? recentAcc[recentAcc.length - 1] : undefined;

    // Need: low mastery or low completions → higher need
    let need = 0;
    if (completions === 0) need = 2.5; // unplayed = high opportunity
    else if (mastery < 0.5) need = 3; // struggling
    else if (mastery < 0.7) need = 2;
    else if (mastery < 0.85) need = 1;
    else need = 0.3; // strong but still need variety

    // Variety penalty: heavily played
    const varietyPenalty = Math.min(2, completions * 0.25);
    // Recency penalty: recently played recently (check lastResult)
    let recencyPenalty = 0;
    if (learner?.lastResult?.gameId === a.id || learner?.lastResult?.gameId === gameId) {
      recencyPenalty = 1.5;
    }

    // Interest boost
    const interestBoost = totalInterest * 0.5;

    // Mastery gap boost: prioritize developing skills at global level
    const masteryGap = (0.8 - mastery) * 1.0; // positive if below 0.8

    // Adaptive: engagement (theme/character) + learningBehavior (responseTime/hints) — additive, tiny, deterministic
    let engagementBoost = 0;
    let noveltyBoost = 0;
    if (adaptiveOn) {
      // Engagement: if learner has high interest in this activity's category/theme, boost slightly
      // For now, theme is inferred from activityId; use interest as proxy for theme preference
      engagementBoost = totalInterest > 3 ? 0.4 : totalInterest > 1 ? 0.15 : 0;
      // Novelty: unplayed or not recently seen gets a small bump
      if (completions === 0) noveltyBoost = 0.3;
      else if (completions === 1) noveltyBoost = 0.12;
      // Learning behavior: slow response or high hints → slightly reduce priority for this exact activity, encourage variety
      const progExt = prog as unknown as { recentResponseTime?: number[]; hintsUsed?: number } | undefined;
      if (progExt?.recentResponseTime?.length) {
        const avgRt = progExt.recentResponseTime.reduce((s, v) => s + v, 0) / progExt.recentResponseTime.length;
        if (avgRt > 7000) engagementBoost -= 0.2;
      }
      if (progExt?.hintsUsed && completions) {
        const hintRate = progExt.hintsUsed / completions;
        if (hintRate > 2) engagementBoost -= 0.15;
      }
    }

    // World reward affinity: if the child recently earned e.g. rex (jungle/counting) or boat (ocean),
    // gently boost activities in that theme / game so rewards become learning context (§24).
    // Keep it small (0.2–0.35) and deterministic — interest/need still dominate.
    let worldBoost = 0;
    const gameIdForBoost = a.href ? (a.href.split("/").pop() ?? a.id) : a.id;
    if (ownedGameAffinity.has(gameIdForBoost)) worldBoost += 0.3;
    else if (ownedGameAffinity.has(skill)) worldBoost += 0.2;
    if (ownedThemes.has(a.category)) worldBoost += 0.12;
    // Cap world boost so it never overrides need/interest strongly
    worldBoost = Math.min(0.35, worldBoost);

    // Deterministic tiny jitter for content variety (after personalization)
    const jitter = (mulberry32(hashSeed(`${learnerId}:${a.id}:${globalLevel}`))() - 0.5) * 0.05;

    const priority = interestBoost + need * 1.3 + masteryGap * 1.2 - varietyPenalty - recencyPenalty + engagementBoost + noveltyBoost + worldBoost + jitter;

    let reason = "variety";
    if (need >= 2.5) reason = "discovery";
    else if (need >= 2) reason = "needs_practice";
    else if (totalInterest > 2) reason = "interest";
    else if (mastery < 0.6) reason = "developing";

    return { activity: a, mastery, priority, reason, completions, engagementBoost, noveltyBoost };
  });

  // 4. Sort by priority descending
  scored.sort((a, b) => b.priority - a.priority);

  // 5. Select top N deterministically, ensure category variety
  const sessionSize = 5;
  const selected: typeof scored = [];
  const usedCategories = new Set<string>();
  // First pass: ensure one per category for variety
  for (const cat of ["numbers", "words", "think", "shapes", "discover", "write", "puzzles"] as const) {
    if (selected.length >= sessionSize) break;
    const bestInCat = scored.find((s) => s.activity.category === cat && !selected.includes(s));
    if (bestInCat) {
      selected.push(bestInCat);
      usedCategories.add(cat);
    }
  }
  // Fill remaining by priority
  for (const s of scored) {
    if (selected.length >= sessionSize) break;
    if (!selected.includes(s)) selected.push(s);
  }
  // If still not enough (edge), fill with highest priority remaining
  while (selected.length < sessionSize && scored.length > selected.length) {
    const remaining = scored.filter((s) => !selected.includes(s));
    if (remaining.length === 0) break;
    selected.push(remaining[0]);
  }

  // 6. Small controlled randomization: shuffle non-top items with seeded PRNG
  // Top item stays (most needed), rest shuffled deterministically for variety
  const top = selected[0];
  const rest = selected.slice(1);
  const shuffledRest = (() => {
    const seed = hashSeed(`${learnerId}:session:${globalLevel}:${new Date().toISOString().slice(0,10)}`);
    const rand = mulberry32(seed);
    const out = [...rest];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  })();
  const ordered = top ? [top, ...shuffledRest] : shuffledRest;

  // 7. For each selected activity, compute complexity dynamically
  const activities: PersonalizedActivity[] = ordered.map((s, idx) => {
    const a = s.activity;
    const skill = a.skills[0] ?? a.id;
    const mastery = s.mastery ?? 0.5;
    // Global level is base, mastery adjusts within age-band safety
    const adj = masteryToComplexityAdjustment(mastery);
    // Use globalLevel + adj, clamped to 1..5, as skillLevel for resolveComplexity
    // This ensures two learners at same global level get different complexity per skill
    const effectiveLevel = Math.max(1, Math.min(5, globalLevel + adj));
    const complexity = resolveComplexity(skill, ageBand, effectiveLevel);

    // Further adjust based on hints/response time if available (not yet stored per skill, placeholder)
    // Keep age-band safety: never exceed age-appropriate numberRange by more than one step (enforced in resolveComplexity)

    return {
      activityId: a.id,
      category: a.category,
      skill,
      activityType: a.activityType,
      complexity,
      reason: s.reason,
      priority: s.priority,
      href: a.href,
      title: a.title,
      icon: a.icon,
      explainability: {
        skill,
        difficulty: effectiveLevel,
        theme: a.category,
        reason: s.reason,
      },
    };
  });

  const learningGoals = buildLearningGoals([...masteries.values()]);

  return {
    learnerId,
    globalLevel,
    ageBand,
    activities,
    learningGoals,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    source: "deterministic",
  };
}
