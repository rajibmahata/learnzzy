import { NextResponse } from "next/server";
import { currentParent } from "@/server/parent-auth";
import { getParent } from "@/repositories/parents";

export async function GET() {
  const parent = currentParent();
  if (!parent) return NextResponse.json({ success: true, data: { authenticated: false, parent: null } });
  const doc = await getParent(parent.id).catch(() => null);
  if (!doc || doc.status !== "active") return NextResponse.json({ success: true, data: { authenticated: false, parent: null } });
  return NextResponse.json({ success: true, data: { authenticated: true, parent: { parentId: doc.parentId, email: doc.email, name: doc.name } } });
}
