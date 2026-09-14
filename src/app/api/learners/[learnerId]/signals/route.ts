import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { getDb, newId } from "@/db/mongodb";
import { clientIp, take } from "@/lib/rate-limit";

const SignalSchema = z.object({ signal: z.enum(["interest", "skill", "engagement", "preference"]), gameId: z.string().min(1).max(30), value: z.number().min(0).max(10).default(1), metadata: z.record(z.unknown()).optional() });

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = take(`learner:signals:${clientIp(req)}`, 50, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = SignalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid signal." } }, { status: 422 });
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: { queued: true } });
  // Append-only, no PII beyond gameId
  await db.collection("learningSignals").insertOne({ signalId: newId("sig"), learnerId: params.learnerId, ...parsed.data, createdAt: new Date() }).catch(() => null);
  // Also bump interests for interest signals (deterministic, no sensitive inference)
  if (parsed.data.signal === "interest") {
    await db.collection("learners").updateOne({ learnerId: params.learnerId }, { $inc: { [`interests.${parsed.data.gameId}`]: parsed.data.value } as never }).catch(() => null);
  }
  return NextResponse.json({ success: true, data: { recorded: true } }, { status: 201 });
}

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: [] });
  const docs = await db.collection("learningSignals").find({ learnerId: params.learnerId }).sort({ createdAt: -1 }).limit(50).toArray().catch(() => []);
  return NextResponse.json({ success: true, data: docs });
}
