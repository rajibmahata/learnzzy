import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { getLearnerMissionProgress, saveMissionDefinition } from "@/repositories/missions";
import { buildTodaysAdventure } from "@/services/missionPlanner";
import { clientIp, takeAsync } from "@/lib/rate-limit";

export async function GET(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learners:adventure:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const url = new URL(req.url);
  const rawDate = url.searchParams.get("date");
  const parsed = rawDate ? new Date(rawDate) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const progress = await getLearnerMissionProgress(learner.learnerId, 20);
  const recommendations = buildTodaysAdventure({
    learnerId: learner.learnerId, ageBand: learner.ageBand, globalLevel: learner.level,
    gameProgress: learner.gameProgress, recentMissionIds: progress.map((item) => item.missionId), date,
  });
  await Promise.all(recommendations.map(({ mission }) => saveMissionDefinition(mission)));
  return NextResponse.json({ success: true, data: { learnerId: learner.learnerId, date: date.toISOString().slice(0, 10), missions: recommendations, progress } });
}
