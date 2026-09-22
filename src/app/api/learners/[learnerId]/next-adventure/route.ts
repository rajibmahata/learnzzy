import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { z } from "zod";
import { selectNextAdventureActivity, selectHomeAdventures } from "@/lib/activitySelector";
import type { ActivityFingerprint } from "@/lib/activityVarietyEngine";

const paramsSchema = z.object({ learnerId: z.string().min(3).max(64) });

export async function GET(req: Request, ctx: { params: { learnerId: string } }) {
  const parsed = paramsSchema.safeParse(ctx.params);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid learnerId" }, { status: 400 });
  const learnerId = parsed.data.learnerId;

  // Load learner for ageBand/level/interests/progress
  const learner = await getLearner(learnerId).catch(() => null);
  if (!learner) return NextResponse.json({ success: false, error: "Learner not found" }, { status: 404 });

  // Recent fingerprints from lastResult + gameProgress (lightweight)
  const recentFingerprints: ActivityFingerprint[] = [];
  if (learner.lastResult?.gameId) {
    recentFingerprints.push({
      activityId: learner.lastResult.gameId,
      type: "GAME",
      gameId: learner.lastResult.gameId,
      mechanic: learner.lastResult.gameId,
      theme: learner.lastResult.gameId,
      world: "numbers",
      difficulty: learner.level ?? 1,
    });
  }

  const input = {
    learnerId,
    ageBand: (learner.ageBand ?? "6-7") as "4-5" | "6-7" | "8-9",
    globalLevel: learner.level ?? 1,
    skill: "counting",
    recentPerformance: null,
    recentMistakes: [] as string[],
    completedActivityIds: Object.keys(learner.gameProgress ?? {}),
    abandonedActivityIds: [] as string[],
    recentFingerprints,
    recentGameTypes: recentFingerprints.map((f) => f.gameId ?? ""),
    recentMechanics: recentFingerprints.map((f) => f.mechanic),
    recentThemes: recentFingerprints.map((f) => f.theme),
    interests: (learner.interests as Record<string, number>) ?? {},
    unlockedRewardIds: (learner.stickerIds as string[]) ?? [],
    contentAvailability: {} as Record<string, boolean>,
    recentCognitiveLoad: 0.3,
  };

  const today = await selectNextAdventureActivity(input).catch(() => null);
  const recommended = await selectHomeAdventures(input, 3).catch(() => []);

  // Fallback to deterministic if engine unavailable
  if (!today && recommended.length === 0) {
    return NextResponse.json({ success: true, data: { today: null, recommended: [] } });
  }

  return NextResponse.json({
    success: true,
    data: {
      today: today ? { activity: { id: today.activity.id, title: today.activity.title, icon: today.activity.icon, world: today.activity.world }, reason: today.reason, href: today.href } : null,
      recommended: recommended.map((r) => ({ activity: { id: r.activity.id, title: r.activity.title, icon: r.activity.icon, world: r.activity.world }, reason: r.reason, href: r.href })),
    },
  });
}
