import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { requireAdmin } from "@/server/admin";
import { adminConfigured } from "@/server/admin-auth";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const started = Date.now();
  const db = await getDb().catch(() => null);
  let mongo = "not_configured";
  if (db) {
    try {
      await db.command({ ping: 1 });
      mongo = "healthy";
    } catch {
      mongo = "unhealthy";
    }
  }
  return NextResponse.json({
    success: true,
    data: {
      app: "healthy",
      mongo,
      redis: process.env.REDIS_URL ? "configured" : "in_process_fallback",
      ai: process.env.AI_API_KEY ? "configured" : "mock_fallback",
      admin: adminConfigured() ? "configured" : "misconfigured",
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
    },
  });
}
