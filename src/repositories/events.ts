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
    learnerId?: string;
    metadata?: Record<string, unknown>;
    clientTimestamp?: string;
  }>,
  learnerId?: string
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
    // Per-event owner wins (queued under whichever learner was active at
    // creation); the batch owner is the fallback for older clients.
    const owner = e.learnerId ?? learnerId ?? null;
    const doc = {
      eventId,
      sessionId,
      learnerId: owner,
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
  // Best-effort session touch; never fails ingestion. Binds the session to
  // its learner on first sight (additive — anonymous sessions keep working).
  await db
    .collection("sessions")
    .updateOne(
      { sessionId },
      learnerId
        ? { $set: { lastActivityAt: now, learnerId } }
        : { $set: { lastActivityAt: now } }
    )
    .catch(() => null);
  return { accepted, duplicates, failed };
}
