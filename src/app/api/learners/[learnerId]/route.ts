import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner, updateLearnerProfile } from "@/repositories/learners";
import { sanitizeCompanion } from "@/lib/identity";
import { clientIp, takeAsync } from "@/lib/rate-limit";

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: learner });
}

const CompanionSchema = z.object({
  characterId: z.string().min(1).max(30),
  displayName: z.string().trim().min(1).max(20).optional().or(z.literal("")).nullable().optional(),
});

// PATCH — child-safe profile fields ONLY (displayName, nickname, avatar,
// companion, onboarding flag). ageBand, level, progress, rewards, and history
// are never writable here, so learnerId stays stable across profile edits.
const PatchSchema = z.object({
  displayName: z.string().trim().min(1).max(20).optional().or(z.literal("")).nullable().optional(),
  nickname: z.string().trim().min(1).max(20).optional().or(z.literal("")).nullable().optional(),
  avatar: z.string().trim().min(1).max(12).optional().or(z.literal("")).nullable().optional(),
  companion: CompanionSchema.nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:profile:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Only displayName, nickname, avatar, companion, onboardingCompleted can be updated." } }, { status: 422 });
  const existing = await getLearner(params.learnerId);
  if (!existing) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const clean = (v: string | null | undefined) => (v === null ? null : v && v.trim().length > 0 ? v.trim() : undefined);
  if (parsed.data.companion !== undefined && parsed.data.companion !== null) {
    if (!sanitizeCompanion({ characterId: parsed.data.companion.characterId, displayName: parsed.data.companion.displayName ?? undefined })) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Unknown companion character." } }, { status: 422 });
    }
  }
  const updated = await updateLearnerProfile(params.learnerId, {
    ...(parsed.data.displayName !== undefined ? { displayName: clean(parsed.data.displayName) } : {}),
    ...(parsed.data.nickname !== undefined ? { nickname: clean(parsed.data.nickname) } : {}),
    ...(parsed.data.avatar !== undefined ? { avatar: clean(parsed.data.avatar) } : {}),
    ...(parsed.data.companion !== undefined
      ? parsed.data.companion === null
        ? { companion: null }
        : { companion: { characterId: parsed.data.companion.characterId, displayName: clean(parsed.data.companion.displayName) ?? undefined } }
      : {}),
    ...(parsed.data.onboardingCompleted !== undefined ? { onboardingCompleted: parsed.data.onboardingCompleted } : {}),
  });
  if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: updated });
}
