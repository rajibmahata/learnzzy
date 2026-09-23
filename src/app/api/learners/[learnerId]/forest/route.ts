import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { getForestState, saveForestState, queueForestEvent } from "@/repositories/forest";
import { forestLevel } from "@/lib/livingForest";
import { resolveStickerIds } from "@/lib/stickers";
import { stickerToCreature } from "@/lib/livingForest";

export async function GET(_req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND" } }, { status: 404 });
  const stickers = resolveStickerIds(learner.stickerIds ?? []);
  const lvl = forestLevel(stickers.length);
  const creatures = stickers.map((s) => {
    const m = stickerToCreature(s);
    return { stickerId: s.id, species: m.species, habitat: m.habitat, unlockedAt: new Date().toISOString(), favorite: false };
  });
  const saved = await getForestState(params.learnerId).catch(() => null);
  const doc = saved ?? {
    learnerId: params.learnerId,
    forestLevel: lvl.level,
    unlockedHabitats: lvl.unlockedHabitats,
    activeCreatures: creatures,
    favoriteIds: [],
    updatedAt: new Date().toISOString(),
  };
  // Best-effort persist derived state (Mongo authoritative when available)
  if (!saved) await saveForestState(doc).catch(() => undefined);
  return NextResponse.json({ success: true, data: doc });
}

const SaveSchema = z.object({
  favoriteIds: z.array(z.string().max(60)).max(54).optional(),
  consumeEventIds: z.array(z.string().max(80)).max(20).optional(),
});

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND" } }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR" } }, { status: 422 });
  const stickers = resolveStickerIds(learner.stickerIds ?? []);
  const lvl = forestLevel(stickers.length);
  const creatures = stickers.map((s) => {
    const m = stickerToCreature(s);
    return { stickerId: s.id, species: m.species, habitat: m.habitat, unlockedAt: new Date().toISOString(), favorite: parsed.data.favoriteIds?.includes(s.id) ?? false };
  });
  const doc = {
    learnerId: params.learnerId,
    forestLevel: lvl.level,
    unlockedHabitats: lvl.unlockedHabitats,
    activeCreatures: creatures,
    favoriteIds: parsed.data.favoriteIds ?? [],
    updatedAt: new Date().toISOString(),
  };
  await saveForestState(doc).catch(() => undefined);
  // Queue arrival event for newly unlocked creatures (sequential cinematic, skippable client-side)
  if (creatures.length > 0) {
    const last = creatures[creatures.length - 1]!;
    await queueForestEvent(params.learnerId, "CREATURE_ARRIVAL", { stickerId: last.stickerId }).catch(() => undefined);
  }
  return NextResponse.json({ success: true, data: doc });
}
