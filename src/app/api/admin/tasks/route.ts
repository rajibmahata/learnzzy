import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/mongodb";
import { createTask, getAgent } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { requireAdmin, badRequest } from "@/server/admin";
import { audit } from "@/server/audit";

const CreateTaskSchema = z.object({
  agentId: z.string().min(1),
  type: z.string().min(1).max(80),
  input: z.record(z.unknown()).default({}),
});

export async function GET(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: true, data: [] });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const docs = await db.collection("agentTasks").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray();
  return NextResponse.json({ success: true, data: docs });
}

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const parsed = CreateTaskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !getAgent(parsed.data.agentId)) return badRequest("Unknown agent or invalid task input.");
  ensureWorkers();
  const task = await createTask({ ...parsed.data, requestedBy: { type: "admin", id: auth.admin.id } });
  const agent = getAgent(task.agentId);
  if (!agent) return badRequest("Agent not found.");
  const queue = await enqueue(agent.queue, { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "agent_task_created", target: { taskId: task.taskId, agentId: task.agentId, type: task.type } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
