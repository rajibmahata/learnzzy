import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: [] });
  const docs = await db.collection("content").aggregate([{ $group: { _id: { gameId: "$gameId", status: "$status" }, n: { $sum: 1 } } }]).toArray().catch(() => []);
  return NextResponse.json({ success: true, data: docs });
}
