// Difficulty mapping — resolves doc drift: numeric levels (gameplay) <->
// string easy|medium|hard (storage). Levels 4+ clamp to hard for pool keys,
// while gameplay complexity continues to use LevelDoc.maxOperand (levels.ts).
export const LEVEL_TO_DIFFICULTY = { 1: "easy", 2: "medium", 3: "hard" } as const;
export const DIFFICULTY_TO_LEVEL = { easy: 1, medium: 2, hard: 3 } as const;

export type DifficultyName = keyof typeof DIFFICULTY_TO_LEVEL;
export type DifficultyLevel = keyof typeof LEVEL_TO_DIFFICULTY;

/** Storage bucket for a gameplay level. 1→easy, 2→medium, 3+→hard. */
export function levelToDifficulty(level: number): DifficultyName {
  if (level >= 3) return "hard";
  if (level === 2) return "medium";
  return "easy";
}

export function difficultyToLevel(name: string): DifficultyLevel {
  if (name === "medium") return 2;
  if (name === "hard") return 3;
  return 1;
}
