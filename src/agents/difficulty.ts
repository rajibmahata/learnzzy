import { getDb, newId } from "@/db/mongodb";
import { getTask, assertWrite, logEvent } from "@/server/agent-store";
import { computeGameStats } from "@/agents/analytics";

// Difficulty Agent (BR-083/084): recommends from aggregate evidence only —
// never from a handful of interactions — and never applies major changes
// without admin approval.
export async function handleDifficultyTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "difficultyRecommendations");
  const stats = await computeGameStats();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  let created = 0;
  for (const s of stats) {
    const sample = s.correct + s.incorrect;
    if (sample < 50) continue; // avoid over-adaptation (BR-084)
    let change: string | null = null;
    let reason = "";
    if (s.accuracy > 0.92) {
      change = "increase_challenge_share";
      reason = `${s.gameId} accuracy ${Math.round(s.accuracy * 100)}% over ${sample} answers — consider more higher-difficulty content.`;
    } else if (s.accuracy < 0.55) {
      change = "increase_support_share";
      reason = `${s.gameId} accuracy ${Math.round(s.accuracy * 100)}% over ${sample} answers — consider more foundational content.`;
    }
    if (!change) continue;
    const open = await db
      .collection("difficultyRecommendations")
      .findOne({ gameId: s.gameId, "recommendation.change": change, status: "pending_review" })
      .catch(() => null);
    if (open) continue;
    await db.collection("difficultyRecommendations").insertOne({
      recommendationId: newId("rec"),
      gameId: s.gameId,
      difficulty: "easy",
      recommendation: { change },
      evidence: { sampleSize: sample, successRate: s.accuracy, completionRate: s.completionRate },
      status: "pending_review",
      createdBy: task.agentId,
      createdAt: new Date(),
    });
    created++;
    await logEvent(task.taskId, task.agentId, "recommendation_created", reason);
  }
  return { analyzed: stats.length, recommendations: created };
}

export async function applyRecommendation(recommendationId: string, adminId: string): Promise<{ applied: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rec = (await db.collection("difficultyRecommendations").findOne({ recommendationId }).catch(() => null)) as {
    status: string;
    gameId: string;
    recommendation: { change: string };
  } | null;
  if (!rec || rec.status !== "pending_review") throw new Error("Recommendation is not pending review");
  // Applied = recorded mix preference consumed by the content pool; game rules untouched.
  await db.collection("difficultyRules").updateOne(
    { gameId: rec.gameId, difficulty: "easy" },
    {
      $set: { gameId: rec.gameId, difficulty: "easy", mixPreference: rec.recommendation.change, updatedAt: new Date(), updatedBy: adminId },
      $setOnInsert: { createdAt: new Date(), version: 1 },
    },
    { upsert: true }
  );
  await db.collection("difficultyRecommendations").updateOne(
    { recommendationId },
    { $set: { status: "applied", appliedAt: new Date(), appliedBy: adminId } }
  );
  return { applied: true };
}
