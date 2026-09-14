import { getDb, newId } from "@/db/mongodb";
import { getTask, assertWrite, logEvent } from "@/server/agent-store";
import { buildPlan, savePlan } from "@/services/personalizationService";
import { aggregateEvidence, annotatePlan, validateAdvisory } from "@/services/educationAdvisory";
import { educationGateway } from "@/integrations/education/gateway";
import { ensureEducationProviders } from "@/integrations/education/init";
import { getLearner } from "@/repositories/learners";

// Personalization / Learning Planner Agent: recommends game sequencing,
// interest-based planning and progression analysis. Never mutates gameplay
// state directly — writes learningPlans + learningSignals only. AI/MCP output
// is advisory and validated before it can annotate a plan (DEC-071/191).
async function enrichOneLearner(learnerId: string, taskId: string, agentId: string): Promise<{ advised: boolean }> {
  const plan = await buildPlan(learnerId);
  await savePlan(plan);
  // Async gateway enrichment: aggregated evidence out, validated advisory in.
  // Any failure => deterministic plan stands as-is.
  try {
    ensureEducationProviders();
    const learner = await getLearner(learnerId).catch(() => null);
    if (learner) {
      const sessionId = learner.sessionId;
      for (const evidence of aggregateEvidence(learner, sessionId)) {
        await educationGateway.recordLearningEvidence(evidence).catch(() => null);
      }
      const { conceptsForGame } = await import("@/lib/concepts");
      const conceptIds = [...new Set(plan.items.flatMap((i) => conceptsForGame(i.gameId, plan.level)))].slice(0, 20);
      const state = await educationGateway.getLearnerState({
        learnerId,
        ageBand: learner.ageBand,
        conceptIds,
      }).catch(() => null);
      const rec = await educationGateway.recommendNextActivity({
        learnerId,
        ageBand: learner.ageBand,
        currentLevel: plan.level,
        recentGameIds: [],
        focusConceptIds: (state?.state.concepts ?? []).filter((c) => c.mastery < 0.6).map((c) => c.conceptId).slice(0, 5),
      }).catch(() => null);
      if (rec?.recommendation) {
        const advisory = validateAdvisory(plan, {
          gameId: rec.recommendation.gameId,
          conceptId: rec.recommendation.conceptId,
          reason: rec.recommendation.reason,
          misconceptions: state?.state.misconceptions ?? [],
        });
        if (advisory) {
          const annotated = annotatePlan(plan, advisory);
          const db = await getDb().catch(() => null);
          if (db) {
            await db.collection("learningPlans").insertOne({ planId: newId("plan"), ...annotated, createdAt: new Date() }).catch(() => null);
          }
          await logEvent(taskId, agentId, "plan_advised", `Advisory for ${learnerId}: focus ${advisory.focusGameId} (${rec.mocked ? "mock" : "live"}).`);
          return { advised: true };
        }
      }
    }
  } catch { /* gateway failure never fails the plan */ }
  return { advised: false };
}

export async function handlePersonalizationTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "learningPlans");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const input = task.input as { learnerId?: string; scope?: "learner" | "cohort" };

  if (input.learnerId) {
    const plan = await buildPlan(input.learnerId);
    await savePlan(plan);
    const { advised } = await enrichOneLearner(input.learnerId, task.taskId, task.agentId);
    await logEvent(task.taskId, task.agentId, "plan_created", `Plan for ${input.learnerId}: ${plan.items.map((i) => i.gameId).join(", ")} (${advised ? "ai-assisted" : plan.source}).`);
    return { plans: 1, learnerId: input.learnerId, source: advised ? "ai-assisted" : plan.source };
  }

  // Cohort sweep: refresh plans for recently active learners (bounded).
  const learners = await db
    .collection("learners")
    .find({})
    .sort({ lastActivityAt: -1 })
    .limit(50)
    .toArray()
    .catch(() => []);
  let plans = 0;
  let advised = 0;
  for (const l of learners as { learnerId: string }[]) {
    try {
      const plan = await buildPlan(l.learnerId);
      await savePlan(plan);
      plans++;
      const r = await enrichOneLearner(l.learnerId, task.taskId, task.agentId);
      if (r.advised) advised++;
    } catch { /* one bad learner never fails the sweep */ }
  }
  await logEvent(task.taskId, task.agentId, "cohort_plans_refreshed", `Refreshed ${plans} learning plans (${advised} with gateway advisory).`);
  return { plans, advised };
}

// Interest analysis over the cohort: which games/themes engage learners.
// Educational preferences only — never sensitive attributes.
export async function analyzeInterests(): Promise<{ gameId: string; learners: number; completions: number }[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  const rows = await db
    .collection("learners")
    .aggregate([
      { $project: { interests: { $objectToArray: "$interests" }, progress: { $objectToArray: "$gameProgress" } } },
      { $unwind: { path: "$interests", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$interests.k", learners: { $sum: 1 }, completions: { $sum: "$interests.v" } } },
    ])
    .toArray()
    .catch(() => []);
  return (rows as { _id: string; learners: number; completions: number }[])
    .filter((r) => r._id)
    .map((r) => ({ gameId: r._id, learners: r.learners, completions: r.completions ?? 0 }));
}


