// Agentic Academic Engine — deterministic core (dependency-free, unit-testable).
// Pure functions only: no @/ imports, no I/O, no Math.random, no LLM output.
// The orchestrator (services/academicEngine) calls MCP via the Education
// Gateway; this module validates + composes the Validated Learning Plan that
// is authoritative for gameplay. Advisory MCP output never enters play
// without passing validateAcademicPlan().

export type LearningStage = "learn" | "practice" | "play" | "recall" | "review" | "master";

export const STAGE_ORDER: LearningStage[] = ["learn", "practice", "play", "recall", "review", "master"];

export type ReasonCode =
  | "needs_practice"
  | "new_concept"
  | "review_due"
  | "interest_boost"
  | "prerequisite"
  | "variety"
  | "mastery_check";

export type ActivityType =
  | "concept_introduction"
  | "recognition"
  | "classification"
  | "counting"
  | "addition"
  | "subtraction"
  | "sorting"
  | "recall"
  | "review";

export interface ValidatedLearningPlan {
  learnerId: string;
  objective: string;
  concept: string;
  prerequisiteConcepts: string[];
  activityType: ActivityType;
  difficulty: number;
  complexity: number;
  reason: string;
  reasonCode: ReasonCode;
  source: "deterministic" | "tutor-mcp" | "oer-mcp" | "ncert-mcp" | "ai-assisted";
  nextReviewAt: string;
  stage: LearningStage;
  game: string;
  locale: string;
  characterId: string;
  priority: number;
}

export interface GameRecommendation {
  game: string;
  concept: string;
  complexity: number;
  objective: string;
  reasonCode: ReasonCode;
  priority: number;
}

const BANNED = ["kill", "gun", "blood", "scary", "monster", "war", "http", "www.", "<script"];

const ACTIVITY_TYPES: ActivityType[] = [
  "concept_introduction",
  "recognition",
  "classification",
  "counting",
  "addition",
  "subtraction",
  "sorting",
  "recall",
  "review",
];

const REASON_CODES: ReasonCode[] = [
  "needs_practice",
  "new_concept",
  "review_due",
  "interest_boost",
  "prerequisite",
  "variety",
  "mastery_check",
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stage machine: LEARN → PRACTICE → PLAY → RECALL → REVIEW → MASTER. Never skips. */
export function nextStage(current: LearningStage, success: boolean): LearningStage {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0) return "learn";
  if (current === "master") return success ? "master" : "review";
  if (current === "review") return success ? "master" : "practice";
  if (!success) return current === "learn" ? "learn" : "practice";
  return STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
}

/** Derive the starting stage from exposure/attempt history (no single-answer jumps). */
export function stageForProgress(exposures: number, attempts: number, accuracy: number): LearningStage {
  if (attempts >= 3 && accuracy >= 0.8) return "recall";
  if (attempts >= 1 && accuracy >= 0.6) return "practice";
  if (exposures >= 1) return "practice";
  return "learn";
}

function clampLevel(n: number): number {
  const v = Math.floor(n);
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(5, v));
}

/**
 * Deterministic next-concept picker: review-due first, then weakest practiced,
 * then unseen (respecting prerequisite order), then variety. Same inputs →
 * same output. MCP may suggest, but this ordering is authoritative.
 */
