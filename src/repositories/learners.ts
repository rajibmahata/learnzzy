import { getDb, newId } from "@/db/mongodb";
import { normalizeAvatar, normalizeDisplayName, normalizeNickname, sanitizeCompanion, type CompanionInput } from "../lib/identity.ts";

export type AgeBand = "4-5" | "6-7" | "8-9";

export interface LearnerDoc {
  learnerId: string;
  sessionId: string;
  /** Child's name (personalization only, never authentication). */
  displayName?: string;
  /** What Learnzzy calls the child; falls back to displayName. */
  nickname?: string;
  /** Explorer buddy emoji picked by the child (display-only, never auth). */
  avatar?: string;
  /** Primary companion: chosen character + the name the child gave it. */
  companion?: { characterId: string; displayName?: string };
  /** Stepped onboarding state (additive; old profiles simply lack it). */
  onboarding?: { completed: boolean; completedAt?: string; version: number };
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
      /** Adaptive: rolling response times / attempts for learning behavior (additive, optional). */
      recentResponseTime?: number[];
      recentAttempts?: number[];
    }
  >;
  interests: Record<string, number>; // gameId -> score
  /** Recent completion ids for idempotent reward/progress writes (capped). */
  recentCompletionIds?: string[];
  /** Adaptive: per-skill learning behavior (additive, optional, derived from gameProgress + events). */
  learningBehavior?: Record<string, { avgResponseTime?: number; avgAttempts?: number; hintRate?: number }>;
  /** Adaptive: voice preference per learner (additive, optional). */
  voicePreference?: { voiceId?: string; locale?: string };
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export const AGE_BANDS: AgeBand[] = ["4-5", "6-7", "8-9"];

export type { CompanionInput };

export async function createLearner(input: {
  displayName?: string;
  nickname?: string;
  avatar?: string;
  companion?: CompanionInput;
  ageBand: AgeBand;
  sessionId?: string;
}): Promise<LearnerDoc> {
  const db = await getDb().catch(() => null);
  const doc: LearnerDoc = {
    learnerId: newId("learner"),
    sessionId: input.sessionId || newId("sess"),
    displayName: normalizeDisplayName(input.displayName),
    nickname: normalizeNickname(input.nickname),
    avatar: normalizeAvatar(input.avatar),
    companion: input.companion ? (sanitizeCompanion(input.companion) ?? undefined) : undefined,
    onboarding: { completed: false, version: 1 },
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

export interface ProfilePatch {
  displayName?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  companion?: CompanionInput | null;
  onboardingCompleted?: boolean;
}

/**
 * Child-safe profile update. Strict allowlist: displayName, nickname, avatar,
 * companion, onboarding flag. ageBand, level, progress, rewards, and history
 * are NEVER writable here — identity (learnerId) stays stable no matter what
 * display fields change.
 */
export async function updateLearnerProfile(learnerId: string, patch: ProfilePatch): Promise<LearnerDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  const existing = await getLearner(learnerId);
  if (!existing) return null;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  const unset: Record<string, string> = {};
  const assign = (key: string, value: unknown) => {
    if (value === undefined) unset[key] = "";
    else set[key] = value;
  };
  if (patch.displayName !== undefined) assign("displayName", normalizeDisplayName(patch.displayName ?? undefined));
  if (patch.nickname !== undefined) assign("nickname", normalizeNickname(patch.nickname ?? undefined));
  if (patch.avatar !== undefined) assign("avatar", normalizeAvatar(patch.avatar ?? undefined));
  if (patch.companion !== undefined) {
    if (patch.companion === null) {
      unset.companion = "";
    } else {
      const clean = sanitizeCompanion(patch.companion);
      if (!clean) return null;
      set.companion = clean;
    }
  }
  if (patch.onboardingCompleted === true) {
    set.onboarding = { completed: true, completedAt: new Date().toISOString(), version: 1 };
  }
  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;
  await db.collection("learners").updateOne({ learnerId }, update as never).catch(() => null);
  return getLearner(learnerId);
}

export async function updateLearnerActivity(learnerId: string): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db.collection("learners").updateOne({ learnerId }, { $set: { lastActivityAt: new Date(), updatedAt: new Date() } }).catch(() => null);
}

