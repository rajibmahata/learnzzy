import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { audit } from "@/server/audit";

export async function POST(_req: Request, { params }: { params: { contentId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  const doc = await db.collection("content").findOne({ contentId: params.contentId });
  if (!doc) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Content not found." } }, { status: 404 });
  if (!["draft", "validating", "approved"].includes(String(doc.status))) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Content is missing or not approvable." } }, { status: 404 });
  await db.collection("content").updateOne({ contentId: params.contentId }, { $set: { status: "active", approvedAt: new Date(), approvedBy: auth.admin.id, updatedAt: new Date() } });
  await db.collection("contentVersions").insertOne({ contentId: params.contentId, version: ((doc.version as number) ?? 1) + 1, payload: doc.payload, changeReason: "approved", createdBy: { type: "admin", id: auth.admin.id }, createdAt: new Date() }).catch(() => null);
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "content_approved", target: { contentId: params.contentId } });
  return NextResponse.json({ success: true });
}
