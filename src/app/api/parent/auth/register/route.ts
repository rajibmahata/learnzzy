import { NextResponse } from "next/server";
import { z } from "zod";
import { createParent } from "@/repositories/parents";
import { hashParentPassword, issueParentSession, setParentSessionCookie } from "@/server/parent-auth";
import { audit } from "@/server/audit";
import { clientIp, take } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(1).max(60).optional(),
});

export async function POST(req: Request) {
  const rate = take(`parent-register:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many registrations. Try again later." } }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email and a 12+ character password are required." } }, { status: 422 });
  }
  const parent = await createParent({ email: parsed.data.email, name: parsed.data.name, passwordHash: hashParentPassword(parsed.data.password) });
  if (!parent) {
    return NextResponse.json({ success: false, error: { code: "CONFLICT", message: "An account with this email already exists." } }, { status: 409 });
  }
  const res = NextResponse.json({ success: true, data: { parentId: parent.parentId, email: parent.email } }, { status: 201 });
  const cookie = setParentSessionCookie(issueParentSession({ id: parent.parentId, email: parent.email }));
  res.cookies.set(cookie.name, cookie.value, cookie.opts as Parameters<typeof res.cookies.set>[2]);
  await audit({ actorType: "parent", actorId: parent.parentId, action: "parent_registered" });
  return res;
}
