import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, badRequest } from "@/server/admin";
import { createTask, getAgent } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";
import { analyzeInterests } from "@/agents/personalization";

const RunSchema = z.object({ learnerId: z.string().min(1).max(100).optional(), scope: z.enum(["learner", "cohort"]).default("cohort") });

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  // Cohort interest analysis — educational preferences only.
  return NextResponse.json({ success: true, data: { interests: await analyzeInterests() } });
}

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch { /* default cohort scope */ }
  const parsed = RunSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid personalization request.");
  const agent = getAgent("personalization-agent");
  if (!agent) return badRequest("Personalization agent not registered.");
  ensureWorkers();
  const task = await createTask({ agentId: agent.agentId, type: "learning_plan", input: parsed.data, requestedBy: { type: "admin", id: auth.admin.id } });
  const queue = await enqueue(agent.queue, { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "personalization_run_requested", target: { taskId: task.taskId, ...parsed.data } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
