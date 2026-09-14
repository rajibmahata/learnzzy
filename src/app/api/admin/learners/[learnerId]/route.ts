import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { getLearner } from "@/repositories/learners";

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const db = await getDb().catch(() => null);
  const [signals, plans] = db
    ? await Promise.all([
        db.collection("learningSignals").find({ learnerId: params.learnerId }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray().catch(() => []),
        db.collection("learningPlans").find({ learnerId: params.learnerId }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(5).toArray().catch(() => []),
      ])
    : [[], []];
  return NextResponse.json({ success: true, data: { learner, signals, plans } });
}
