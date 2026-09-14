import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/repositories/sessions";
import { clientIp, take } from "@/lib/rate-limit";

const CreateSessionSchema = z.object({
  deviceType: z.string().max(30).optional(),
  locale: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
});

// POST /api/sessions — anonymous, no PII (BR-001). Never 500s when DB is down:
// returns an ephemeral session so gameplay continues (BR-221).
export async function POST(req: Request) {
  const requestId = `req_${Date.now().toString(36)}`;
  const rl = take(`sessions:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests.", requestId } }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } });
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid session request.", requestId } },
      { status: 422 }
    );
  }
  const session = await createSession(parsed.data);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Could not create session.", requestId } },
      { status: 500 }
    );
  }
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // BR-003 configurable later
  return NextResponse.json(
    { success: true, data: { sessionId: session.sessionId, expiresAt } },
    { status: 201 }
  );
}
