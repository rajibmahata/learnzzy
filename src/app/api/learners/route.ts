import { NextResponse } from "next/server";
import { z } from "zod";
import { createLearner, AGE_BANDS } from "@/repositories/learners";
import { clientIp, take } from "@/lib/rate-limit";

const CreateSchema = z.object({
  nickname: z.string().trim().min(1).max(20).optional().or(z.literal("")),
  ageBand: z.enum(["4-5", "6-7", "8-9"]),
  sessionId: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const rl = take(`learners:create:${clientIp(req)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "nickname optional, ageBand required (4-5,6-7,8-9)." } }, { status: 422 });
  const nickname = parsed.data.nickname && parsed.data.nickname.trim().length > 0 ? parsed.data.nickname.trim() : undefined;
  const learner = await createLearner({ nickname, ageBand: parsed.data.ageBand as typeof AGE_BANDS[number], sessionId: parsed.data.sessionId });
  if (!learner) return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Could not create learner." } }, { status: 500 });
  return NextResponse.json({ success: true, data: learner }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ success: false, error: { code: "NOT_IMPLEMENTED", message: "Use POST /api/learners to create, GET /api/learners/[learnerId] to fetch." } }, { status: 405 });
}
