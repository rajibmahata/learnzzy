// Balloon Mechanic — reusable across Numbers/Colors/Words/Memory.
// One mechanic, many objectives: pop N balloons, pop only RED, pop letter B, remember star.
// Deterministic, no LLM, never blocks gameplay.

import { mulberry32 } from "../games/framework.ts";

export type BalloonPayloadKind = "number" | "color" | "letter" | "reward" | "animal";
export type BalloonColor = "red" | "blue" | "yellow" | "green" | "purple" | "orange";
export interface Balloon {
  id: string;
  payload: string; // "5" | "red" | "B" | "star" | "🐱"
  payloadKind: BalloonPayloadKind;
  color: BalloonColor;
  size: number; // 1..3 (tactile target)
  speed: number; // 1..3 (float speed)
  x: number; // 0..100 vw%
  delayMs: number;
}

const COLORS: BalloonColor[] = ["red", "blue", "yellow", "green", "purple", "orange"];
const BALLOON_EMOJI: Record<BalloonColor, string> = { red: "🎈", blue: "🎈", yellow: "🎈", green: "🎈", purple: "🎈", orange: "🎈" };
export const BALLOON_COLOR_BG: Record<BalloonColor, string> = {
  red: "bg-red-400", blue: "bg-sky-400", yellow: "bg-amber-300", green: "bg-emerald-400", purple: "bg-violet-400", orange: "bg-orange-400",
};

export interface BalloonChallenge {
  prompt: string;
  targetCount?: number;
  targetColor?: BalloonColor;
  targetLetter?: string;
  targetAnimal?: string;
  targetReward?: string;
  balloons: Balloon[];
}

export function generateBalloons(opts: {
  payloadKind: BalloonPayloadKind;
  count: number;
  targetCount?: number;
  targetColor?: BalloonColor;
  targetLetter?: string;
  targetAnimal?: string;
  difficulty: 1 | 2 | 3;
  seed: string;
}): BalloonChallenge {
  const rand = mulberry32(hashSeed(opts.seed));
  const balloons: Balloon[] = [];
  const total = Math.max(opts.count, opts.targetCount ?? 0);
  for (let i = 0; i < total + (opts.difficulty === 3 ? 3 : opts.difficulty === 2 ? 2 : 1); i++) {
    const color = COLORS[Math.floor(rand() * COLORS.length)]!;
    const size = opts.difficulty === 1 ? 2 + (rand() > 0.5 ? 0.2 : -0.2) : 1 + Math.floor(rand() * 3);
    const speed = 1 + Math.floor(rand() * 3);
    const x = 5 + Math.floor(rand() * 85);
    const delayMs = Math.floor(rand() * 800);
    let payload: string;
    let kind: BalloonPayloadKind = opts.payloadKind;
    const ANIMALS = ["🐱", "🐶", "🐰", "🦁", "🐼", "🐸", "🐵", "🐯"] as const;
    if (kind === "number") payload = String(Math.floor(rand() * 9) + 1);
    else if (kind === "color") payload = color;
    else if (kind === "letter") payload = String.fromCharCode(65 + Math.floor(rand() * 26));
    else if (kind === "animal") payload = ANIMALS[Math.floor(rand() * ANIMALS.length)]!;
    else payload = "⭐";
    balloons.push({ id: `balloon-${i}-${opts.seed}`, payload, payloadKind: kind, color, size, speed, x, delayMs });
  }
  // Ensure target exists
  if (opts.targetColor) {
    const has = balloons.some((b) => b.color === opts.targetColor);
    if (!has && balloons[0]) balloons[0]!.color = opts.targetColor;
  }
  if (opts.targetLetter) {
    const has = balloons.some((b) => b.payload === opts.targetLetter);
    if (!has && balloons[0]) balloons[0]!.payload = opts.targetLetter;
  }
  if (opts.targetAnimal) {
    const has = balloons.some((b) => b.payload === opts.targetAnimal);
    if (!has && balloons[0]) balloons[0]!.payload = opts.targetAnimal;
  }
  const prompt =
    opts.payloadKind === "number" && opts.targetCount ? `Pop ${opts.targetCount} balloons!` :
    opts.payloadKind === "color" && opts.targetColor ? `Pop only ${opts.targetColor.toUpperCase()} balloons!` :
    opts.payloadKind === "letter" && opts.targetLetter ? `Pop the letter ${opts.targetLetter}!` :
    opts.payloadKind === "animal" && opts.targetAnimal ? `Find the ${opts.targetAnimal} — pop its balloon!` :
    `Pop ${opts.count} balloons!`;

  return { prompt, targetCount: opts.targetCount, targetColor: opts.targetColor, targetLetter: opts.targetLetter, targetAnimal: opts.targetAnimal, balloons: shuffleWithRand(balloons, rand) };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function shuffleWithRand<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i]!; out[i] = out[j]!; out[j] = tmp;
  }
  return out;
}

export function validateBalloonPop(challenge: BalloonChallenge, popped: Balloon[]): { correct: boolean; expected: number; got: number } {
  if (challenge.targetCount !== undefined) {
    return { correct: popped.length === challenge.targetCount, expected: challenge.targetCount, got: popped.length };
  }
  if (challenge.targetColor) {
    const ok = popped.every((b) => b.color === challenge.targetColor) && popped.length > 0;
    return { correct: ok, expected: 1, got: ok ? 1 : 0 };
  }
  if (challenge.targetLetter) {
    const ok = popped.some((b) => b.payload === challenge.targetLetter);
    return { correct: ok, expected: 1, got: ok ? 1 : 0 };
  }
  if (challenge.targetAnimal) {
    const ok = popped.some((b) => b.payload === challenge.targetAnimal);
    return { correct: ok, expected: 1, got: ok ? 1 : 0 };
  }
  return { correct: popped.length > 0, expected: 1, got: popped.length };
}

export function balloonForTheme(theme: string, seed: string): BalloonChallenge {
  // Theme-aware helper: numbers for math, colors for color world, letters for words, animals for animal world
  if (theme === "colors") return generateBalloons({ payloadKind: "color", count: 4, targetColor: "red", difficulty: 1, seed });
  if (theme === "words") return generateBalloons({ payloadKind: "letter", count: 4, targetLetter: "B", difficulty: 1, seed });
  if (theme === "animals") return generateBalloons({ payloadKind: "animal", count: 5, targetAnimal: "🐱", difficulty: 1, seed });
  return generateBalloons({ payloadKind: "number", count: 5, targetCount: 5, difficulty: 1, seed });
}
