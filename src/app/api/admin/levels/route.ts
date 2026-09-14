import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/mongodb";
import { requireAdmin, badRequest } from "@/server/admin";
import { listLevels, DEFAULT_LEVELS } from "@/repositories/levels";
import { audit } from "@/server/audit";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ success: true, data: await listLevels() });
}

const UpdateSchema = z.object({
  level: z.number().int().min(1).max(5),
  ageBand: z.enum(["4-5", "6-7", "8-9"]),
  config: z.object({
    maxOperand: z.number().int().min(1).max(100),
    pieceCount: z.number().int().min(2).max(16),
    targets: z.number().int().min(1).max(10),
    tolerance: z.number().min(1).max(30),
    rounds: z.number().int().min(1).max(10),
  }),
});

export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON.");
  }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest("level (1-5), ageBand and full config required.");
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  await db.collection("levels").updateOne(
    { level: parsed.data.level, ageBand: parsed.data.ageBand },
    { $set: { level: parsed.data.level, ageBand: parsed.data.ageBand, config: parsed.data.config, isActive: true, updatedAt: new Date(), updatedBy: auth.admin.id }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "level_config_updated", target: { level: parsed.data.level, ageBand: parsed.data.ageBand } });
  return NextResponse.json({ success: true, data: { updated: true } });
}

export async function DELETE() {
  // Reset to defaults (admin-approved operation, audited)
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb().catch(() => null);
  if (!db) return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } }, { status: 503 });
  for (const l of DEFAULT_LEVELS) {
    await db
      .collection("levels")
      .updateOne(
        { level: l.level, ageBand: l.ageBand },
        { $set: { level: l.level, ageBand: l.ageBand, config: l.config, isActive: true, updatedAt: new Date(), updatedBy: auth.admin.id }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
      .catch(() => null);
  }
  await audit({ actorType: "admin", actorId: auth.admin.id, action: "level_config_reset" });
  return NextResponse.json({ success: true, data: { reset: true } });
}
