import { getDb, newId } from "@/db/mongodb";

export type AgeBand = "4-5" | "6-7" | "8-9";

export interface LearnerDoc {
  learnerId: string;
  sessionId: string;
  nickname?: string;
  ageBand: AgeBand;
  level: number; // 1..6+ — GLOBAL journey (single source, shared across all games)
  /** Per-skill adaptive levels (1..5) — legacy internal storage, not visible as game level.
   *  Skill mastery is the new internal signal; gameLevels kept for migration only.
   *  Absent game ⇒ falls back to global level. */
  gameLevels?: Record<string, number>;
  /** Fast latest-result projection for dashboards (history stays in events). */
  lastResult?: {
    gameId: string;
    accuracy: number;
    stars: number;
    level: number;
    hintsUsed: number;
    durationMs?: number;
    at: Date;
  };
  totalStars: number;
  stickerIds: string[];
  /** Per-concept discovery mastery (see lib/knowledge mastery machine). */
  conceptMastery?: Record<
    string,
    {
      exposures: number;
      attempts: number;
      correct: number;
      status: string;
      firstSeenAt?: string;
      lastSeenAt?: string;
      nextReviewAt?: string;
    }
  >;
  gameProgress: Record<
    string,
    {
      completions: number;
      bestAccuracy: number;
      lastLevel: number;
      /** Rolling accuracies, oldest → newest, capped at 10. */
      recentAccuracy?: number[];
      hintsUsed?: number;
    }
  >;
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
    // Preserve the level at which this game was completed for journey
    // analytics without changing the existing global promotion authority.
    const current = await getLearner(learnerId);
    if (current) {
      await db.collection("learners").updateOne(
        { learnerId },
        { $set: { [`gameProgress.${gameId}.lastLevel`]: current.level } } as never
      ).catch(() => null);
    }
    // interests: simple count
    await db.collection("learners").updateOne({ learnerId }, { $inc: { [`interests.${gameId}`]: 1 } as never }).catch(() => null);
  }
  const update: Record<string, unknown> = { $inc: { totalStars: stars }, $set: { updatedAt: new Date(), lastActivityAt: new Date() } };
  if (stickerId) (update as { $push: Record<string, unknown> }).$push = { stickerIds: stickerId };
  await db.collection("learners").updateOne({ learnerId }, update as never).catch(() => null);
  return getLearner(learnerId);
}

export interface GameResultInput {
  gameId: string;
  accuracy: number;
  stars?: number;
  stickerId?: string;
  hintsUsed?: number;
  durationMs?: number;
}

/**
 * Single structured result write per completed game (adaptive §3): bumps
 * completions, best accuracy, rolling accuracy window, hints, interests,
 * stars/stickers, and the latest-result projection — one update, no history
 * overwrite (raw event history stays append-only in gameEvents).
 */
export async function recordGameResult(learnerId: string, input: GameResultInput): Promise<LearnerDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  const accuracy = Math.max(0, Math.min(1, input.accuracy));
  const hintsUsed = Math.max(0, Math.floor(input.hintsUsed ?? 0));
  const cur = await getLearner(learnerId);
  const prev = cur?.gameProgress?.[input.gameId];
  const recent = [...(prev?.recentAccuracy ?? []), accuracy].slice(-10);
  const bestAccuracy = Math.max(prev?.bestAccuracy ?? 0, accuracy);
  const update: Record<string, unknown> = {
    $inc: {
      [`gameProgress.${input.gameId}.completions`]: 1,
      [`interests.${input.gameId}`]: 1,
      totalStars: Math.max(0, input.stars ?? 0),
      [`gameProgress.${input.gameId}.hintsUsed`]: hintsUsed,
    },
    $set: {
      [`gameProgress.${input.gameId}.bestAccuracy`]: bestAccuracy,
      [`gameProgress.${input.gameId}.recentAccuracy`]: recent,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      lastResult: {
        gameId: input.gameId,
        accuracy,
        stars: Math.max(0, input.stars ?? 0),
        level: cur?.level ?? 1,
        hintsUsed,
        ...(typeof input.durationMs === "number" ? { durationMs: Math.max(0, Math.floor(input.durationMs)) } : {}),
        at: new Date(),
      },
    },
  };
  if (cur) {
    (update.$set as Record<string, unknown>)[`gameProgress.${input.gameId}.lastLevel`] = cur.level;
  }
  if (input.stickerId) {
    (update as { $push?: Record<string, unknown> }).$push = { stickerIds: input.stickerId };
  }
  await db.collection("learners").updateOne({ learnerId }, update as never).catch(() => null);
  return getLearner(learnerId);
}

/**
 * Record one concept signal (exposure/recognition/recall). The mastery
 * machine lives in lib/knowledge; the repository only persists its output.
 */
export interface ConceptMasteryDoc {
  exposures: number;
  attempts: number;
  correct: number;
  status: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  nextReviewAt?: string;
}

/**
 * Persist the whole concept-mastery map at once. Concept ids contain dots
 * (`birds.parrot`), which MUST NOT appear in dotted $set paths (Mongo would
 * nest them instead of keying flat) — so the caller merges and we write the
 * complete map as one literal object.
 */
export async function saveConceptMastery(
  learnerId: string,
  mastery: Record<string, ConceptMasteryDoc>
): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("learners")
    .updateOne({ learnerId }, { $set: { conceptMastery: mastery, updatedAt: new Date(), lastActivityAt: new Date() } })
    .catch(() => null);
}

/** Persist a per-skill level (clamped 1..5). Never touches other skills. */
export async function setGameLevel(learnerId: string, gameId: string, level: number): Promise<LearnerDoc | null> {
  const clamped = Math.max(1, Math.min(5, Math.floor(level)));
  const db = await getDb().catch(() => null);
  if (!db) return null;
  await db
    .collection("learners")
    .updateOne({ learnerId }, { $set: { [`gameLevels.${gameId}`]: clamped, updatedAt: new Date(), lastActivityAt: new Date() } })
    .catch(() => null);
  return getLearner(learnerId);
}

export async function setLearnerLevel(learnerId: string, level: number): Promise<LearnerDoc | null> {
  const clamped = Math.max(1, Math.min(10, Math.floor(level)));
  const db = await getDb().catch(() => null);
  if (!db) return null;
  await db.collection("learners").updateOne({ learnerId }, { $set: { level: clamped, updatedAt: new Date(), lastActivityAt: new Date() } }).catch(() => null);
  return getLearner(learnerId);
}
