import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { evaluateSkill, skillLevelFor, skillSummaryLine, SKILL_GAMES } from "@/lib/skillLevels";
import { gameDisplayName } from "@/services/parentInsights";

// Per-skill adaptive profiles (read-only projection over the learner doc).
// Same visibility as the journey/plan endpoints: the device plays its own
// learner; protected operations stay server-side in the progress route.
export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  }
  const skills = SKILL_GAMES.map((gameId) => {
    const prog = learner.gameProgress?.[gameId];
    const history = {
      completions: prog?.completions ?? 0,
      recentAccuracy: prog?.recentAccuracy ?? [],
      hintsUsed: prog?.hintsUsed ?? 0,
    };
    const evaluation = evaluateSkill(history);
    const level = skillLevelFor(learner, gameId);
    return {
      gameId,
      name: gameDisplayName(gameId),
      level,
      masteryPct: evaluation.masteryPct,
      recentAccuracyPct: Math.round(evaluation.avgAccuracy * 100),
      trend: evaluation.trend,
      completions: prog?.completions ?? 0,
      hintsUsed: prog?.hintsUsed ?? 0,
      summary: skillSummaryLine(gameId, level, evaluation),
    };
  });
  return NextResponse.json({
    success: true,
    data: { learnerId: learner.learnerId, level: learner.level, skills, lastResult: learner.lastResult ?? null },
  });
}
