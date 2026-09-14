import { getDb } from "@/db/mongodb";
import type { AgeBand } from "./learners";

export interface LevelDoc {
  level: number; // 1..5
  ageBand: AgeBand;
  config: {
    maxOperand: number;
    pieceCount: number; // for puzzle
    targets: number; // for clean-up
    tolerance: number; // for sketch 0..1
    rounds: number;
  };
  isActive: boolean;
  updatedAt: Date;
  createdAt: Date;
}

// Configurable thresholds - not hard-coded in game code. Admin can tune via systemSettings or levels collection.
export const DEFAULT_LEVELS: Array<{ level: number; ageBand: AgeBand; config: LevelDoc["config"] }> = [
  // 4-5 : gentle progression
  { level: 1, ageBand: "4-5", config: { maxOperand: 5, pieceCount: 4, targets: 3, tolerance: 18, rounds: 5 } },
  { level: 2, ageBand: "4-5", config: { maxOperand: 7, pieceCount: 4, targets: 4, tolerance: 16, rounds: 5 } },
  { level: 3, ageBand: "4-5", config: { maxOperand: 10, pieceCount: 6, targets: 4, tolerance: 14, rounds: 5 } },
  { level: 4, ageBand: "4-5", config: { maxOperand: 12, pieceCount: 6, targets: 5, tolerance: 12, rounds: 5 } },
  { level: 5, ageBand: "4-5", config: { maxOperand: 15, pieceCount: 9, targets: 5, tolerance: 10, rounds: 5 } },
  // 6-7
  { level: 1, ageBand: "6-7", config: { maxOperand: 5, pieceCount: 4, targets: 3, tolerance: 16, rounds: 5 } },
  { level: 2, ageBand: "6-7", config: { maxOperand: 10, pieceCount: 6, targets: 4, tolerance: 14, rounds: 5 } },
  { level: 3, ageBand: "6-7", config: { maxOperand: 15, pieceCount: 6, targets: 5, tolerance: 12, rounds: 5 } },
  { level: 4, ageBand: "6-7", config: { maxOperand: 20, pieceCount: 9, targets: 6, tolerance: 10, rounds: 5 } },
  { level: 5, ageBand: "6-7", config: { maxOperand: 25, pieceCount: 9, targets: 6, tolerance: 9, rounds: 5 } },
  // 8-9
  { level: 1, ageBand: "8-9", config: { maxOperand: 10, pieceCount: 4, targets: 3, tolerance: 14, rounds: 5 } },
  { level: 2, ageBand: "8-9", config: { maxOperand: 15, pieceCount: 6, targets: 4, tolerance: 12, rounds: 5 } },
  { level: 3, ageBand: "8-9", config: { maxOperand: 20, pieceCount: 9, targets: 5, tolerance: 10, rounds: 5 } },
  { level: 4, ageBand: "8-9", config: { maxOperand: 30, pieceCount: 9, targets: 6, tolerance: 9, rounds: 5 } },
  { level: 5, ageBand: "8-9", config: { maxOperand: 40, pieceCount: 9, targets: 6, tolerance: 8, rounds: 5 } },
];

export async function getLevelConfig(level: number, ageBand: AgeBand): Promise<LevelDoc["config"] | null> {
  const db = await getDb().catch(() => null);
  if (!db) {
    const f = DEFAULT_LEVELS.find((l) => l.level === level && l.ageBand === ageBand);
    return f?.config ?? null;
  }
  const doc = await db.collection<LevelDoc>("levels").findOne({ level, ageBand, isActive: true }).catch(() => null);
  if (doc) return doc.config;
  const f = DEFAULT_LEVELS.find((l) => l.level === level && l.ageBand === ageBand);
  return f?.config ?? null;
}

export async function listLevels(): Promise<LevelDoc[]> {
  const db = await getDb().catch(() => null);
  if (!db) return DEFAULT_LEVELS.map((l) => ({ ...l, isActive: true, createdAt: new Date(), updatedAt: new Date() } as LevelDoc));
  const docs = await db.collection<LevelDoc>("levels").find({ isActive: true }).sort({ ageBand: 1, level: 1 }).toArray().catch(() => []);
  if (docs.length === 0) return DEFAULT_LEVELS.map((l) => ({ ...l, isActive: true, createdAt: new Date(), updatedAt: new Date() } as LevelDoc));
  return docs as LevelDoc[];
}

export async function seedLevels(): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  for (const l of DEFAULT_LEVELS) {
    await db.collection("levels").updateOne(
      { level: l.level, ageBand: l.ageBand },
      { $set: { level: l.level, ageBand: l.ageBand, config: l.config, isActive: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    ).catch(() => null);
  }
}
