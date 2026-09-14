import { z } from "zod";
import { DIFFICULTY_RANGES, mulberry32, type GameDefinition } from "./framework";

// BR-040..043 — subtraction is deterministic, non-negative: answer = start - removed.
export const SubtractionContentSchema = z.object({
  start: z.number().int().min(1).max(20),
  removed: z.number().int().min(0).max(20),
  answers: z.array(z.number().int()).min(3).max(4),
  correctAnswer: z.number().int().min(0),
});

export type SubtractionContent = z.infer<typeof SubtractionContentSchema>;

export const subtractionGame: GameDefinition<SubtractionContent> = {
  id: "subtraction",
  name: "Fly Away",
  learningObjectives: ["SUBTRACTION"],
  createRound: ({ difficulty, round }) => {
    const { min, max } = DIFFICULTY_RANGES[difficulty];
    const rand = mulberry32((Date.now() % 2147483647) + round * 917 + 7);
    const start = min + Math.floor(rand() * (max - min + 1));
    const removed = Math.floor(rand() * (start + 1)); // ensures start - removed >= 0
    const correct = start - removed;
    const set = new Set<number>([correct]);
    for (const c of [correct + 1, correct - 1, correct + 2, Math.max(0, correct - 2), start, removed]) {
      if (set.size >= 4) break;
      if (c >= 0 && c <= 20 && !set.has(c)) set.add(c);
    }
    const answers = Array.from(set);
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return SubtractionContentSchema.parse({ start, removed, answers, correctAnswer: correct });
  },
  validate: (content, answer) => answer === content.start - content.removed,
  correctAnswer: (content) => content.start - content.removed,
  isComplete: (played, total) => played >= total,
};
