import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/mongodb";
import { CONTENT_POOLS } from "@/lib/content";
import { requireAdmin, badRequest } from "@/server/admin";
import { createTask } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const GenerateSchema = z.object({
  gameId: z.string().refine((value) => value in CONTENT_POOLS, "Unknown game."),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  quantity: z.number().int().min(1).max(100).default(10),
});

export async function GET(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: true, data: [] });
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const gameId = url.searchParams.get("gameId");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const filter: Record<string, string> = {};
  if (status) filter.status = status;
  if (gameId) filter.gameId = gameId;
  const docs = await db.collection("content").find(filter, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray();
  return NextResponse.json({ success: true, data: docs });
}

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const rl = await takeAsync(`admin-gen:${clientIp(req)}:${auth.admin.id}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many generation requests." } }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } });
  const parsed = GenerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid generation request.");
  ensureWorkers();
  const task = await createTask({
    agentId: "content-agent",
    type: "content_generation",
    input: parsed.data,
    requestedBy: { type: "admin", id: auth.admin.id },
  });
  const queue = await enqueue("content-generation", { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "content_generation_requested", target: { taskId: task.taskId, ...parsed.data } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
