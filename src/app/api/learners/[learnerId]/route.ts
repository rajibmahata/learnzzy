import { NextResponse } from "next/server";
import { getLearner } from "@/repositories/learners";

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: learner });
}
