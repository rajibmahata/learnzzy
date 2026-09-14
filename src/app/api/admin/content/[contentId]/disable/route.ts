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
  // Soft disable never hard deletes (BR-174, BR-234)
  await db.collection("content").updateOne({ contentId: params.contentId }, { $set: { status: "disabled", disabledAt: new Date(), disabledBy: auth.admin.id, updatedAt: new Date() } });
  await db.collection("contentVersions").insertOne({ contentId: params.contentId, version: (doc.version ?? 1) + 1, payload: doc.payload, changeReason: "disabled", createdBy: { type: "admin", id: auth.admin.id }, createdAt: new Date() }).catch(() => null);
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "content_disabled", target: { contentId: params.contentId } });
  return NextResponse.json({ success: true });
}
