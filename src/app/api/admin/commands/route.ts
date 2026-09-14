import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, badRequest } from "@/server/admin";
import { createTask, getAgent } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";
import { audit } from "@/server/audit";
import { classify } from "@/server/ai";
import { clientIp, take } from "@/lib/rate-limit";

const CommandSchema = z.object({ command: z.string().min(3).max(500) });

// Intent extraction → structured task (DEC-102, BR-162/163). Never raw MongoDB.
// Consequential actions are audited and, where needed, require explicit approval elsewhere.
async function toIntent(command: string): Promise<{ agentId: string; type: string; input: Record<string, unknown> } | null> {
  const t = command.toLowerCase();
  // Fast heuristics first — no AI needed for common operations.
  if (t.includes("refill") || t.includes("generate") || t.includes("create")) {
    const game = (["addition", "subtraction", "clean-up", "puzzle", "sketch"].find((g) => t.includes(g)) ?? "addition") as string;
    const difficulty = (t.includes("hard") ? "hard" : t.includes("medium") ? "medium" : "easy") as string;
    const n = Number(t.match(/\b(\d{1,3})\b/)?.[1] ?? "20");
    return { agentId: "content-agent", type: "content_pool_refill", input: { gameId: game, difficulty, quantity: Math.min(Math.max(n, 1), 100) } };
  }
  if (t.includes("asset") || t.includes("image")) {
    const theme = (["jungle", "ocean", "garden", "farm", "space", "forest"].find((w) => t.includes(w)) ?? "garden") as string;
    return { agentId: "asset-agent", type: "asset_generation", input: { type: "object", theme } };
  }
  if (t.includes("analytics") || t.includes("report") || t.includes("stats") || t.includes("performance")) {
    return { agentId: "analytics-agent", type: "analytics_report", input: { command: command.slice(0, 200) } };
  }
  if (t.includes("difficulty") || t.includes("recommend") || t.includes("tuning")) {
    return { agentId: "difficulty-agent", type: "difficulty_analysis", input: {} };
  }
  if (t.includes("validat") || t.includes("quality") || t.includes("safety") || t.includes("review")) {
    return { agentId: "quality-safety-agent", type: "quality_sweep", input: {} };
  }
  // AI helps classify the leftovers → nano routing, validated output.
  try {
    const label = await classify({ text: command, labels: ["content", "asset", "analytics", "difficulty", "quality"], agentId: "system" });
    if (label === "content") return { agentId: "content-agent", type: "content_pool_refill", input: { gameId: "addition", difficulty: "easy", quantity: 20 } };
    if (label === "asset") return { agentId: "asset-agent", type: "asset_generation", input: { type: "object", theme: "garden" } };
    if (label === "analytics") return { agentId: "analytics-agent", type: "analytics_report", input: {} };
    if (label === "difficulty") return { agentId: "difficulty-agent", type: "difficulty_analysis", input: {} };
    if (label === "quality") return { agentId: "quality-safety-agent", type: "quality_sweep", input: {} };
  } catch { /* fallback below */ }
  return null;
}

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  // History is task history; no prompts stored.
  const { getDb } = await import("@/db/mongodb");
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: [] });
  const docs = await db.collection("agentTasks").find({ "requestedBy.type": "admin" }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
  return NextResponse.json({ success: true, data: docs });
}

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const rl = take(`admin-cmd:${clientIp(req)}:${auth.admin.id}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many commands." } }, { status: 429 });
  const parsed = CommandSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Command is required.");
  const intent = await toIntent(parsed.data.command);
  if (!intent || !getAgent(intent.agentId)) return badRequest("Could not understand that command. Try: 'Refill the addition easy-content pool' or 'Create 20 puzzle activities'.");
  ensureWorkers();
  const task = await createTask({ agentId: intent.agentId, type: intent.type, input: intent.input, requestedBy: { type: "admin", id: auth.admin.id } });
  const agent = getAgent(intent.agentId);
  if (!agent) return badRequest("Agent not found.");
  const queue = await enqueue(agent.queue, { taskId: task.taskId });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "admin_command", target: { command: parsed.data.command.slice(0, 200), taskId: task.taskId, agentId: intent.agentId, type: intent.type } });
  return NextResponse.json({ success: true, data: { task, queue, intent } }, { status: 202 });
}
