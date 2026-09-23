import { getDb } from "@/db/mongodb";
import type { Habitat } from "@/lib/livingForest";

export interface ForestStateDoc {
  learnerId: string;
  forestLevel: number;
  unlockedHabitats: Habitat[];
  activeCreatures: { stickerId: string; species: string; habitat: Habitat; unlockedAt: string; favorite?: boolean }[];
  favoriteIds: string[];
  updatedAt: string;
}

export async function getForestState(learnerId: string): Promise<ForestStateDoc | null> {
  const db = await getDb();
  if (!db) return null;
  return (await db.collection("forestStates").findOne({ learnerId })) as ForestStateDoc | null;
}

export async function saveForestState(doc: ForestStateDoc): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.collection("forestStates").updateOne(
    { learnerId: doc.learnerId },
    { $set: { ...doc, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function queueForestEvent(learnerId: string, type: string, payload: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.collection("forestEvents").insertOne({
    eventId: `fe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    learnerId, type, payload, createdAt: new Date().toISOString(), consumedAt: null,
  });
}
