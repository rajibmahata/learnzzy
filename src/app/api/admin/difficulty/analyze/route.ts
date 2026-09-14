import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { createTask } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";

export async function POST() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  ensureWorkers();
  const task = await createTask({ agentId: "difficulty-agent", type: "difficulty_analysis", input: {}, requestedBy: { type: "admin", id: auth.admin.id } });
  const queue = await enqueue("difficulty-analysis", { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "difficulty_analysis_requested", target: { taskId: task.taskId } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
