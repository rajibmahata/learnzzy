import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { audit } from "@/server/audit";

export async function POST(req: Request, { params }: { params: { contentId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : "Rejected by administrator";
  const db = await getDb();
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  const doc = await db.collection("content").findOne({ contentId: params.contentId });
  if (!doc) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Content not found." } }, { status: 404 });
  if (String(doc.status) === "active") return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Content is missing or already active." } }, { status: 404 });
  await db.collection("content").updateOne({ contentId: params.contentId }, { $set: { status: "rejected", rejectionReason: reason, rejectedAt: new Date(), rejectedBy: auth.admin.id, updatedAt: new Date() } });
  await db.collection("contentVersions").insertOne({ contentId: params.contentId, version: ((doc.version as number) ?? 1) + 1, payload: doc.payload, changeReason: `rejected: ${reason.slice(0, 100)}`, createdBy: { type: "admin", id: auth.admin.id }, createdAt: new Date() }).catch(() => null);
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "content_rejected", target: { contentId: params.contentId, reason } });
  return NextResponse.json({ success: true });
}
