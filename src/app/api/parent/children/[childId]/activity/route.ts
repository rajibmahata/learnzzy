import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { requireParent, requireParentChild } from "@/server/parent-auth";
import { recentActivity } from "@/services/parentInsights";

export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const access = await requireParentChild(auth.parent.id, params.childId);
  if (!access.ok) return access.response;
  const learner = await getLearner(params.childId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: await recentActivity(learner.learnerId, learner.sessionId, 30) });
}
