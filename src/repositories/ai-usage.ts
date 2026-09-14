import { getDb, newId } from "@/db/mongodb";

export interface UsageRecord {
  requestId: string;
  taskId?: string;
  runId?: string;
  agentId?: string;
  provider: string;
  model: string;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  status: "success" | "error" | "mock";
  createdAt: Date;
}

export async function recordUsage(r: Omit<UsageRecord, "requestId" | "createdAt">): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  const doc: UsageRecord = { ...r, requestId: newId("req"), createdAt: new Date() };
  await db.collection("aiUsage").insertOne(doc).catch(() => null);
}

export async function todayTotals(): Promise<{ requests: number; costUsd: number }> {
  const db = await getDb().catch(() => null);
  if (!db) return { requests: 0, costUsd: 0 };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const agg = await db
    .collection("aiUsage")
    .aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: null, requests: { $sum: 1 }, costUsd: { $sum: "$estimatedCostUsd" } } },
    ])
    .toArray()
    .catch(() => []);
  const row = (agg[0] ?? {}) as { requests?: number; costUsd?: number };
  return { requests: row.requests ?? 0, costUsd: row.costUsd ?? 0 };
}
