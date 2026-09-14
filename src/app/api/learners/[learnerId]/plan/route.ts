import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";
import { buildPlan, savePlan } from "@/services/personalizationService";
import { getDb } from "@/db/mongodb";
import { clientIp, take } from "@/lib/rate-limit";

function limited(req: Request): NextResponse | null {
  const rl = take(`learner:plan:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many plan requests." } }, { status: 429 });
  }
  return null;
}

export async function GET(req: Request, { params }: { params: { learnerId: string } }) {
  const blocked = limited(req);
  if (blocked) return blocked;
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const db = await getDb().catch(() => null);
  if (db) {
    const existing = await db.collection("learningPlans").findOne({ learnerId: params.learnerId }, { sort: { createdAt: -1 } }).catch(() => null);
    if (existing) return NextResponse.json({ success: true, data: existing });
  }
  const plan = await buildPlan(params.learnerId);
  await savePlan(plan);
  return NextResponse.json({ success: true, data: plan });
}

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const blocked = limited(req);
  if (blocked) return blocked;
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const plan = await buildPlan(params.learnerId);
  await savePlan(plan);
  return NextResponse.json({ success: true, data: plan }, { status: 201 });
}
