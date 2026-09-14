import { getDb, newId } from "@/db/mongodb";

// gameEvents — append-only, idempotent on eventId (BR-141, BR-212).
export interface IngestResult {
  accepted: number;
  duplicates: number;
  failed: number;
}

export async function ingestEvents(
  sessionId: string,
  events: Array<{
    clientEventId?: string;
    event: string;
    gameId?: string;
    contentId?: string;
    metadata?: Record<string, unknown>;
    clientTimestamp?: string;
  }>
): Promise<IngestResult> {
  const db = await getDb().catch(() => null);
  // No DB → accept (client clears queue) but nothing persisted; analytics degrades.
  if (!db) return { accepted: events.length, duplicates: 0, failed: 0 };

  let accepted = 0;
  let duplicates = 0;
  let failed = 0;
  const now = new Date();
  const col = db.collection("gameEvents");

  for (const e of events) {
    const eventId = e.clientEventId || newId("evt");
    const doc = {
      eventId,
      sessionId,
      gameId: e.gameId,
      contentId: e.contentId,
      event: e.event,
      payload: e.metadata ?? {},
      clientTimestamp: e.clientTimestamp ? new Date(e.clientTimestamp) : now,
      serverTimestamp: now,
      source: "online" as const,
    };
    try {
      await col.insertOne(doc);
      accepted++;
    } catch (err: unknown) {
      // duplicate key → idempotent replay, not an error
      if (err && typeof err === "object" && "code" in err && err.code === 11000) duplicates++;
      else failed++;
    }
  }
  // Best-effort session touch; never fails ingestion.
  await db
    .collection("sessions")
    .updateOne({ sessionId }, { $set: { lastActivityAt: now } })
    .catch(() => null);
  return { accepted, duplicates, failed };
}