export interface GameResultInput {
  gameId: string;
  accuracy: number;
  stars?: number;
  stickerId?: string;
  hintsUsed?: number;
  durationMs?: number;
  /** Adaptive signals (all optional, additive) */
  responseTimeMs?: number;
  attempts?: number;
  theme?: string;
  character?: string;
  /** Optional idempotency key: repeat submissions return { duplicate: true }
   *  without re-recording completions, stars, or stickers. */
  completionId?: string;
}

/**
 * Single structured result write per completed game (adaptive §3): bumps
 * completions, best accuracy, rolling accuracy window, hints, interests,
 * stars/stickers, and the latest-result projection — one update, no history
 * overwrite (raw event history stays append-only in gameEvents).
 */
export async function recordGameResult(
  learnerId: string,
  input: GameResultInput
): Promise<{ learner: LearnerDoc | null; duplicate: boolean }> {
  const db = await getDb().catch(() => null);
  if (!db) return { learner: null, duplicate: false };
  const accuracy = Math.max(0, Math.min(1, input.accuracy));
  const hintsUsed = Math.max(0, Math.floor(input.hintsUsed ?? 0));
  const cur = await getLearner(learnerId);
  if (input.completionId && (cur?.recentCompletionIds ?? []).includes(input.completionId)) {
    return { learner: cur, duplicate: true };
  }
  const prev = cur?.gameProgress?.[input.gameId];
  const recent = [...(prev?.recentAccuracy ?? []), accuracy].slice(-10);
  const bestAccuracy = Math.max(prev?.bestAccuracy ?? 0, accuracy);
  // Adaptive: rolling responseTime / attempts (additive, capped 10)
  const recentResponseTime = typeof input.responseTimeMs === "number" ? [...(prev?.recentResponseTime ?? []), Math.max(0, Math.floor(input.responseTimeMs))].slice(-10) : prev?.recentResponseTime;
  const recentAttempts = typeof input.attempts === "number" ? [...(prev?.recentAttempts ?? []), Math.max(1, Math.floor(input.attempts))].slice(-10) : prev?.recentAttempts;
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
      ...(recentResponseTime ? { [`gameProgress.${input.gameId}.recentResponseTime`]: recentResponseTime } : {}),
      ...(recentAttempts ? { [`gameProgress.${input.gameId}.recentAttempts`]: recentAttempts } : {}),
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
  // Adaptive: derive learningBehavior for this skill (additive, feature-flagged but stored always)
  if (recentResponseTime || recentAttempts) {
    const avgResponseTime = recentResponseTime ? Math.round(recentResponseTime.reduce((a, b) => a + b, 0) / recentResponseTime.length) : undefined;
    const avgAttempts = recentAttempts ? Math.round((recentAttempts.reduce((a, b) => a + b, 0) / recentAttempts.length) * 10) / 10 : undefined;
    const totalCompletions = (prev?.completions ?? 0) + 1;
    const hintRate = totalCompletions ? Math.round((hintsUsed / totalCompletions) * 100) / 100 : 0;
    (update.$set as Record<string, unknown>)[`learningBehavior.${input.gameId}`] = { avgResponseTime, avgAttempts, hintRate };
  }
  if (input.stickerId) {
    (update as { $push?: Record<string, unknown> }).$push = { stickerIds: input.stickerId };
  }
  if (input.completionId) {
    // Remember idempotency keys inline (capped); history stays in events/claims.
    const seen = [...(cur?.recentCompletionIds ?? []), input.completionId].slice(-50);
    (update.$set as Record<string, unknown>).recentCompletionIds = seen;
  }
  await db.collection("learners").updateOne({ learnerId }, update as never).catch(() => null);
  return { learner: await getLearner(learnerId), duplicate: false };
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
