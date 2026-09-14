import { NextResponse } from "next/server";
import { z } from "zod";
import { approvePairing, createPairingCode, listLinksForParent, pendingPairings, revokeLink } from "@/repositories/parents";
import { requireParent } from "@/server/parent-auth";
import { audit } from "@/server/audit";
import { clientIp, take } from "@/lib/rate-limit";

// GET: pending pairings + link overview. POST: create code / approve / revoke.
const ApproveSchema = z.object({ action: z.literal("approve"), learnerId: z.string().min(1).max(100) });
const RevokeSchema = z.object({ action: z.literal("revoke"), learnerId: z.string().min(1).max(100) });

export async function GET() {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const [links, pending] = await Promise.all([listLinksForParent(auth.parent.id), pendingPairings(auth.parent.id)]);
  return NextResponse.json({ success: true, data: { links, pending } });
}

export async function POST(req: Request) {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const rate = take(`parent-pairing:${clientIp(req)}:${auth.parent.id}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many pairing attempts." } }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as unknown;
  const approve = ApproveSchema.safeParse(body);
  if (approve.success) {
    const ok = await approvePairing(auth.parent.id, approve.data.learnerId);
    if (!ok) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "No pending pairing for this learner." } }, { status: 404 });
    await audit({ actorType: "parent", actorId: auth.parent.id, action: "pairing_approved", target: { learnerId: approve.data.learnerId } });
    return NextResponse.json({ success: true, data: { approved: true } });
  }
  const revoke = RevokeSchema.safeParse(body);
  if (revoke.success) {
    const ok = await revokeLink(auth.parent.id, revoke.data.learnerId);
    if (!ok) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "No active link for this learner." } }, { status: 404 });
    await audit({ actorType: "parent", actorId: auth.parent.id, action: "pairing_revoked", target: { learnerId: revoke.data.learnerId } });
    return NextResponse.json({ success: true, data: { revoked: true } });
  }
  // Default: create a fresh short-lived single-use code.
  const created = await createPairingCode(auth.parent.id);
  if (!created) return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Could not create pairing code." } }, { status: 500 });
  await audit({ actorType: "parent", actorId: auth.parent.id, action: "pairing_code_created" });
  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
