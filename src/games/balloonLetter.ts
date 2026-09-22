// Balloon Letter Burst — typing letters to pop balloons (Words & Phonics).
// Deterministic, no LLM, age-appropriate. For 4-5, target is single uppercase letter;
// for 6-7/8-9, target is word-family initial or short word via balloons.

import { generateBalloons, validateBalloonPop, type Balloon } from "../lib/balloonMechanic.ts";
import { WORD_FAMILY_DATA, WORD_RIMES } from "../lib/words.ts";

export interface BalloonLetterRound {
  targetLetter: string;
  targetWord?: string;
  balloons: Balloon[];
  correctPayload: string;
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
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function createBalloonLetterRound(seed: string, ageBand: "4-5" | "6-7" | "8-9", round: number): BalloonLetterRound {
  const rng = mulberry32(hashSeed(`${seed}:${round}`));
  // 4-5: single letter A-Z (uppercase, large target)
  // 6-7: target is initial of a word family word
  // 8-9: target is short word initial, with more distractors
  if (ageBand === "4-5") {
    const letter = String.fromCharCode(65 + Math.floor(rng() * 26));
    const ch = generateBalloons({ payloadKind: "letter", count: 6, targetLetter: letter, difficulty: 1, seed: `${seed}:${round}` });
    return { targetLetter: letter, balloons: ch.balloons, correctPayload: letter };
  }
  // Use word family for context
  const rimes = WORD_RIMES;
  const rime = rimes[Math.floor(rng() * rimes.length)]!;
  const words = WORD_FAMILY_DATA[rime]!;
  const word = words[Math.floor(rng() * words.length)]!.word;
  const letter = word[0]!.toUpperCase();
  const diff = ageBand === "8-9" ? 3 : 2;
  const ch = generateBalloons({ payloadKind: "letter", count: 7, targetLetter: letter, difficulty: diff, seed: `${seed}:${round}` });
  return { targetLetter: letter, targetWord: word, balloons: ch.balloons, correctPayload: letter };
}

export function validateBalloonLetter(round: BalloonLetterRound, poppedPayload: string): boolean {
  return poppedPayload.toUpperCase() === round.targetLetter.toUpperCase();
}
