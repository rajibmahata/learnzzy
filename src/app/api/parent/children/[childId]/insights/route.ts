import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { requireParent, requireParentChild } from "@/server/parent-auth";
import { buildChildSummary } from "@/services/parentInsights";

export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const access = await requireParentChild(auth.parent.id, params.childId);
  if (!access.ok) return access.response;
  const learner = await getLearner(params.childId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const summary = await buildChildSummary(learner);
  // Insights view: strengths, practice opportunities, recommendation.
  return NextResponse.json({
    success: true,
    data: {
      strengths: summary.strengths,
      practiceOpportunities: summary.practiceOpportunities,
      recommendedNext: summary.recommendedNext,
      advisoryFocus: summary.advisoryFocus,
      concepts: summary.concepts,
      discovery: summary.discovery,
      academic: summary.academic,
    },
  });
}
