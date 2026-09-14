import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { createTask } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: [] });
  const findings = await db
    .collection("agentEvents")
    .find({ agentId: "qa-agent" }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()
    .catch(() => []);
  return NextResponse.json({ success: true, data: findings });
}

export async function POST() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  ensureWorkers();
  const task = await createTask({ agentId: "qa-agent", type: "qa_suite", input: {}, requestedBy: { type: "admin", id: auth.admin.id } });
  const queue = await enqueue("qa", { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "qa_suite_requested", target: { taskId: task.taskId } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
