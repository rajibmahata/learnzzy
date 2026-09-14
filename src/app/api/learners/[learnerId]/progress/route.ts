import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner, addLearnerStars } from "@/repositories/learners";
import { maybePromote } from "@/services/levelService";
import { clientIp, take } from "@/lib/rate-limit";

const ProgressSchema = z.object({
  gameId: z.string().min(1).max(30),
  accuracy: z.number().min(0).max(1),
  stars: z.number().int().min(0).max(10).optional(),
  stickerId: z.string().max(50).optional(),
});

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = take(`learner:progress:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = ProgressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "gameId, accuracy required." } }, { status: 422 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const { gameId, accuracy, stars = 0, stickerId } = parsed.data;
  await addLearnerStars(params.learnerId, stars, stickerId, gameId, accuracy);
  const promo = await maybePromote(params.learnerId, gameId, accuracy);
  const updated = await getLearner(params.learnerId);
  return NextResponse.json({ success: true, data: { learner: updated, promotion: promo } });
}
