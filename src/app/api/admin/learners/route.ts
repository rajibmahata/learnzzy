import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";

// Aggregate learner insights only — no PII beyond optional nickname/ageBand.
// Never exposes per-child drill-down beyond learning signals.
export async function GET(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: true, data: { total: 0, byAgeBand: [], byLevel: [], learners: [] } });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 100);
  const [total, byAgeBand, byLevel, learners] = await Promise.all([
    db.collection("learners").countDocuments().catch(() => 0),
    db.collection("learners").aggregate([{ $group: { _id: "$ageBand", n: { $sum: 1 } } }]).toArray().catch(() => []),
    db.collection("learners").aggregate([{ $group: { _id: "$level", n: { $sum: 1 } } }]).toArray().catch(() => []),
    db
      .collection("learners")
      .find({}, { projection: { _id: 0, learnerId: 1, nickname: 1, ageBand: 1, level: 1, totalStars: 1, lastActivityAt: 1 } })
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .toArray()
      .catch(() => []),
  ]);
  return NextResponse.json({ success: true, data: { total, byAgeBand, byLevel, learners } });
}
