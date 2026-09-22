import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { getLearnerMissionProgress, saveMissionDefinition } from "@/repositories/missions";
import { normalizeAgeBand } from "@/lib/complexity";
import { buildTodaysAdventure } from "@/services/missionPlanner";
import { clientIp, takeAsync } from "@/lib/rate-limit";

// GET /api/missions?learnerId=&ageBand=&limit=&date=
// Mission selection is deterministic and local. Mongo persistence is best effort.
export async function GET(req: Request) {
  const rl = await takeAsync(`missions:list:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const url = new URL(req.url);
  const learnerId = (url.searchParams.get("learnerId") || "guest").slice(0, 120);
  const learner = learnerId === "guest" ? null : await getLearner(learnerId);
  const ageBand = normalizeAgeBand(url.searchParams.get("ageBand") ?? learner?.ageBand ?? "6-7");
  const limit = Math.max(1, Math.min(5, Number(url.searchParams.get("limit") ?? "4") || 4));
  const rawDate = url.searchParams.get("date");
  const parsedDate = rawDate ? new Date(rawDate) : undefined;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined;
  const previous = learner ? await getLearnerMissionProgress(learner.learnerId, 20) : [];
  const recommendations = buildTodaysAdventure({
    learnerId,
    ageBand,
    globalLevel: learner?.level ?? 1,
    gameProgress: learner?.gameProgress,
    recentMissionIds: previous.map((item) => item.missionId),
    date,
    limit,
  });
  await Promise.all(recommendations.map(({ mission }) => saveMissionDefinition(mission)));
  return NextResponse.json({
    success: true,
    data: {
      learnerId: learner?.learnerId ?? null,
      ageBand,
      date: url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
      missions: recommendations.map(({ mission, reason, priority }) => ({ mission, reason, priority })),
    },
  });
}
