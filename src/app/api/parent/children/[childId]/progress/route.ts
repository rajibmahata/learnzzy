import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { requireParent, requireParentChild } from "@/server/parent-auth";
import { buildChildSummary, gameDisplayName } from "@/services/parentInsights";
import { buildLearningJourney } from "@/lib/learningJourney";
import { stickerById } from "@/lib/stickers";
import { getLearnerMissionProgress, getMissionSkillProgress } from "@/repositories/missions";

export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const access = await requireParentChild(auth.parent.id, params.childId);
  if (!access.ok) return access.response;
  const learner = await getLearner(params.childId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const summary = await buildChildSummary(learner);
  const missionProgress = await getLearnerMissionProgress(learner.learnerId, 20);
  const missionSkills = await getMissionSkillProgress(learner.learnerId);
  const recentStickerId = (learner.stickerIds ?? []).length ? learner.stickerIds[learner.stickerIds.length - 1]! : null;
  const recentSticker = recentStickerId ? stickerById(recentStickerId) : null;
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
      skills: summary.skills,
      lastResult: summary.lastResult,
      strengths: summary.strengths,
      practiceOpportunities: summary.practiceOpportunities,
      journey: buildLearningJourney(learner),
      academic: summary.academic,
      recentSticker: recentSticker ? { id: recentSticker.id, name: recentSticker.name, emoji: recentSticker.emoji, category: recentSticker.category } : null,
      missions: missionProgress.map((mission) => ({ missionId: mission.missionId, completedSteps: mission.completedSteps, totalSteps: mission.totalSteps, attempts: mission.attempts, correctSteps: mission.correctSteps, completedAt: mission.completedAt ?? null, updatedAt: mission.updatedAt })),
      missionSkills,
    },
  });
}