export function pickNextConcept(args: {
  learnerId: string;
  concepts: { id: string; status: string; accuracy: number; nextReviewAt?: string; prerequisites: string[] }[];
  nowIso?: string;
}): { conceptId: string; reasonCode: ReasonCode } | null {
  const now = Date.parse(args.nowIso ?? new Date().toISOString());
  const mastered = new Set(
    args.concepts.filter((c) => c.status === "mastered").map((c) => c.id)
  );
  const due = args.concepts
    .filter((c) => c.status === "needs_review" || (c.nextReviewAt && Date.parse(c.nextReviewAt) <= now))
    .sort((a, b) => a.accuracy - b.accuracy);
  if (due.length > 0) return { conceptId: due[0].id, reasonCode: "review_due" };
  const weak = args.concepts
    .filter((c) => (c.status === "practicing" || c.status === "learning") && c.accuracy < 0.7)
    .sort((a, b) => a.accuracy - b.accuracy);
  if (weak.length > 0) return { conceptId: weak[0].id, reasonCode: "needs_practice" };
  // Unseen whose prerequisites are satisfied.
  const unseen = args.concepts.filter((c) => c.status === "new");
  const ready = unseen.filter((c) => c.prerequisites.every((p) => mastered.has(p)));
  const pool = ready.length > 0 ? ready : unseen;
  if (pool.length > 0) {
    const rand = mulberry(hashSeed(`${args.learnerId}:concept`));
    const pick = pool[Math.floor(rand() * pool.length)];
    const isPrereq = pool.length !== unseen.length || ready.length > 0;
    return { conceptId: pick.id, reasonCode: isPrereq && ready.length > 0 ? "prerequisite" : "new_concept" };
  }
  // Everything mastered → mastery check on the weakest mastered.
  const all = [...args.concepts].sort((a, b) => a.accuracy - b.accuracy);
  if (all.length > 0) return { conceptId: all[0].id, reasonCode: "mastery_check" };
  return null;
}

/**
 * Interest + need + curriculum balance. Interests boost priority but never
 * override review/need (academic need wins; interest breaks ties).
 */
export function scoreConcept(args: {
  accuracy: number;
  interest: number;
  reviewDue: boolean;
  isNew: boolean;
}): number {
  let score = 0;
  if (args.reviewDue) score += 3;
  if (args.accuracy < 0.6) score += 2;
  else if (args.accuracy < 0.8) score += 1;
  if (args.isNew) score += 0.5;
  score += Math.min(1, Math.max(0, args.interest) * 0.2);
  return Math.round(score * 100) / 100;
}

/** Pure game recommendation builder (spec §16 shape). */
export function recommendGame(args: {
  learnerId: string;
  skills: { gameId: string; level: number; accuracy: number; completions: number }[];
  interests: Record<string, number>;
  conceptId: string;
  conceptToGame: Record<string, string>;
  objective: string;
  reasonCode: ReasonCode;
}): GameRecommendation {
  const game = args.conceptToGame[args.conceptId] ?? "discover";
  const skill = args.skills.find((s) => s.gameId === game);
  const complexity = clampLevel(skill?.level ?? 1);
  const interest = args.interests[game] ?? 0;
  const need = skill ? (skill.accuracy < 0.7 ? 0.3 : skill.accuracy < 0.85 ? 0.15 : 0) : 0.2;
  const priority = Math.round(Math.min(1, 0.5 + need + Math.min(0.2, interest * 0.05)) * 100) / 100;
  return {
    game,
    concept: args.conceptId,
    complexity,
    objective: args.objective,
    reasonCode: args.reasonCode,
    priority,
  };
}

/** Post-activity decision from validated result signals (never a single jump). */
export function decideNextStep(args: {
  accuracy: number;
  hintsUsed: number;
  attempts: number;
  avgResponseMs?: number;
  currentComplexity: number;
}): { action: "continue" | "practice" | "review" | "increase_complexity" | "introduce_new_concept"; complexity: number } {
  const complexity = clampLevel(args.currentComplexity);
  if (args.attempts < 2) return { action: "practice", complexity };
  if (args.accuracy < 0.5 || args.hintsUsed >= 3) return { action: "review", complexity };
  if (args.accuracy < 0.75) return { action: "practice", complexity };
  if (args.accuracy >= 0.85 && args.hintsUsed === 0 && args.attempts >= 3) {
    return { action: "increase_complexity", complexity: clampLevel(complexity + 1) };
  }
  if (args.accuracy >= 0.9 && args.attempts >= 5) return { action: "introduce_new_concept", complexity };
  return { action: "continue", complexity };
}

