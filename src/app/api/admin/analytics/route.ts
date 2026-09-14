import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { computeGameStats } from "@/agents/analytics";
import { requireAdmin } from "@/server/admin";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  const stats = await computeGameStats();
  const tasks = db ? await db.collection("agentTasks").countDocuments({ status: { $in: ["queued", "running"] } }).catch(() => 0) : 0;
  return NextResponse.json({ success: true, data: { stats, pendingTasks: tasks, generatedAt: new Date().toISOString() } });
}
