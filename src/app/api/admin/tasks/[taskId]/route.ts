import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

export async function GET(_req: Request, { params }: { params: { taskId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  const task = await db.collection("agentTasks").findOne({ taskId: params.taskId }, { projection: { _id: 0 } });
  if (!task) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found." } }, { status: 404 });
  const runs = await db.collection("agentRuns").find({ taskId: params.taskId }, { projection: { _id: 0 } }).sort({ startedAt: -1 }).toArray();
  const events = await db.collection("agentEvents").find({ runId: { $in: runs.map((r) => r.runId) } }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
  return NextResponse.json({ success: true, data: { task, runs, events } });
}
