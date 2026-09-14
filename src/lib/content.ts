import { z } from "zod";

// Content lifecycle: draft → validating → approved → active (+ rejected/disabled).
// Only `active` is playable (DEC-072 / BR-090). Harmonized single enum.
export const ContentStatusSchema = z.enum([
  "draft",
  "validating",
  "approved",
  "active",
  "rejected",
  "disabled",
]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ContentDocSchema = z.object({
  contentId: z.string().min(1).max(100),
  gameId: z.string().min(1).max(50),
  difficulty: z.enum(["easy", "medium", "hard"]),
  contentType: z.string().min(1).max(50),
  status: ContentStatusSchema,
  version: z.number().int().min(1),
  source: z.enum(["seed", "deterministic", "agent", "admin"]),
  validation: z.object({
    schema: z.boolean(),
    deterministic: z.boolean(),
    quality: z.boolean(),
    safety: z.boolean(),
  }),
  payload: z.record(z.unknown()),
  assetIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  usage: z
    .object({
      shown: z.number().int().min(0),
      completed: z.number().int().min(0),
      correct: z.number().int().min(0),
      incorrect: z.number().int().min(0),
    })
    .default({ shown: 0, completed: 0, correct: 0, incorrect: 0 }),
});

export type ContentDoc = z.infer<typeof ContentDocSchema>;

export function isPlayable(doc: { status: string }): boolean {
  return doc.status === "active";
}

// Pool thresholds — configurable, not hard-coded (BR-091/092, DEC-073).
export const CONTENT_POOLS = {
  addition: { minimum: 30, target: 100, batch: 50 },
  subtraction: { minimum: 30, target: 100, batch: 50 },
  "clean-up": { minimum: 10, target: 30, batch: 15 },
  puzzle: { minimum: 10, target: 30, batch: 15 },
  sketch: { minimum: 10, target: 30, batch: 15 },
} as const;

export type GamePoolKey = keyof typeof CONTENT_POOLS;

// Deterministic payload validators — math is authoritative (DEC-051).
export function validateAdditionPayload(p: Record<string, unknown>): boolean {
  const { a, b, correctAnswer, answerOptions } = p as {
    a: number;
    b: number;
    correctAnswer: number;
    answerOptions: number[];
  };
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (correctAnswer !== a + b) return false;
  if (!Array.isArray(answerOptions) || new Set(answerOptions).size !== answerOptions.length)
    return false;
  return answerOptions.filter((x) => x === correctAnswer).length === 1;
}

export function validateSubtractionPayload(p: Record<string, unknown>): boolean {
  const { startCount, removedCount, correctAnswer, answerOptions } = p as {
    startCount: number;
    removedCount: number;
    correctAnswer: number;
    answerOptions: number[];
  };
  if (!Number.isInteger(startCount) || !Number.isInteger(removedCount)) return false;
  if (removedCount > startCount) return false; // BR-040 non-negative
  if (correctAnswer !== startCount - removedCount) return false;
  if (!Array.isArray(answerOptions) || new Set(answerOptions).size !== answerOptions.length)
    return false;
  return answerOptions.filter((x) => x === correctAnswer).length === 1;
}
