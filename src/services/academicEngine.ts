import { getLearner } from "@/repositories/learners";
import { getConceptDef, conceptsForGame, CONCEPTS } from "@/lib/concepts";
import { flattenMasteryMap, getConcept as getKnowledgeConcept } from "@/lib/knowledge";
import {
  pickNextConcept,
  recommendGame,
  stageForProgress,
  validateAcademicPlan,
  parentReasonText,
  type ValidatedLearningPlan,
  type ReasonCode,
} from "@/lib/academic";
import { pickCharacterFor } from "@/lib/voice";
import { saveAcademicPlan } from "@/repositories/academicPlans";

// Academic Orchestrator — answers "What should this learner learn next?"
// Advisory MCP (Tutor/OER/NCERT) behind the Education Gateway enriches the
// decision; the deterministic Learnzzy pipeline stays authoritative. MCP
// failures never stop gameplay: every gateway call is isolated in try/catch
// and the deterministic plan stands as-is.

export interface AcademicPlanInput {
  learnerId: string;
  locale?: string;
  recentGameIds?: string[];
  interestsOverride?: Record<string, number>;
}

const CONCEPT_TO_GAME: Record<string, string> = {};
for (const c of CONCEPTS) {
  for (const g of c.games) {
    if (!CONCEPT_TO_GAME[c.id]) CONCEPT_TO_GAME[c.id] = g;
  }
}
// Discovery catalog concepts resolve to the discover game.
CONCEPT_TO_GAME["birds.parrot"] = "discover";

const GAME_OBJECTIVE: Record<string, string> = {
  addition: "addition-practice",
  subtraction: "subtraction-practice",
  "clean-up": "sorting-practice",
  puzzle: "spatial-practice",
  sketch: "tracing-practice",
  discover: "bird-recognition",
};

function conceptDisplayName(conceptId: string): string {
  const def = getConceptDef(conceptId);
  if (def) return def.name;
  const kc = getKnowledgeConcept(conceptId);
  if (kc) return kc.names.en;
  return conceptId;
}

function activityForGame(gameId: string): ValidatedLearningPlan["activityType"] {
  switch (gameId) {
    case "addition":
      return "addition";
    case "subtraction":
      return "subtraction";
    case "clean-up":
      return "sorting";
    case "puzzle":
      return "classification";
    case "sketch":
      return "recognition";
    case "discover":
    default:
      return "recognition";
  }
}

