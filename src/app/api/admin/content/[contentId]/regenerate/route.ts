import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin, badRequest } from "@/server/admin";
import { createTask } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";

export async function POST(_req: Request, { params }: { params: { contentId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  const doc = (await db.collection("content").findOne({ contentId: params.contentId })) as { gameId?: string; difficulty?: string } | null;
  if (!doc) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Content not found." } }, { status: 404 });
  if (!doc.gameId) return badRequest("Content is missing gameId.");
  ensureWorkers();
  const task = await createTask({ agentId: "content-agent", type: "content_regenerate", input: { gameId: doc.gameId, difficulty: doc.difficulty ?? "easy", sourceContentId: params.contentId, quantity: 5 }, requestedBy: { type: "admin", id: auth.admin.id } });
  const queue = await enqueue("content-generation", { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "content_regenerate_requested", target: { contentId: params.contentId, taskId: task.taskId } });
  return NextResponse.json({ success: true, data: { task, queue } }, { status: 202 });
}
