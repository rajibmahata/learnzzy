import { NextResponse } from "next/server";
import { z } from "zod";
import { createLearner, AGE_BANDS } from "@/repositories/learners";
import { sanitizeCompanion } from "@/lib/identity";

function isKnownCompanion(characterId: string): boolean {
  return sanitizeCompanion({ characterId }) !== null;
}
import { clientIp, takeAsync } from "@/lib/rate-limit";

const CompanionSchema = z.object({
  characterId: z.string().min(1).max(30),
  displayName: z.string().trim().min(1).max(20).optional().or(z.literal("")),
});

const CreateSchema = z.object({
  displayName: z.string().trim().min(1).max(20).optional().or(z.literal("")),
  nickname: z.string().trim().min(1).max(20).optional().or(z.literal("")),
  avatar: z.string().trim().min(1).max(12).optional().or(z.literal("")),
  companion: CompanionSchema.optional(),
  ageBand: z.enum(["4-5", "6-7", "8-9"]),
  sessionId: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const rl = await takeAsync(`learners:create:${clientIp(req)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "nickname optional, ageBand required (4-5,6-7,8-9)." } }, { status: 422 });
  const nonEmpty = (v?: string) => (v && v.trim().length > 0 ? v.trim() : undefined);
  const displayName = nonEmpty(parsed.data.displayName);
  const nickname = nonEmpty(parsed.data.nickname);
  const avatar = nonEmpty(parsed.data.avatar);
  const companionRaw = parsed.data.companion;
  const companion = companionRaw ? { characterId: companionRaw.characterId, displayName: nonEmpty(companionRaw.displayName) } : undefined;
  if (companion && !isKnownCompanion(companion.characterId)) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Unknown companion character." } }, { status: 422 });
  }
  const learner = await createLearner({ displayName, nickname, avatar, companion, ageBand: parsed.data.ageBand as typeof AGE_BANDS[number], sessionId: parsed.data.sessionId });
  if (!learner) return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Could not create learner." } }, { status: 500 });
  return NextResponse.json({ success: true, data: learner }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ success: false, error: { code: "NOT_IMPLEMENTED", message: "Use POST /api/learners to create, GET /api/learners/[learnerId] to fetch." } }, { status: 405 });
}
