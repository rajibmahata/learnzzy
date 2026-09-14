import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner, addLearnerStars } from "@/repositories/learners";
import { clientIp, take } from "@/lib/rate-limit";

const RewardSchema = z.object({ gameId: z.string().min(1).max(30), stars: z.number().int().min(1).max(10).default(3), stickerId: z.string().max(50).optional(), stickerEmoji: z.string().max(10).optional() });

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: { totalStars: learner.totalStars, stickerIds: learner.stickerIds, level: learner.level } });
}

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = take(`learner:rewards:${clientIp(req)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = RewardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid reward." } }, { status: 422 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const sid = parsed.data.stickerId || `st_${Date.now().toString(36)}`;
  await addLearnerStars(params.learnerId, parsed.data.stars, sid, parsed.data.gameId);
  const updated = await getLearner(params.learnerId);
  return NextResponse.json({ success: true, data: updated });
}
