import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { buildAcademicPlan } from "@/services/academicEngine";
import { parentReasonText } from "@/lib/academic";
import { getConceptDef } from "@/lib/concepts";
import { getConcept as getKnowledgeConcept } from "@/lib/knowledge";
import { clientIp, takeAsync } from "@/lib/rate-limit";

// Game recommendation endpoint (spec §16 shape). Parent-safe reason only.
export async function GET(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:academic:rec:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  }
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") ?? "en").slice(0, 10);
  void locale;
  const plan = await buildAcademicPlan({ learnerId: params.learnerId }).catch(() => null);
  if (!plan) return NextResponse.json({ success: false, error: { code: "UNAVAILABLE", message: "Recommendation unavailable." } }, { status: 503 });
  const name = getConceptDef(plan.concept)?.name ?? getKnowledgeConcept(plan.concept)?.names.en ?? plan.concept;
  return NextResponse.json({
    success: true,
    data: {
      game: plan.game,
      concept: plan.concept,
      complexity: plan.complexity,
      objective: plan.objective,
      reasonCode: plan.reasonCode,
      priority: plan.priority,
      reason: parentReasonText(plan.reasonCode, name),
      stage: plan.stage,
      characterId: plan.characterId,
    },
  });
}
