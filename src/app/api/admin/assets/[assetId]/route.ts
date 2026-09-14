import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

export async function GET(_req: Request, { params }: { params: { assetId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  const doc = await db.collection("assets").findOne({ assetId: params.assetId }, { projection: { _id: 0 } });
  if (!doc) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found." } }, { status: 404 });
  const versions = await db.collection("assetVersions").find({ assetId: params.assetId }, { projection: { _id: 0 } }).sort({ version: -1 }).limit(10).toArray().catch(() => []);
  return NextResponse.json({ success: true, data: { asset: doc, versions } });
}
