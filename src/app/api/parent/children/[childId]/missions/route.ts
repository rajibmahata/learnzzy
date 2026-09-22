import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { getLearnerMissionProgress, getMissionSkillProgress } from "@/repositories/missions";
import { requireParent, requireParentChild } from "@/server/parent-auth";

export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const access = await requireParentChild(auth.parent.id, params.childId);
  if (!access.ok) return access.response;
  const learner = await getLearner(params.childId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const missions = await getLearnerMissionProgress(learner.learnerId, 30);
  return NextResponse.json({ success: true, data: { learnerId: learner.learnerId, missions: missions.map((mission) => ({ missionId: mission.missionId, completedSteps: mission.completedSteps, totalSteps: mission.totalSteps, attempts: mission.attempts, correctSteps: mission.correctSteps, hintsUsed: mission.hintsUsed, completedAt: mission.completedAt ?? null, updatedAt: mission.updatedAt })), skills: await getMissionSkillProgress(learner.learnerId) } });
}
