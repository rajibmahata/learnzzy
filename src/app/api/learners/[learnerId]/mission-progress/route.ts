import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { getLearnerMissionProgress, getMissionSkillProgress } from "@/repositories/missions";
import { clientIp, takeAsync } from "@/lib/rate-limit";

export async function GET(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learners:mission-progress:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: { learnerId: learner.learnerId, missions: await getLearnerMissionProgress(learner.learnerId), skills: await getMissionSkillProgress(learner.learnerId) } });
}
