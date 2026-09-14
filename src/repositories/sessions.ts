import { getDb, newId } from "@/db/mongodb";

// sessions — anonymous, no PII (BR-001). One doc per gameplay session.
export interface SessionDoc {
  sessionId: string;
  platform: string;
  deviceType?: string;
  locale?: string;
  timezone?: string;
  appVersion?: string;
  status: "active" | "expired" | "completed";
  startedAt: Date;
  lastActivityAt: Date;
  endedAt: Date | null;
}

export async function createSession(input: {
  deviceType?: string;
  locale?: string;
  timezone?: string;
}): Promise<SessionDoc | null> {
  const db = await getDb().catch(() => null);
  const doc: SessionDoc = {
    sessionId: newId("sess"),
    platform: "web",
    deviceType: input.deviceType,
    locale: input.locale,
    timezone: input.timezone,
    status: "active",
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
  if (!db) return doc; // no DB → ephemeral session; gameplay continues
  await db.collection<SessionDoc>("sessions").insertOne(doc).catch(() => null);
  return doc;
}

export async function touchSession(sessionId: string): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("sessions")
    .updateOne({ sessionId }, { $set: { lastActivityAt: new Date() } })
    .catch(() => null);
}
