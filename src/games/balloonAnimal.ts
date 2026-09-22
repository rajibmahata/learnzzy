// Balloon Animal Burst — find cat among animals, burst, learn CAT word.
// Reuses balloonMechanic with animal payload.

import { generateBalloons, type Balloon } from "../lib/balloonMechanic.ts";

export interface BalloonAnimalRound {
  targetAnimal: string; // "🐱"
  targetWord: string; // "CAT"
  balloons: Balloon[];
}

const ANIMALS = ["🐱", "🐶", "🐰", "🦁", "🐼", "🐸"] as const;
const ANIMAL_WORD: Record<string, string> = { "🐱": "CAT", "🐶": "DOG", "🐰": "RABBIT", "🦁": "LION", "🐼": "PANDA", "🐸": "FROG" };

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createBalloonAnimalRound(seed: string, ageBand: "4-5" | "6-7" | "8-9", round: number): BalloonAnimalRound {
  const rng = mulberry32(hashSeed(`${seed}:${round}`));
  // Always cat for word learning, but variety for older kids
  const target = ageBand === "4-5" ? "🐱" : (["🐱", "🐶", "🐰"][Math.floor(rng() * 3)] as string);
  const diff = ageBand === "8-9" ? 3 : ageBand === "6-7" ? 2 : 1;
  const ch = generateBalloons({ payloadKind: "animal", count: 6, targetAnimal: target, difficulty: diff, seed: `${seed}:${round}` });
  return { targetAnimal: target, targetWord: ANIMAL_WORD[target] ?? target, balloons: ch.balloons };
}

export function validateBalloonAnimal(round: BalloonAnimalRound, payload: string): boolean {
  return payload === round.targetAnimal;
}
