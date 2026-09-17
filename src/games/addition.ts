import { z } from "zod";
import { DIFFICULTY_RANGES, mulberry32, type GameDefinition } from "./framework.ts";

// BR-030..033 — addition is deterministic: correctAnswer = a + b.
export const AdditionContentSchema = z.object({
  a: z.number().int().min(0).max(40),
  b: z.number().int().min(0).max(40),
  answers: z.array(z.number().int()).min(3).max(4),
  correctAnswer: z.number().int(),
});

export type AdditionContent = z.infer<typeof AdditionContentSchema>;

export function buildAnswers(a: number, b: number, rand: () => number): number[] {
  const correct = a + b;
  const set = new Set<number>([correct]);
  // Plausible distractors: ±1, ±2, off-by-one operand — deterministic, no duplicates.
  const candidates = [correct + 1, correct - 1, correct + 2, correct - 2, a + b + 10, Math.max(0, correct - 3)];
  for (const c of candidates) {
    if (set.size >= 4) break;
    if (c >= 0 && c <= 40 && !set.has(c)) set.add(c);
  }
  const arr = Array.from(set);
  // Deterministic Fisher–Yates with seeded rand.
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Short, rotating instructions/hints derived deterministically from the
// operands — copy varies per round without any pool/model change.
const ADD_INSTRUCTIONS = [
  "How many altogether?",
  "Count them all together!",
  "Add them up — how many?",
] as const;

export function addInstruction(a: number, b: number): string {
  return ADD_INSTRUCTIONS[(a + b) % ADD_INSTRUCTIONS.length];
}

export function addHint(a: number, b: number): string {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (lo === 0) return `Just count ${hi}.`;
  return `Start at ${hi} and count ${lo} more.`;
}

export const additionGame: GameDefinition<AdditionContent> = {
  id: "addition",
  name: "Number Adventure",
  learningObjectives: ["COUNTING", "ADDITION"],
  createRound: ({ difficulty, round }) => {
    const { min, max } = DIFFICULTY_RANGES[difficulty];
    const rand = mulberry32(Date.now() % 2147483647 + round * 101);
    const a = min + Math.floor(rand() * (max - min + 1));
    const b = min + Math.floor(rand() * (max - min + 1));
    const answers = buildAnswers(a, b, rand);
    const content = { a, b, answers, correctAnswer: a + b };
    // Never trust generation — validate before returning.
    return AdditionContentSchema.parse(content);
  },
  validate: (content, answer) => answer === content.a + content.b,
  correctAnswer: (content) => content.a + content.b,
  isComplete: (played, total) => played >= total,
};
