import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

// Recent provider events (observability) + cached knowledge entries with
// provenance. No payloads, no secrets, no raw traces.
export async function GET(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: { events: [], knowledge: [] } });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const [events, knowledge] = await Promise.all([
    db.collection("educationProviderEvents").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray().catch(() => []),
    db.collection("educationKnowledgeCache").find({}, { projection: { _id: 0, cacheKey: 1, provider: 1, conceptId: 1, retrievedAt: 1, expiresAt: 1, "provenance.license": 1, "provenance.attribution": 1 } }).sort({ retrievedAt: -1 }).limit(limit).toArray().catch(() => []),
  ]);
  return NextResponse.json({ success: true, data: { events, knowledge } });
}
