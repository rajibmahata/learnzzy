import { NextResponse } from "next/server";
import { BatchEventsSchema } from "@/lib/validation";
import { ingestEvents } from "@/repositories/events";
import { clientIp, take } from "@/lib/rate-limit";

// POST /api/sync/events — offline sync alias for POST /api/game-events/batch.
// Client uses clientEventId for idempotency (BR-212).
export async function POST(req: Request) {
  const requestId = `req_${Date.now().toString(36)}`;
  const rl = take(`sync:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests.", requestId } }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON.", requestId } }, { status: 400 });
  }
  const parsed = BatchEventsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid events.", requestId } }, { status: 422 });
  const result = await ingestEvents(parsed.data.sessionId, parsed.data.events);
  return NextResponse.json({ success: true, data: result });
}
