import { getDb } from "@/db/mongodb";

// Durable tier for validated external knowledge: Redis/memory cache is fast
// but ephemeral; Mongo keeps curated, provenance-stamped records across
// restarts. Payloads are Zod-validated before save and after load.
export interface KnowledgeCacheDoc {
  cacheKey: string;
  provider: string;
  kind: "search" | "concept" | "curriculum" | "prerequisites";
  conceptId?: string;
  payload: unknown;
  provenance: { license: string; attribution: string } | null;
  retrievedAt: Date;
  expiresAt: Date;
}

export async function saveKnowledgeCache(doc: Omit<KnowledgeCacheDoc, "retrievedAt">): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("educationKnowledgeCache")
    .updateOne(
      { cacheKey: doc.cacheKey },
      { $set: { ...doc, retrievedAt: new Date() } },
      { upsert: true }
    )
    .catch(() => null);
}

export async function getKnowledgeCache(cacheKey: string): Promise<unknown | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  const doc = (await db.collection("educationKnowledgeCache").findOne({ cacheKey }).catch(() => null)) as KnowledgeCacheDoc | null;
  if (!doc) return null;
  if (doc.expiresAt.getTime() <= Date.now()) return null;
  return doc.payload ?? null;
}
