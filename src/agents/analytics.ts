import { getDb } from "@/db/mongodb";
import { getTask, assertWrite, logEvent } from "@/server/agent-store";

// Analytics Agent (BR-142): aggregate product/learning signals only — no child
// profiling. Snapshots refresh the cached dashboard summary; the admin API can
// also aggregate live from gameEvents.
export interface GameStats {
  gameId: string;
  starts: number;
  completions: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  completionRate: number;
}

export async function computeGameStats(days = 30): Promise<GameStats[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .collection("gameEvents")
    .aggregate([
      { $match: { serverTimestamp: { $gte: since }, gameId: { $ne: null } } },
      { $group: { _id: { gameId: "$gameId", event: "$event" }, n: { $sum: 1 } } },
    ])
    .toArray()
    .catch(() => []);
  const by: Record<string, Record<string, number>> = {};
  for (const r of rows as { _id: { gameId: string; event: string }; n: number }[]) {
    if (!r._id?.gameId) continue;
    by[r._id.gameId] ??= {};
    by[r._id.gameId][r._id.event] = r.n;
  }
  return Object.entries(by).map(([gameId, e]) => {
    const correct = e.answer_correct ?? 0;
    const incorrect = e.answer_incorrect ?? 0;
    const starts = e.game_started ?? 0;
    const completions = e.game_completed ?? 0;
    return {
      gameId,
      starts,
      completions,
      correct,
      incorrect,
      accuracy: correct + incorrect > 0 ? correct / (correct + incorrect) : 0,
      completionRate: starts > 0 ? completions / starts : 0,
    };
  });
}

export async function handleAnalyticsTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "systemSettings");
  const stats = await computeGameStats();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.collection("systemSettings").updateOne(
    { key: "analytics_snapshot" },
    { $set: { key: "analytics_snapshot", value: { games: stats, computedAt: new Date().toISOString() }, updatedAt: new Date() } },
    { upsert: true }
  );
  const summary = stats.map((s) => `${s.gameId}: ${Math.round(s.accuracy * 100)}% accuracy, ${Math.round(s.completionRate * 100)}% completion`).join("; ") || "no gameplay data yet";
  await logEvent(task.taskId, task.agentId, "analysis_completed", summary);
  return { games: stats.length, summary };
}
