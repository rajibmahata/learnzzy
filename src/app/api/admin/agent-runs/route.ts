import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

export async function GET(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: true, data: [] });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const filter: Record<string, string> = {};
  for (const k of ["agentId", "status"] as const) {
    const v = url.searchParams.get(k);
    if (v) filter[k] = v;
  }
  const docs = await db.collection("agentRuns").find(filter, { projection: { _id: 0 } }).sort({ startedAt: -1 }).limit(limit).toArray();
  return NextResponse.json({ success: true, data: docs });
}
