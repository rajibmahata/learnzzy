import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { completeMissionAttempt, startMissionAttempt } from "@/repositories/missions";
import { maybeAdjustSkill, maybePromote } from "@/services/levelService";
import { missionFromId } from "@/lib/missionEngine";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const AttemptSchema = z.object({
  learnerId: z.string().min(1).max(120),
  action: z.enum(["start", "complete"]),
  attemptId: z.string().min(1).max(160).optional(),
});

export async function POST(req: Request, { params }: { params: { missionId: string } }) {
  const rl = await takeAsync(`missions:attempt:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const mission = missionFromId(params.missionId, 1);
  if (!mission) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Mission not found." } }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = AttemptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "learnerId and action are required." } }, { status: 422 });
  const learner = parsed.data.learnerId === "guest" ? null : await getLearner(parsed.data.learnerId);
  if (!learner && parsed.data.learnerId !== "guest") return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const resolvedLearnerId = learner?.learnerId ?? "guest";
  if (parsed.data.action === "start") {
    const attempt = await startMissionAttempt(resolvedLearnerId, mission.missionId, parsed.data.attemptId);
    return NextResponse.json({ success: true, data: { attemptId: attempt.attemptId, missionId: mission.missionId, status: attempt.status } });
  }
  if (!parsed.data.attemptId) return NextResponse.json({ success: false, error: { code: "ATTEMPT_REQUIRED", message: "attemptId is required to complete a mission." } }, { status: 422 });
  const result = await completeMissionAttempt(parsed.data.attemptId, resolvedLearnerId, mission.missionId, mission.steps.length, { gameType: mission.gameType });
  // Missions share progression authority with games: the structured result is
  // already recorded, so run the same promotion/skill step once per reward.
  if (result.completed && result.rewardGranted && resolvedLearnerId !== "guest") {
    const [promotion, skill] = await Promise.all([
      maybePromote(resolvedLearnerId, mission.gameType, result.accuracy),
      maybeAdjustSkill(resolvedLearnerId, mission.gameType),
    ]);
    return NextResponse.json({ success: true, data: { ...result, missionId: mission.missionId, promotion, skill: { gameId: mission.gameType, ...skill } } });
  }
  return NextResponse.json({ success: result.completed, data: { ...result, missionId: mission.missionId } }, { status: result.completed ? 200 : 409 });
}
