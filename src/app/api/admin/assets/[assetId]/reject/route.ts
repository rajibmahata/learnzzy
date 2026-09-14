import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { audit } from "@/server/audit";

export async function POST(req: Request, { params }: { params: { assetId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : "Rejected by administrator";
  const db = await getDb();
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  const r = await db.collection("assets").updateOne({ assetId: params.assetId }, { $set: { status: "rejected", rejectionReason: reason, rejectedAt: new Date(), rejectedBy: auth.admin.id, updatedAt: new Date() } });
  if (!r.matchedCount) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found." } }, { status: 404 });
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "asset_rejected", target: { assetId: params.assetId, reason } });
  return NextResponse.json({ success: true });
}
