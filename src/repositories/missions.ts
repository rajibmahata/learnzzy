import { getDb, newId } from "@/db/mongodb";
import type { Db } from "mongodb";
import { recordGameResult } from "@/repositories/learners";
import { missionFromId } from "@/lib/missionEngine";
import type { Mission, MissionEvidence, MissionStep, MissionSkill, LearnerMissionProgress } from "@/lib/missionEngine";

export interface MissionAttemptDoc {
  attemptId: string;
  learnerId: string;
  missionId: string;
  status: "started" | "completed";
  startedAt: string;
  completedAt?: string;
  stepResults: Array<{ stepId: string; evidence: MissionEvidence }>;
  rewardGranted: boolean;
  updatedAt: string;
}

export interface MissionSkillProgress {
  skill: MissionSkill;
  attempts: number;
  completed: number;
  correct: number;
  accuracyPct: number;
  hintsUsed: number;
  averageResponseTimeMs: number;
  lastPracticedAt: string | null;
}

export async function saveMissionDefinition(mission: Mission): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  const now = new Date();
  await db.collection("missionTemplates").updateOne(
    { templateId: mission.templateId },
    { $set: { templateId: mission.templateId, title: mission.title, description: mission.description, ageBands: mission.ageBands, primarySkill: mission.primarySkill, secondarySkills: mission.secondarySkills, estimatedMinutes: mission.estimatedMinutes, gameType: mission.gameType, status: mission.status, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  ).catch(() => null);
  await db.collection("missions").updateOne(
    { missionId: mission.missionId },
    { $set: { ...mission, updatedAt: now }, $setOnInsert: { createdAt: mission.createdAt ? new Date(mission.createdAt) : now } },
    { upsert: true }
  ).catch(() => null);
  await Promise.all(mission.steps.map((step) => db.collection("missionSteps").updateOne(
    { missionId: mission.missionId, stepId: step.stepId },
    { $set: { ...step, missionId: mission.missionId, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  ).catch(() => null)));
}

export async function startMissionAttempt(learnerId: string, missionId: string, attemptId?: string): Promise<MissionAttemptDoc> {
  const now = new Date().toISOString();
  const doc: MissionAttemptDoc = {
    attemptId: attemptId || newId("mission_attempt"), learnerId, missionId,
    status: "started", startedAt: now, stepResults: [], rewardGranted: false, updatedAt: now,
  };
  const db = await getDb().catch(() => null);
  if (db) {
    const attempts = db.collection<MissionAttemptDoc>("missionAttempts");
    if (attemptId) {
      const existing = await attempts.findOne({ attemptId }).catch(() => null);
      if (existing) return existing;
    } else {
      // Resume an already-started attempt instead of opening concurrent ones.
      const resumed = await attempts.findOne({ learnerId, missionId, status: "started" }).catch(() => null);
      if (resumed) return resumed;
    }
    await attempts.insertOne(doc).catch(() => null);
    // Count mission starts here; per-step submissions live in evidence[].attempts.
    if (learnerId !== "guest") {
      const totalSteps = missionFromId(missionId)?.steps.length ?? 3;
      await db.collection<LearnerMissionProgress>("learnerMissionProgress").updateOne(
        { learnerId, missionId },
        {
          $setOnInsert: { learnerId, missionId, completedSteps: 0, totalSteps, attempts: 0, correctSteps: 0, hintsUsed: 0, evidence: [], rewardGranted: false, updatedAt: now },
          $inc: { attempts: 1 },
          $set: { totalSteps, updatedAt: now },
        } as never,
        { upsert: true }
      ).catch(() => null);
    }
  }
  return doc;
}

export async function recordMissionStepEvidence(
  attemptId: string,
  evidence: MissionEvidence,
  totalSteps: number
): Promise<{ duplicate: boolean; progress: LearnerMissionProgress | null }> {
  const db = await getDb().catch(() => null);
  if (!db) return { duplicate: false, progress: null };
  const attempts = db.collection<MissionAttemptDoc>("missionAttempts");
  const attempt = await attempts.findOne({ attemptId }).catch(() => null);
  if (!attempt || attempt.status !== "started" || attempt.learnerId !== evidence.learnerId || attempt.missionId !== evidence.missionId) return { duplicate: false, progress: null };
  if (attempt.stepResults.some((result) => result.stepId === evidence.stepId)) {
    return { duplicate: true, progress: await getMissionProgressForAttempt(db, evidence.learnerId, evidence.missionId) };
  }
  await attempts.updateOne({ attemptId }, { $push: { stepResults: { stepId: evidence.stepId, evidence } }, $set: { updatedAt: new Date().toISOString() } } as never).catch(() => null);
  // Guest practice stays in the attempt only; shared "guest" aggregates would
  // mix every anonymous child together.
  if (evidence.learnerId !== "guest") {
    const progressCollection = db.collection<LearnerMissionProgress>("learnerMissionProgress");
    await progressCollection.updateOne(
      { learnerId: evidence.learnerId, missionId: evidence.missionId },
      {
        $setOnInsert: { learnerId: evidence.learnerId, missionId: evidence.missionId, completedSteps: 0, totalSteps, attempts: 0, correctSteps: 0, hintsUsed: 0, evidence: [], rewardGranted: false, updatedAt: evidence.timestamp },
        $push: { evidence },
        $inc: { completedSteps: evidence.completed ? 1 : 0, correctSteps: evidence.correct ? 1 : 0, hintsUsed: evidence.hintsUsed },
        $set: { totalSteps, updatedAt: evidence.timestamp },
      } as never,
      { upsert: true }
    ).catch(() => null);
  }
  return { duplicate: false, progress: await getMissionProgressForAttempt(db, evidence.learnerId, evidence.missionId) };
}

export async function completeMissionAttempt(
  attemptId: string,
  learnerId: string,
  missionId: string,
  totalSteps: number,
  opts?: { gameType?: string }
): Promise<{ completed: boolean; rewardGranted: boolean; accuracy: number; stars: number }> {
  const db = await getDb().catch(() => null);
  if (!db) return { completed: true, rewardGranted: false, accuracy: 0, stars: 0 };
  const attempts = db.collection<MissionAttemptDoc>("missionAttempts");
  const current = await attempts.findOne({ attemptId, learnerId, missionId }).catch(() => null);
  if (!current || current.status !== "started" || current.stepResults.length < totalSteps || current.stepResults.some((result) => !result.evidence.completed)) {
    return { completed: false, rewardGranted: false, accuracy: current?.stepResults.length ? current.stepResults.filter((result) => result.evidence.correct).length / totalSteps : 0, stars: 0 };
  }
  const accuracy = current.stepResults.filter((result) => result.evidence.correct).length / Math.max(1, totalSteps);
  const earnedStars = Math.max(1, Math.min(5, Math.round(accuracy * 5)));
  const result = await attempts.updateOne(
    { attemptId, learnerId, missionId, status: "started", rewardGranted: false },
    { $set: { status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), rewardGranted: true, accuracy } } as never
  ).catch(() => ({ modifiedCount: 0 } as { modifiedCount: number }));
  if (result.modifiedCount !== 1) {
    const existing = await attempts.findOne({ attemptId, learnerId, missionId }).catch(() => null);
    return { completed: existing?.status === "completed", rewardGranted: Boolean(existing?.rewardGranted), accuracy, stars: earnedStars };
  }
  // Feed the shared progression system (gameProgress, interests, totalStars,
  // lastResult) so adaptive levels, parent per-game views, and the planner see
  // mission practice. recordGameResult is the single structured result write;
  // stars are granted here, never separately, to avoid double counting.
  if (learnerId !== "guest") {
    const hintsUsed = current.stepResults.reduce((sum, result) => sum + (result.evidence.hintsUsed ?? 0), 0);
    await recordGameResult(learnerId, {
      gameId: opts?.gameType ?? missionFromId(missionId)?.gameType ?? "mission",
      accuracy,
      stars: earnedStars,
      hintsUsed,
    }).catch(() => null);
  }
  await db.collection("learnerMissionProgress").updateOne(
    { learnerId, missionId },
    { $set: { completedAt: new Date().toISOString(), rewardGranted: true, updatedAt: new Date().toISOString() } } as never
  ).catch(() => null);
  return { completed: true, rewardGranted: true, accuracy, stars: earnedStars };
}

export async function getLearnerMissionProgress(learnerId: string, limit = 20): Promise<LearnerMissionProgress[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  return await db.collection<LearnerMissionProgress>("learnerMissionProgress").find({ learnerId }).sort({ updatedAt: -1 }).limit(Math.min(50, Math.max(1, limit))).toArray().catch(() => []);
}

export async function getMissionSkillProgress(learnerId: string): Promise<MissionSkillProgress[]> {
  const progress = await getLearnerMissionProgress(learnerId, 100);
  const bySkill = new Map<MissionSkill, { attempts: number; completed: number; correct: number; hintsUsed: number; responseTime: number; responseCount: number; last: string | null }>();
  for (const mission of progress) {
    for (const evidence of mission.evidence ?? []) {
      const current = bySkill.get(evidence.skill) ?? { attempts: 0, completed: 0, correct: 0, hintsUsed: 0, responseTime: 0, responseCount: 0, last: null };
      current.attempts += evidence.attempts;
      current.completed += evidence.completed ? 1 : 0;
      current.correct += evidence.correct ? 1 : 0;
      current.hintsUsed += evidence.hintsUsed;
      current.responseTime += evidence.responseTimeMs;
      current.responseCount += 1;
      if (!current.last || evidence.timestamp > current.last) current.last = evidence.timestamp;
      bySkill.set(evidence.skill, current);
    }
  }
  return [...bySkill.entries()].map(([skill, value]) => ({
    skill, attempts: value.attempts, completed: value.completed, correct: value.correct,
    accuracyPct: value.attempts ? Math.round((value.correct / value.attempts) * 100) : 0,
    hintsUsed: value.hintsUsed,
    averageResponseTimeMs: value.responseCount ? Math.round(value.responseTime / value.responseCount) : 0,
    lastPracticedAt: value.last,
  }));
}

async function getMissionProgressForAttempt(db: Db, learnerId: string, missionId: string): Promise<LearnerMissionProgress | null> {
  return await db.collection<LearnerMissionProgress>("learnerMissionProgress").findOne({ learnerId, missionId }).catch(() => null);
}

export type { MissionStep };
