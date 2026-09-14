import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: [] });
  const agg = await db.collection("agentTasks").aggregate([{ $group: { _id: "$agentId", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } } } }]).toArray().catch(() => []);
  const usage = await db.collection("aiUsage").aggregate([{ $group: { _id: "$agentId", requests: { $sum: 1 }, costUsd: { $sum: "$estimatedCostUsd" }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" } } }]).toArray().catch(() => []);
  const usageBy = Object.fromEntries((usage as { _id: string; requests: number; costUsd: number; inputTokens: number; outputTokens: number }[]).map((r) => [r._id, r]));
  return NextResponse.json({ success: true, data: (agg as { _id: string; total: number; completed: number; failed: number }[]).map((r) => ({ agentId: r._id, total: r.total, completed: r.completed, failed: r.failed, successRate: r.total ? r.completed / r.total : 0, usage: usageBy[r._id] ?? { requests: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 } })) });
}
