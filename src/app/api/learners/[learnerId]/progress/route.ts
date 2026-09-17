import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner, recordGameResult } from "@/repositories/learners";
import { maybePromote, maybeAdjustSkill } from "@/services/levelService";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const ProgressSchema = z.object({
  gameId: z.string().min(1).max(30),
  accuracy: z.number().min(0).max(1),
  stars: z.number().int().min(0).max(10).optional(),
  stickerId: z.string().max(50).optional(),
  hintsUsed: z.number().int().min(0).max(100).optional(),
  durationMs: z.number().int().min(0).max(3600000).optional(),
});

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:progress:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = ProgressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "gameId, accuracy required." } }, { status: 422 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  // Server is authoritative: accuracy/stars/hints are validated here and the
  // structured result is recorded once (history stays append-only in events).
  const { gameId, accuracy, stars = 0, stickerId, hintsUsed = 0 } = parsed.data;
  await recordGameResult(params.learnerId, { gameId, accuracy, stars, stickerId, hintsUsed });
  const promo = await maybePromote(params.learnerId, gameId, accuracy);
  const skill = await maybeAdjustSkill(params.learnerId, gameId);
  const updated = await getLearner(params.learnerId);
  return NextResponse.json({ success: true, data: { learner: updated, promotion: promo, skill: { gameId, ...skill } } });
}
