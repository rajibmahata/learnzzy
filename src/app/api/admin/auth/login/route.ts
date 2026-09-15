import { NextResponse } from "next/server";
import { adminConfigured, issueSession, setSessionCookie, verifyPassword } from "@/server/admin-auth";
import { audit } from "@/server/audit";
import { clientIp, takeAsync } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rate = await takeAsync(`admin-login:${clientIp(req)}`, 8, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Try again later." } },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) } }
    );
  }
  if (!adminConfigured()) {
    return NextResponse.json(
      { success: false, error: { code: "ADMIN_NOT_CONFIGURED", message: "Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_AUTH_SECRET." } },
      { status: 503 }
    );
  }
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email !== process.env.ADMIN_EMAIL?.trim().toLowerCase() || !verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "")) {
    await audit({ actorType: "unknown", actorId: clientIp(req), action: "admin_login_failed", result: "rejected" });
    return NextResponse.json(
      { success: false, error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } },
      { status: 401 }
    );
  }
  const admin = { id: "admin:primary", email };
  const res = NextResponse.json({ success: true, data: admin });
  const cookie = setSessionCookie(issueSession(admin));
  res.cookies.set(cookie.name, cookie.value, cookie.opts as Parameters<typeof res.cookies.set>[2]);
  await audit({ actorType: "admin", actorId: admin.id, action: "admin_login" });
  return res;
}
