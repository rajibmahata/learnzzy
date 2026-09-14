import { NextResponse } from "next/server";
import { z } from "zod";
import { getParentByEmail, touchParentLogin } from "@/repositories/parents";
import { verifyParentPassword, issueParentSession, setParentSessionCookie } from "@/server/parent-auth";
import { audit } from "@/server/audit";
import { clientIp, take } from "@/lib/rate-limit";

const LoginSchema = z.object({ email: z.string().email().max(120), password: z.string().min(1).max(128) });

export async function POST(req: Request) {
  const rate = take(`parent-login:${clientIp(req)}`, 8, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Try again later." } }, { status: 429, headers: { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) } });
  }
  const parsed = LoginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required." } }, { status: 422 });
  }
  const parent = await getParentByEmail(parsed.data.email);
  if (!parent || parent.status !== "active" || !verifyParentPassword(parsed.data.password, parent.passwordHash)) {
    await audit({ actorType: "unknown", actorId: clientIp(req), action: "parent_login_failed", result: "rejected" });
    return NextResponse.json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } }, { status: 401 });
  }
  await touchParentLogin(parent.parentId);
  const res = NextResponse.json({ success: true, data: { parentId: parent.parentId, email: parent.email, name: parent.name } });
  const cookie = setParentSessionCookie(issueParentSession({ id: parent.parentId, email: parent.email }));
  res.cookies.set(cookie.name, cookie.value, cookie.opts as Parameters<typeof res.cookies.set>[2]);
  await audit({ actorType: "parent", actorId: parent.parentId, action: "parent_login" });
  return res;
}
