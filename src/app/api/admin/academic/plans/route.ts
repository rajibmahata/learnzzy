import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { listAcademicPlans } from "@/repositories/academicPlans";
import { listVoiceAssets } from "@/services/voiceAssetService";
import { getDb } from "@/db/mongodb";

// Admin inspection: academic plans + agent decisions + voice assets +
// MCP provider usage (via education/health). Read-only observability.
export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const [plans, voice] = await Promise.all([listAcademicPlans(20), listVoiceAssets(20)]);
  let signals = 0;
  let failures = 0;
  try {
    const db = await getDb();
    if (db) {
      signals = await db.collection("learningSignals").countDocuments({}).catch(() => 0);
      failures = await db
        .collection("agentEvents")
        .countDocuments({ agentId: "academic-agent", level: "error" })
        .catch(() => 0);
    }
  } catch {
    // Observability degrades gracefully.
  }
  return NextResponse.json({
    success: true,
    data: { plans, voiceAssets: voice, signals, failedRecommendations: failures },
  });
}
