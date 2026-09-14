import { NextResponse } from "next/server";
import { applyRecommendation } from "@/agents/difficulty";
import { requireAdmin } from "@/server/admin";
import { audit } from "@/server/audit";

export async function POST(_req: Request, { params }: { params: { recommendationId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const result = await applyRecommendation(params.recommendationId, auth.admin.id);
    await audit({ actorType: "admin", actorId: auth.admin.id, action: "difficulty_recommendation_applied", target: { recommendationId: params.recommendationId } });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "APPLY_FAILED", message: error instanceof Error ? error.message : "Unable to apply recommendation." } }, { status: 400 });
  }
}
