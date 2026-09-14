import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/mongodb";
import { requireAdmin, badRequest } from "@/server/admin";
import { createTask } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";
import { clientIp, take } from "@/lib/rate-limit";

const GenerateSchema = z.object({ type: z.string().min(1).max(40), theme: z.string().min(1).max(30), games: z.array(z.string().min(1).max(30)).min(1).max(5).default(["addition"]) });

export async function GET(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: true, data: [] });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const filter: Record<string, string> = {};
  for (const k of ["gameId", "type", "theme", "status"] as const) {
    const v = url.searchParams.get(k);
    if (v) filter[k === "gameId" ? "games" : k] = v;
  }
  const search = url.searchParams.get("search");
  if (search) filter.type = search;
  const docs = await db.collection("assets").find(filter, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray();
  return NextResponse.json({ success: true, data: docs });
}

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const rl = take(`admin-asset:${clientIp(req)}:${auth.admin.id}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many asset requests." } }, { status: 429 });
  const parsed = GenerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid asset generation request.");
  ensureWorkers();
  const task = await createTask({ agentId: "asset-agent", type: "asset_generation", input: parsed.data, requestedBy: { type: "admin", id: auth.admin.id } });
  const queue = await enqueue("asset-processing", { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "asset_generation_requested", target: { taskId: task.taskId, ...parsed.data } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
