import { getDb, newId } from "@/db/mongodb";

// Agent workforce store (DEC-090..094, BR-150..155). Least privilege (DEC-092):
// each agent declares the collections it may touch; writes are checked here.
export type TaskStatus = "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";

export interface AgentDef {
  agentId: string;
  name: string;
  type: string;
  description: string;
  queue: string;
  read: string[];
  write: string[];
}

export const AGENTS: AgentDef[] = [
  { agentId: "content-agent", name: "Content Agent", type: "content", description: "Generates learning activities.", queue: "content-generation", read: ["games", "gameConfigs", "difficultyRules", "assets", "content"], write: ["content", "contentVersions", "agentTasks", "agentRuns", "agentEvents", "aiUsage"] },
  { agentId: "quality-safety-agent", name: "Quality & Safety Agent", type: "quality", description: "Validates child-facing content.", queue: "content-validation", read: ["content", "assets"], write: ["content", "contentVersions", "agentTasks", "agentRuns", "agentEvents"] },
  { agentId: "asset-agent", name: "Asset Agent", type: "asset", description: "Manages the asset library.", queue: "asset-processing", read: ["assets", "content"], write: ["assets", "assetVersions", "agentTasks", "agentRuns", "agentEvents"] },
  { agentId: "analytics-agent", name: "Analytics Agent", type: "analytics", description: "Aggregates learning signals.", queue: "analytics", read: ["gameEvents", "sessions", "content"], write: ["systemSettings", "agentTasks", "agentRuns", "agentEvents"] },
  { agentId: "difficulty-agent", name: "Difficulty Agent", type: "difficulty", description: "Recommends difficulty tuning.", queue: "difficulty-analysis", read: ["gameEvents", "difficultyRules", "content"], write: ["difficultyRecommendations", "difficultyRules", "agentTasks", "agentRuns", "agentEvents"] },
  { agentId: "personalization-agent", name: "Personalization Agent", type: "personalization", description: "Recommends learning plans and game sequencing.", queue: "learning-plan", read: ["learners", "learnerProgress", "learningSignals", "gameEvents", "levels", "content"], write: ["learningPlans", "learningSignals", "agentTasks", "agentRuns", "agentEvents", "aiUsage"] },
  { agentId: "qa-agent", name: "Test & QA Agent", type: "qa", description: "Validates the adaptive-learning system.", queue: "qa", read: ["learners", "levels", "content", "learningPlans", "gameEvents"], write: ["agentTasks", "agentRuns", "agentEvents"] },
];

export function getAgent(agentId: string): AgentDef | undefined {
  return AGENTS.find((a) => a.agentId === agentId);
}

export function assertWrite(agentId: string, collection: string): void {
  const agent = getAgent(agentId);
  if (!agent) throw new Error(`Unknown agent ${agentId}`);
  if (!agent.write.includes(collection)) throw new Error(`Agent ${agentId} may not write ${collection}`);
}

export async function ensureAgents(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  for (const a of AGENTS) {
    await db.collection("agents").updateOne(
      { agentId: a.agentId },
      {
        $set: { name: a.name, type: a.type, description: a.description, status: "active", queue: a.queue, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }
}

export interface AgentTask {
  taskId: string;
  agentId: string;
  type: string;
  status: TaskStatus;
  input: Record<string, unknown>;
  requestedBy: { type: string; id?: string };
  attempts: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export async function createTask(args: {
  agentId: string;
  type: string;
  input: Record<string, unknown>;
  requestedBy?: { type: string; id?: string };
}): Promise<AgentTask> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!getAgent(args.agentId)) throw new Error(`Unknown agent ${args.agentId}`);
  const task: AgentTask = {
    taskId: newId("task"),
    agentId: args.agentId,
    type: args.type,
    status: "queued",
    input: args.input,
    requestedBy: args.requestedBy ?? { type: "system" },
    attempts: 0,
    createdAt: new Date(),
  };
  await db.collection("agentTasks").insertOne(task);
  return task;
}

export async function getTask(taskId: string): Promise<AgentTask | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  return (await db.collection("agentTasks").findOne({ taskId }).catch(() => null)) as AgentTask | null;
}

export async function setTaskStatus(taskId: string, status: TaskStatus, patch: Partial<AgentTask> = {}): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db.collection("agentTasks").updateOne({ taskId }, { $set: { status, ...patch } }).catch(() => null);
}

export async function recordRun(args: {
  taskId: string;
  agentId: string;
  attempt: number;
  model?: string;
  status: "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<string> {
  const db = await getDb().catch(() => null);
  const runId = newId("run");
  if (!db) return runId;
  const now = new Date();
  await db
    .collection("agentRuns")
    .insertOne({
      runId,
      taskId: args.taskId,
      agentId: args.agentId,
      attempt: args.attempt,
      model: args.model,
      status: args.status,
      startedAt: now,
      completedAt: args.status === "running" ? null : now,
      result: args.result ?? null,
      usage: { inputTokens: args.inputTokens ?? 0, outputTokens: args.outputTokens ?? 0 },
      error: args.error ?? null,
    })
    .catch(() => null);
  return runId;
}

// Operational summaries only — never chain-of-thought (DEC-094).
export async function logEvent(runId: string, agentId: string, event: string, message: string, level = "info"): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("agentEvents")
    .insertOne({ runId, agentId, event, level, message: message.slice(0, 500), createdAt: new Date() })
    .catch(() => null);
}
