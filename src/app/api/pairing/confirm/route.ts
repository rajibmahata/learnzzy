import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPairingCode } from "@/repositories/parents";
import { getLearner } from "@/repositories/learners";
import { audit } from "@/server/audit";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const ConfirmSchema = z.object({
  code: z.string().trim().min(5).max(12),
  learnerId: z.string().min(1).max(100),
});

// Child-side confirmation: binds an open code to this device's learner.
// Creates a PENDING link — the parent must still approve. Rate-limited hard
// against guessing (6-char space + 5 tries/hour/IP).
export async function POST(req: Request) {
  const rate = await takeAsync(`pairing-confirm:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Try again later." } }, { status: 429 });
  }
  const parsed = ConfirmSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "A pairing code and learner are required." } }, { status: 422 });
  }
  const learner = await getLearner(parsed.data.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found on this device." } }, { status: 404 });
  const result = await confirmPairingCode(parsed.data.code, parsed.data.learnerId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: { code: "INVALID_CODE", message: "That code didn't work. Check it and try again." } }, { status: 400 });
  }
  await audit({ actorType: "learner", actorId: parsed.data.learnerId, action: "pairing_confirmed", target: { parentId: result.parentId } });
  return NextResponse.json({ success: true, data: { pending: true, message: "Ask your parent to approve on their device." } });
}
