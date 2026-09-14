import { getDb } from "@/db/mongodb";
import { CONTENT_POOLS, type ContentDoc, type GamePoolKey } from "@/lib/content";

// Content reads — child gameplay queries ONLY status=active (BR-090).
export async function getActiveContent(
  gameId: string,
  difficulty: string,
  limit: number
): Promise<ContentDoc[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const docs = await db
    .collection("content")
    .find({ gameId, difficulty, status: "active" })
    .sort({ createdAt: 1 })
    .limit(safeLimit)
    .project({ _id: 0 })
    .toArray()
    .catch(() => []);
  return docs as ContentDoc[];
}

export async function getPoolStatus(): Promise<
  Array<{ gameId: string; difficulty: string; available: number; minimum: number; target: string | number; status: string }>
> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  const out: Array<{
    gameId: string;
    difficulty: string;
    available: number;
    minimum: number;
    target: string | number;
    status: string;
  }> = [];
  for (const [gameId, cfg] of Object.entries(CONTENT_POOLS)) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      // Only seed easy initially; report others as empty (honest pool status).
      const available =
        (await db
          .collection("content")
          .countDocuments({ gameId, difficulty, status: "active" })
          .catch(() => 0)) ?? 0;
      out.push({
        gameId,
        difficulty,
        available,
        minimum: (cfg as { minimum: number }).minimum,
        target: (cfg as { target: number }).target,
        status: available >= (cfg as { minimum: number }).minimum ? "healthy" : "low",
      });
    }
  }
  return out.filter((p) => (p.gameId as string) === "addition" || (p.gameId as string) === "subtraction" ? p.difficulty === "easy" : true);
}

export function poolKey(gameId: string): gameId is GamePoolKey {
  return gameId in CONTENT_POOLS;
}
