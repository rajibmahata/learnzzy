import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { buildAcademicPlan } from "@/services/academicEngine";
import { getLatestAcademicPlan } from "@/repositories/academicPlans";
import { clientIp, takeAsync } from "@/lib/rate-limit";

// Validated Learning Plan endpoint (child-safe: validated plan only, no
// chain-of-thought, no provider internals). MCP failures never surface here:
// the orchestrator always returns a deterministic fallback plan.
export async function GET(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:academic:plan:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many plan requests." } }, { status: 429 });
  }
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") ?? "en").slice(0, 10);
  try {
    const plan = await buildAcademicPlan({ learnerId: params.learnerId, locale });
    return NextResponse.json({ success: true, data: plan });
  } catch {
    const latest = await getLatestAcademicPlan(params.learnerId).catch(() => null);
    if (latest) return NextResponse.json({ success: true, data: latest });
    return NextResponse.json({ success: false, error: { code: "UNAVAILABLE", message: "Academic plan unavailable." } }, { status: 503 });
  }
}
