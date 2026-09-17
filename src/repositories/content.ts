import { getDb } from "@/db/mongodb";
import { CONTENT_POOLS, type ContentDoc, type GamePoolKey } from "@/lib/content";
import { selectWithRecentExclusion } from "@/lib/contentSelection";

// Content reads — child gameplay queries ONLY status=active (BR-090).
export async function getActiveContent(
  gameId: string,
  difficulty: string,
  limit: number,
  options: { seed?: number; recentIds?: string[]; level?: number } = {}
): Promise<ContentDoc[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const filter: Record<string, unknown> = { gameId, difficulty, status: "active" };
  // Levels 4-5 need curriculum-tagged content so they do not silently reuse
  // the legacy three-difficulty pool. Until those records exist, the API uses
  // its validated level-aware deterministic fallback.
  if ((options.level ?? 1) > 3) filter.level = options.level;
  const docs = await db
    .collection("content")
    .find(filter)
    .sort({ createdAt: 1 })
    // Read a candidate window before selecting so stable creation order does
    // not pin every learner to the same first five records.
    .limit(Math.min(100, Math.max(safeLimit * 4, safeLimit)))
    .project({ _id: 0 })
    .toArray()
    .catch(() => []);
  return selectWithRecentExclusion(
    docs as ContentDoc[],
    safeLimit,
    options.seed ?? Date.now(),
    options.recentIds ?? [],
    (item) => `${item.gameId}:${JSON.stringify((item.payload as Record<string, unknown>).question ?? item.payload)}`
  );
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
