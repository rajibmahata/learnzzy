import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { poolStatuses } from "@/server/pools";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  const pools = await poolStatuses();
  const contentAgg = db ? await db.collection("content").aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray().catch(() => []) as { _id: string; n: number }[] : [];
  const content = Object.fromEntries(contentAgg.map((r) => [r._id, r.n]));
  const agents = db ? await db.collection("agentTasks").aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray().catch(() => []) as { _id: string; n: number }[] : [];
  const agentSummary = Object.fromEntries(agents.map((r) => [r._id, r.n]));
  let mongo: string = db ? "healthy" : "not_configured";
  if (db) {
    try { await db.command({ ping: 1 }); } catch { mongo = "unhealthy"; }
  }
  return NextResponse.json({
    success: true,
    data: {
      games: { active: 5, total: 5 },
      content: { active: content.active ?? 0, approved: content.approved ?? 0, pending: (content.validating ?? 0) + (content.draft ?? 0), rejected: content.rejected ?? 0, disabled: content.disabled ?? 0 },
      pools,
      agents: { queued: agentSummary.queued ?? 0, running: agentSummary.running ?? 0, completed: agentSummary.completed ?? 0, failed: agentSummary.failed ?? 0 },
      system: { api: "healthy", database: mongo, redis: process.env.REDIS_URL ? "configured" : "in_process_fallback", ai: process.env.AI_API_KEY ? "configured" : "mock_fallback" },
    },
  });
}
