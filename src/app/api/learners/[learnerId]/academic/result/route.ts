import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { getDb, newId } from "@/db/mongodb";
import { decideNextStep } from "@/lib/academic";
import { recordAcademicEvent } from "@/repositories/academicPlans";
import { clientIp, takeAsync } from "@/lib/rate-limit";

// Performance feedback endpoint: Result → Analytics → Learning Signals →
// Academic Engine. Server re-derives the decision from validated signals;
// client scores are never trusted for progression.
const ResultSchema = z.object({
  gameId: z.string().min(1).max(50),
  conceptId: z.string().min(1).max(80).optional(),
  accuracy: z.number().min(0).max(1),
  attempts: z.number().int().min(0).max(1000).default(1),
  hintsUsed: z.number().int().min(0).max(100).default(0),
  responseTimeMs: z.number().int().min(0).max(600000).optional(),
  complexity: z.number().int().min(1).max(5).default(1),
});

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:academic:result:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  }
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const parsed = ResultSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid activity result." } }, { status: 422 });
  }
  const r = parsed.data;
  const decision = decideNextStep({
    accuracy: r.accuracy,
    hintsUsed: r.hintsUsed,
    attempts: r.attempts,
    avgResponseMs: r.responseTimeMs,
    currentComplexity: r.complexity,
  });
  const db = await getDb().catch(() => null);
  if (db) {
    await db
      .collection("learningSignals")
      .insertOne({
        signalId: newId("sig"),
        learnerId: params.learnerId,
        signal: "skill",
        gameId: r.gameId,
        value: Math.round(r.accuracy * 10) / 10,
        metadata: { conceptId: r.conceptId ?? null, attempts: r.attempts, hintsUsed: r.hintsUsed, decision: decision.action },
        createdAt: new Date(),
      })
      .catch(() => null);
  }
  await recordAcademicEvent({
    learnerId: params.learnerId,
    event: "result",
    message: `${r.gameId} accuracy ${Math.round(r.accuracy * 100)}% → ${decision.action}`,
    metadata: { gameId: r.gameId, accuracy: r.accuracy, decision: decision.action },
  }).catch(() => null);
  return NextResponse.json({ success: true, data: decision }, { status: 201 });
}
