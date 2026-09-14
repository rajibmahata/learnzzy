// Shared game framework — deterministic, no LLM. DEC-050/051, BR-021.
export type GameLifecycle = "LOADING" | "READY" | "PLAYING" | "SUCCESS" | "RETRY" | "COMPLETED" | "ERROR";

export interface GameDefinition<TContent> {
  id: string;
  name: string;
  learningObjectives: string[];
  createRound: (seedInput: { difficulty: 1 | 2 | 3; round: number }) => TContent;
  validate: (content: TContent, answer: number) => boolean;
  correctAnswer: (content: TContent) => number;
  isComplete: (roundsPlayed: number, roundsTotal: number) => boolean;
}

export const GAME_ROUNDS = 5;

export const DIFFICULTY_RANGES = {
  1: { min: 1, max: 5 },
  2: { min: 1, max: 10 },
  3: { min: 1, max: 20 },
} as const;

// Tiny deterministic PRNG (mulberry32) so rounds are reproducible from a seed
// without any AI. Seed can come from Date.now() client-side; server re-validates.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