export async function buildAcademicPlan(input: AcademicPlanInput): Promise<ValidatedLearningPlan> {
  const learner = await getLearner(input.learnerId).catch(() => null);
  const ageBand = (learner?.ageBand ?? "6-7") as "4-5" | "6-7" | "8-9";
  const locale = (input.locale ?? "en").slice(0, 10);
  const interests = input.interestsOverride ?? learner?.interests ?? {};
  const nowIso = new Date().toISOString();

  // Assemble the candidate concept list: academic graph + learner discovery mastery.
  const mastery = flattenMasteryMap(learner?.conceptMastery);
  const gameProgress = learner?.gameProgress ?? {};
  const candidates = CONCEPTS.filter((c) => c.ageBands.includes(ageBand)).map((c) => {
    let attempts = 0;
    let correct = 0;
    for (const [gameId, p] of Object.entries(gameProgress)) {
      if (!conceptsForGame(gameId, p.lastLevel || learner?.level || 1).includes(c.id)) continue;
      const a = p.completions * 5;
      attempts += a;
      correct += Math.round(a * (p.bestAccuracy ?? 0));
    }
    const m = mastery[c.id];
    if (m) {
      attempts = Math.max(attempts, m.attempts);
      correct = Math.max(correct, m.correct);
    }
    const accuracy = attempts === 0 ? 0 : correct / attempts;
    const status = m?.status ?? (attempts === 0 ? "new" : accuracy >= 0.8 && attempts >= 3 ? "mastered" : "practicing");
    return {
      id: c.id,
      status,
      accuracy,
      nextReviewAt: m?.nextReviewAt,
      prerequisites: c.prerequisites,
    };
  });

  // MCP enrichment (advisory only, isolated failures).
  let advisedConcept: string | null = null;
  let advisedSource: ValidatedLearningPlan["source"] = "deterministic";
  let prerequisiteConcepts: string[] = [];
  try {
    const { ensureEducationProviders } = await import("@/integrations/education/init");
    const { educationGateway } = await import("@/integrations/education/gateway");
    ensureEducationProviders();
    const conceptIds = candidates.map((c) => c.id).slice(0, 20);
    const state = await educationGateway
      .getLearnerState({ learnerId: input.learnerId, ageBand, conceptIds })
      .catch(() => null);
    if (state && state.state.concepts.length > 0) {
      const weakest = [...state.state.concepts].sort((a, b) => a.mastery - b.mastery)[0];
      if (weakest && getConceptDef(weakest.conceptId)) {
        advisedConcept = weakest.conceptId;
        advisedSource = state.mocked ? "deterministic" : "tutor-mcp";
      }
    }
    // Placeholder for the picked concept — resolved after deterministic pick.
    void advisedConcept;
    void advisedSource;
  } catch {
    // Gateway failure never fails the plan.
  }

  const pick = pickNextConcept({ learnerId: input.learnerId, concepts: candidates, nowIso });
  let conceptId = pick?.conceptId ?? "knowledge.world-discovery";
  let reasonCode: ReasonCode = pick?.reasonCode ?? "variety";
  if (advisedConcept && getConceptDef(advisedConcept)) {
    // Advisory may only nominate a known concept that is also a valid
    // candidate; deterministic ordering still decides stage/complexity.
    if (candidates.some((c) => c.id === advisedConcept)) {
      conceptId = advisedConcept;
      reasonCode = "needs_practice";
      advisedSource = advisedSource === "deterministic" ? "deterministic" : "tutor-mcp";
    }
  }

  // Prerequisites via NCERT gateway (advisory), fallback to local graph.
  const localDef = getConceptDef(conceptId);
  prerequisiteConcepts = localDef?.prerequisites.slice(0, 10) ?? [];
  try {
    const { educationGateway } = await import("@/integrations/education/gateway");
    const { ensureEducationProviders } = await import("@/integrations/education/init");
    ensureEducationProviders();
    const { prerequisites } = await educationGateway.getPrerequisites({ conceptId }).catch(() => ({ prerequisites: [] as never[], mocked: true as boolean }));
    if (prerequisites.length > 0) {
      const known = prerequisites
        .map((p) => p.conceptId)
        .filter((id): id is string => typeof id === "string" && !!id && !!getConceptDef(id))
        .slice(0, 10);
      if (known.length > 0) prerequisiteConcepts = known;
    }
  } catch {
    // Local graph stands.
  }

  const gameId = CONCEPT_TO_GAME[conceptId] ?? "discover";
  const skills = Object.entries(gameProgress).map(([gid, p]) => ({
    gameId: gid,
    level: p.lastLevel || learner?.level || 1,
    accuracy: p.bestAccuracy ?? 0,
    completions: p.completions ?? 0,
  }));
  const rec = recommendGame({
    learnerId: input.learnerId,
    skills,
    interests,
    conceptId,
    conceptToGame: CONCEPT_TO_GAME,
    objective: GAME_OBJECTIVE[gameId] ?? "concept-practice",
    reasonCode,
  });

  const m = mastery[conceptId];
  const exposures = m?.exposures ?? 0;
  const attempts = m?.attempts ?? 0;
  const accuracy = attempts > 0 ? m!.correct / Math.max(1, m!.attempts) : 0;
  const stage = stageForProgress(exposures, attempts, accuracy);
  const characterId = pickCharacterFor(`${input.learnerId}:${conceptId}`);
  const name = conceptDisplayName(conceptId);
  const reason = parentReasonText(reasonCode, name);
  const nextReviewAt = m?.nextReviewAt ?? new Date(Date.now() + 3 * 86400000).toISOString();

  const raw = {
    learnerId: input.learnerId,
    objective: rec.objective,
    concept: conceptId,
    prerequisiteConcepts,
    activityType: activityForGame(gameId),
    difficulty: Math.max(1, Math.min(5, learner?.level ?? 1)),
    complexity: rec.complexity,
    reason,
    reasonCode,
    source: advisedSource,
    nextReviewAt,
    stage,
    game: rec.game,
    locale,
    characterId,
    priority: rec.priority,
  };
  const validated = validateAcademicPlan(raw);
  const plan: ValidatedLearningPlan =
    validated ??
    (validateAcademicPlan({ ...raw, source: "deterministic", reason: parentReasonText("variety", name), reasonCode: "variety" }) as ValidatedLearningPlan);

  // Persist best-effort (observability for Admin Command Center + parents).
  await saveAcademicPlan({ ...plan, ageBand, createdAt: nowIso }).catch(() => null);
  return plan;
}
