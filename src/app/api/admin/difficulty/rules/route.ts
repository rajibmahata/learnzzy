import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: true, data: [] });
  const docs = await db.collection("difficultyRules").find({}, { projection: { _id: 0 } }).sort({ gameId: 1 }).toArray();
  return NextResponse.json({ success: true, data: docs });
}
