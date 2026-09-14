import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { getLearner } from "@/repositories/learners";
import { requireParent, requireParentChild } from "@/server/parent-auth";

export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const access = await requireParentChild(auth.parent.id, params.childId);
  if (!access.ok) return access.response;
  const learner = await getLearner(params.childId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: null });
  const plan = await db.collection("learningPlans").findOne({ learnerId: params.childId }, { sort: { createdAt: -1 }, projection: { _id: 0 } }).catch(() => null);
  return NextResponse.json({ success: true, data: plan });
}
