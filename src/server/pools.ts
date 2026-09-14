import { getDb } from "@/db/mongodb";
import { CONTENT_POOLS } from "@/lib/content";
import { createTask, getAgent } from "@/server/agent-store";
import { enqueue } from "@/queue/queue";
import { ensureWorkers } from "@/workers/ensure";

export interface PoolStatus {
  gameId: string;
  difficulty: string;
  available: number;
  minimum: number;
  target: number;
  status: "healthy" | "low";
}

// Pool monitoring (DEC-074, BR-092). The child never waits: low pools produce
// background refill tasks, and gameplay falls back to deterministic content.
export async function poolStatuses(): Promise<PoolStatus[]> {
  const db = await getDb().catch(() => null);
  if (!db) {
    return Object.entries(CONTENT_POOLS).flatMap(([gameId, cfg]) =>
      (["easy"] as const).map((difficulty) => ({
        gameId,
        difficulty,
        available: 0,
        minimum: cfg.minimum,
        target: cfg.target,
        status: "low" as const,
      }))
    );
  }
  const out: PoolStatus[] = [];
  for (const [gameId, cfg] of Object.entries(CONTENT_POOLS)) {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const available = await db.collection("content").countDocuments({ gameId, difficulty, status: "active" }).catch(() => 0);
      out.push({ gameId, difficulty, available, minimum: cfg.minimum, target: cfg.target, status: available >= cfg.minimum ? "healthy" : "low" });
    }
  }
  return out;
}

export async function requestRefill(
  gameId: string,
  difficulty = "easy",
  count?: number,
  requestedBy: { type: string; id?: string } = { type: "system" }
): Promise<{ taskId: string }> {
  if (!(gameId in CONTENT_POOLS)) throw new Error(`Unknown game ${gameId}`);
  ensureWorkers();
  const agent = getAgent("content-agent");
  if (!agent) throw new Error("Content agent not registered");
  const cfg = (CONTENT_POOLS as Record<string, { batch: number }>)[gameId];
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.collection("agentTasks").findOne({
    agentId: "content-agent",
    type: "content_pool_refill",
    status: { $in: ["queued", "running"] },
    "input.gameId": gameId,
    "input.difficulty": difficulty,
  });
  if (existing) return { taskId: String(existing.taskId) };
  const task = await createTask({
    agentId: "content-agent",
    type: "content_pool_refill",
    input: { gameId, difficulty, quantity: count ?? cfg?.batch ?? 20 },
    requestedBy,
  });
  await enqueue(agent.queue, { taskId: task.taskId });
  return { taskId: task.taskId };
}
