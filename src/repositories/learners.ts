import { getDb, newId } from "@/db/mongodb";

export type AgeBand = "4-5" | "6-7" | "8-9";

export interface LearnerDoc {
  learnerId: string;
  sessionId: string;
  nickname?: string;
  ageBand: AgeBand;
  level: number; // 1..5
  totalStars: number;
  stickerIds: string[];
  gameProgress: Record<string, { completions: number; bestAccuracy: number; lastLevel: number }>;
  interests: Record<string, number>; // gameId -> score
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export const AGE_BANDS: AgeBand[] = ["4-5", "6-7", "8-9"];

export function normalizeNickname(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().slice(0, 20);
  if (s.length < 1) return undefined;
  // No PII validation beyond length; allow any display name
  return s;
}

export async function createLearner(input: { nickname?: string; ageBand: AgeBand; sessionId?: string }): Promise<LearnerDoc> {
  const db = await getDb().catch(() => null);
  const doc: LearnerDoc = {
    learnerId: newId("learner"),
    sessionId: input.sessionId || newId("sess"),
    nickname: normalizeNickname(input.nickname),
    ageBand: input.ageBand,
    level: 1,
    totalStars: 0,
    stickerIds: [],
    gameProgress: {},
    interests: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActivityAt: new Date(),
  };
  if (!db) return doc;
  await db.collection<LearnerDoc>("learners").insertOne(doc).catch(() => null);
  // Also ensure a session doc exists
  await db.collection("sessions").insertOne({
    sessionId: doc.sessionId,
    platform: "web",
    status: "active",
    startedAt: doc.createdAt,
    lastActivityAt: doc.lastActivityAt,
    endedAt: null,
  } as never).catch(() => null);
  return doc;
}

export async function getLearner(learnerId: string): Promise<LearnerDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  return (await db.collection<LearnerDoc>("learners").findOne({ learnerId }).catch(() => null)) as LearnerDoc | null;
}

export async function updateLearnerActivity(learnerId: string): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db.collection("learners").updateOne({ learnerId }, { $set: { lastActivityAt: new Date(), updatedAt: new Date() } }).catch(() => null);
}

export async function addLearnerStars(learnerId: string, stars: number, stickerId?: string, gameId?: string, accuracy?: number): Promise<LearnerDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  if (gameId) {
    const key = `gameProgress.${gameId}.completions`;
    // Use $inc for completions and update bestAccuracy if higher
    await db.collection("learners").updateOne({ learnerId }, { $inc: { [key]: 1 } as never }).catch(() => null);
    if (typeof accuracy === "number") {
      const cur = await getLearner(learnerId);
      const prev = cur?.gameProgress?.[gameId]?.bestAccuracy ?? 0;
      if (accuracy > prev) {
        await db.collection("learners").updateOne({ learnerId }, { $set: { [`gameProgress.${gameId}.bestAccuracy`]: accuracy } as never }).catch(() => null);
      }
    }
    // interests: simple count
    await db.collection("learners").updateOne({ learnerId }, { $inc: { [`interests.${gameId}`]: 1 } as never }).catch(() => null);
  }
  const update: Record<string, unknown> = { $inc: { totalStars: stars }, $set: { updatedAt: new Date(), lastActivityAt: new Date() } };
  if (stickerId) (update as { $push: Record<string, unknown> }).$push = { stickerIds: stickerId };
  await db.collection("learners").updateOne({ learnerId }, update as never).catch(() => null);
  return getLearner(learnerId);
}

export async function setLearnerLevel(learnerId: string, level: number): Promise<LearnerDoc | null> {
  const clamped = Math.max(1, Math.min(5, Math.floor(level)));
  const db = await getDb().catch(() => null);
  if (!db) return null;
  await db.collection("learners").updateOne({ learnerId }, { $set: { level: clamped, updatedAt: new Date(), lastActivityAt: new Date() } }).catch(() => null);
  return getLearner(learnerId);
}
