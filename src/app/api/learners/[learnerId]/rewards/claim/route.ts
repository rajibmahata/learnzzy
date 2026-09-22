import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { claimReward } from "@/repositories/rewards";
import { clientIp, takeAsync } from "@/lib/rate-limit";

// POST /api/learners/[learnerId]/rewards/claim — server-authoritative sticker.
// The server chooses an unowned catalog sticker; the browser can neither pick
// a sticker nor force a duplicate. claimId makes retries idempotent: the same
// completion submitted twice yields ONE sticker and duplicate: true.
const ClaimSchema = z.object({
  gameId: z.string().min(1).max(30),
  accuracy: z.number().min(0).max(1).optional(),
  claimId: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:rewards-claim:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "gameId required." } }, { status: 422 });
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const outcome = await claimReward({ learnerId: params.learnerId, gameId: parsed.data.gameId, accuracy: parsed.data.accuracy, claimId: parsed.data.claimId });
  if (outcome.offline) return NextResponse.json({ success: false, error: { code: "OFFLINE", message: "Rewards unavailable offline; local progress is kept." } }, { status: 503 });
  if (outcome.notFound) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: outcome });
}
