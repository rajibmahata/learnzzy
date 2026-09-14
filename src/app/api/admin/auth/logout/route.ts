import { NextResponse } from "next/server";
import { clearSessionCookie, currentAdmin } from "@/server/admin-auth";
import { audit } from "@/server/audit";

export async function POST() {
  const admin = currentAdmin();
  const res = NextResponse.json({ success: true });
  const cookie = clearSessionCookie();
  res.cookies.set(cookie.name, cookie.value, cookie.opts as Parameters<typeof res.cookies.set>[2]);
  if (admin) await audit({ actorType: "admin", actorId: admin.id, action: "admin_logout" });
  return res;
}
