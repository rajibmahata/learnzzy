import { NextResponse } from "next/server";
import { z } from "zod";
import { requestRefill } from "@/server/pools";
import { requireAdmin, badRequest } from "@/server/admin";
import { audit } from "@/server/audit";

const RefillSchema = z.object({
  gameId: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  count: z.number().int().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const parsed = RefillSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid pool refill request.");
  try {
    const result = await requestRefill(parsed.data.gameId, parsed.data.difficulty, parsed.data.count, { type: "admin", id: auth.admin.id });
    await audit({ actorType: "admin", actorId: auth.admin.id, action: "pool_refill_requested", target: { ...parsed.data, taskId: result.taskId } });
    return NextResponse.json({ success: true, data: result }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "REFILL_FAILED", message: error instanceof Error ? error.message : "Unable to refill pool." } }, { status: 400 });
  }
}
