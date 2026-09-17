import { getTask, assertWrite, logEvent } from "@/server/agent-store";
import { buildAcademicPlan } from "@/services/academicEngine";
import { getDb } from "@/db/mongodb";

// Academic Agent — owns the Validated Learning Plan lifecycle. Reads learner
// mastery + MCP advisories (via the orchestrator), writes academicPlans +
// learningSignals only. Never mutates game state, score, rewards, or
// progression — deterministic services stay authoritative.
export async function handleAcademicTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "academicPlans");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const input = task.input as { learnerId?: string; locale?: string; scope?: "learner" | "cohort" };

  if (input.learnerId) {
    const plan = await buildAcademicPlan({ learnerId: input.learnerId, locale: input.locale });
    await logEvent(task.taskId, task.agentId, "academic_plan_created", `${plan.learnerId}: ${plan.concept} (${plan.stage}, ${plan.source}).`);
    return { plans: 1, learnerId: input.learnerId, concept: plan.concept, stage: plan.stage, source: plan.source };
  }

  const learners = await db.collection("learners").find({}).sort({ lastActivityAt: -1 }).limit(50).toArray().catch(() => []);
  let plans = 0;
  for (const l of learners as { learnerId: string }[]) {
    try {
      await buildAcademicPlan({ learnerId: l.learnerId, locale: input.locale });
      plans++;
    } catch {
      // One bad learner never fails the sweep.
    }
  }
  await logEvent(task.taskId, task.agentId, "academic_cohort_refreshed", `Refreshed ${plans} academic plans.`);
  return { plans };
}
