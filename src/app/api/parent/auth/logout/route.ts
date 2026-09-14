import { NextResponse } from "next/server";
import { clearParentSessionCookie, currentParent } from "@/server/parent-auth";
import { audit } from "@/server/audit";

export async function POST() {
  const parent = currentParent();
  const res = NextResponse.json({ success: true });
  const cookie = clearParentSessionCookie();
  res.cookies.set(cookie.name, cookie.value, cookie.opts as Parameters<typeof res.cookies.set>[2]);
  if (parent) await audit({ actorType: "parent", actorId: parent.id, action: "parent_logout" });
  return res;
}
