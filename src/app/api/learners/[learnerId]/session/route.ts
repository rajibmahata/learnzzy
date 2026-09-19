import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { buildPersonalizedSessionPlan } from "@/services/personalizedSessionPlanner";
import { clientIp, takeAsync } from "@/lib/rate-limit";

async function limited(req: Request): Promise<NextResponse | null> {
  const rl = await takeAsync(`learner:session:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many session requests." } }, { status: 429 });
  }
  return null;
}

// GET /api/learners/[learnerId]/session
// Returns a deterministic personalized session plan for the learner's GLOBAL level.
// Two learners at same global level + ageBand can get different activities/complexity
// because the planner uses skill mastery + interests + history, not just level.
export async function GET(req: Request, { params }: { params: { learnerId: string } }) {
  const blocked = await limited(req);
  if (blocked) return blocked;
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const plan = await buildPersonalizedSessionPlan(params.learnerId);
  return NextResponse.json({ success: true, data: plan });
}
