import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { requireParent, requireParentChild } from "@/server/parent-auth";
import { buildChildSummary, gameDisplayName } from "@/services/parentInsights";

export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const access = await requireParentChild(auth.parent.id, params.childId);
  if (!access.ok) return access.response;
  const learner = await getLearner(params.childId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const summary = await buildChildSummary(learner);
  const perGame = Object.entries(learner.gameProgress ?? {}).map(([gameId, p]) => ({
    gameId,
    name: gameDisplayName(gameId),
    completions: p.completions,
    bestAccuracyPct: Math.round((p.bestAccuracy ?? 0) * 100),
  }));
  return NextResponse.json({
    success: true,
    data: {
      level: summary.level,
      totalStars: summary.totalStars,
      stickerCount: summary.stickerCount,
      perGame,
      concepts: summary.concepts,
    },
  });
}
