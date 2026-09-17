import { getDb, newId } from "@/db/mongodb";
import type { ValidatedLearningPlan } from "@/lib/academic";

// Academic plans repository — durable store for Validated Learning Plans +
// advisory/decision observability consumed by the Admin Command Center and
// the Parent dashboard. Advisory MCP output is stored as operational
// summaries only (never chain-of-thought).

export interface AcademicPlanDoc extends ValidatedLearningPlan {
  planId: string;
  ageBand: string;
  createdAt: string;
}

export async function saveAcademicPlan(plan: Omit<AcademicPlanDoc, "planId">): Promise<string> {
  const planId = newId("aplan");
  const db = await getDb().catch(() => null);
  if (!db) return planId;
  await db
    .collection("academicPlans")
    .insertOne({ planId, ...plan, createdAtDb: new Date() })
    .catch(() => null);
  return planId;
}

export async function getLatestAcademicPlan(learnerId: string): Promise<AcademicPlanDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  return (await db
    .collection("academicPlans")
    .findOne({ learnerId }, { sort: { createdAtDb: -1 } })
    .catch(() => null)) as AcademicPlanDoc | null;
}

export async function listAcademicPlans(limit = 20): Promise<AcademicPlanDoc[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  return (await db
    .collection("academicPlans")
    .find({})
    .sort({ createdAtDb: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .toArray()
    .catch(() => [])) as AcademicPlanDoc[];
}

export async function recordAcademicEvent(args: {
  learnerId: string;
  planId?: string;
  event: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("agentEvents")
    .insertOne({
      runId: args.planId ?? newId("aplan"),
      agentId: "academic-agent",
      event: `academic.${args.event}`,
      level: "info",
      message: `learner ${args.learnerId}: ${args.message}`.slice(0, 500),
      metadata: args.metadata ?? null,
      createdAt: new Date(),
    })
    .catch(() => null);
}
