import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { claimReward } from "@/repositories/rewards";
import { ACTIVE_STICKERS, milestoneFor, resolveStickerIds } from "@/lib/stickers";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const RewardSchema = z.object({ gameId: z.string().min(1).max(30), stars: z.number().int().min(1).max(10).default(3), stickerId: z.string().max(50).optional(), stickerEmoji: z.string().max(10).optional(), claimId: z.string().min(1).max(120).optional() });

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const stickers = resolveStickerIds(learner.stickerIds ?? []);
  const recent = stickers.length ? stickers[stickers.length - 1]! : null;
  return NextResponse.json({
    success: true,
    data: {
      totalStars: learner.totalStars,
      stickerIds: learner.stickerIds,
      level: learner.level,
      stickers,
      stickerCount: stickers.length,
      catalogSize: ACTIVE_STICKERS.length,
      recentSticker: recent,
      milestone: milestoneFor(stickers.length),
    },
  });
}

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:rewards:${clientIp(req)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = RewardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid reward." } }, { status: 422 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  // Single authoritative path: client-supplied stickerId/emoji are accepted for
  // backward compatibility but NEVER honored — the server always selects an
  // unowned catalog sticker. Stars are owned by the progress path, not here.
  const outcome = await claimReward({ learnerId: params.learnerId, gameId: parsed.data.gameId, claimId: parsed.data.claimId });
  if (outcome.offline) return NextResponse.json({ success: false, error: { code: "OFFLINE", message: "Rewards unavailable offline; local progress is kept." } }, { status: 503 });
  if (outcome.notFound) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const updated = await getLearner(params.learnerId);
  return NextResponse.json({ success: true, data: { ...outcome, learner: updated } });
}