/** Parent-safe one-liners. Never exposes chain-of-thought or provider internals. */
export function parentReasonText(reasonCode: ReasonCode, conceptName: string): string {
  const name = conceptName.slice(0, 60) || "this concept";
  switch (reasonCode) {
    case "needs_practice":
      return `${name} needs more practice.`;
    case "new_concept":
      return `Introducing ${name}.`;
    case "review_due":
      return `Time to review ${name}.`;
    case "interest_boost":
      return `Building on interest in ${name}.`;
    case "prerequisite":
      return `Getting ready for ${name}.`;
    case "mastery_check":
      return `Checking mastery of ${name}.`;
    case "variety":
    default:
      return `Exploring ${name}.`;
  }
}

/** Authority gate: schema + content + age + safety. Returns null when unsafe. */
export function validateAcademicPlan(raw: unknown): ValidatedLearningPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.learnerId !== "string" || p.learnerId.length < 1 || p.learnerId.length > 100) return null;
  if (typeof p.objective !== "string" || p.objective.length < 2 || p.objective.length > 160) return null;
  if (typeof p.concept !== "string" || p.concept.length < 1 || p.concept.length > 80) return null;
  if (!Array.isArray(p.prerequisiteConcepts)) return null;
  if (p.prerequisiteConcepts.length > 10) return null;
  for (const c of p.prerequisiteConcepts) {
    if (typeof c !== "string" || c.length < 1 || c.length > 80) return null;
  }
  if (!ACTIVITY_TYPES.includes(p.activityType as ActivityType)) return null;
  if (!REASON_CODES.includes(p.reasonCode as ReasonCode)) return null;
  if (!STAGE_ORDER.includes(p.stage as LearningStage)) return null;
  const difficulty = Number(p.difficulty);
  const complexity = Number(p.complexity);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) return null;
  if (!Number.isInteger(complexity) || complexity < 1 || complexity > 5) return null;
  if (typeof p.reason !== "string" || p.reason.length < 3 || p.reason.length > 200) return null;
  // Reason must be a short structured explanation — reject chain-of-thought markers.
  const lowerReason = p.reason.toLowerCase();
  if (lowerReason.includes("chain-of-thought") || lowerReason.includes("reasoning:")) return null;
  if (typeof p.game !== "string" || p.game.length < 1 || p.game.length > 50) return null;
  if (typeof p.nextReviewAt !== "string" || !Number.isFinite(Date.parse(p.nextReviewAt))) return null;
  const allowedSources = ["deterministic", "tutor-mcp", "oer-mcp", "ncert-mcp", "ai-assisted"];
  if (typeof p.source !== "string" || !allowedSources.includes(p.source)) return null;
  // Safety: scan all free text.
  const hay = `${String(p.objective)} ${String(p.reason)} ${String(p.concept)}`.toLowerCase();
  for (const b of BANNED) {
    if (hay.includes(b)) return null;
  }
  const priority = typeof p.priority === "number" ? Math.max(0, Math.min(1, p.priority)) : 0.5;
  return {
    learnerId: p.learnerId as string,
    objective: (p.objective as string).slice(0, 160),
    concept: p.concept as string,
    prerequisiteConcepts: p.prerequisiteConcepts as string[],
    activityType: p.activityType as ActivityType,
    difficulty: clampLevel(difficulty),
    complexity: clampLevel(complexity),
    reason: (p.reason as string).slice(0, 200),
    reasonCode: p.reasonCode as ReasonCode,
    source: p.source as ValidatedLearningPlan["source"],
    nextReviewAt: p.nextReviewAt as string,
    stage: p.stage as LearningStage,
    game: p.game as string,
    locale: typeof p.locale === "string" ? (p.locale as string).slice(0, 10) : "en",
    characterId: typeof p.characterId === "string" ? (p.characterId as string).slice(0, 30) : "teddy",
    priority,
  };
}
