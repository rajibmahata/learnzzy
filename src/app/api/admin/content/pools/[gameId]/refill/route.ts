import { NextResponse } from "next/server";
import { z } from "zod";
import { requestRefill } from "@/server/pools";
import { requireAdmin, badRequest } from "@/server/admin";
import { audit } from "@/server/audit";

const Body = z.object({ difficulty: z.enum(["easy", "medium", "hard"]).default("easy"), count: z.number().int().min(1).max(100).optional() });

export async function POST(req: Request, { params }: { params: { gameId: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Invalid refill request.");
  try {
    const result = await requestRefill(params.gameId, parsed.data.difficulty, parsed.data.count, { type: "admin", id: auth.admin.id });
    await audit({ actorType: "admin", actorId: auth.admin.id, action: "pool_refill_requested", target: { gameId: params.gameId, ...parsed.data, taskId: result.taskId } });
    return NextResponse.json({ success: true, data: result }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: "REFILL_FAILED", message: e instanceof Error ? e.message : "Unable to refill pool." } }, { status: 400 });
  }
}
