// Learnzzy companion reactions — deterministic, dependency-free, testable.
// A real friend reacts differently each time: wording, expression, delivery,
// and effects all rotate WITHOUT any LLM or network in the gameplay path.
//
// Rotation rule: index = (hash(character + salt) + count) % pool — consecutive
// successes never repeat within a pool cycle, and the same count always gives
// the same reaction (replays, tests, and offline all agree). Voice drift stays
// inside the calm bounds (rate 0.80–0.90, pitch 0.95–1.06): warm, soft,
// playful, encouraging — never loud or game-show-like.

import { asCharacterId, type CharacterId, type CharacterState } from "./characters.ts";
import { voiceFor } from "./audio.ts";

export type PraiseMoment = "placement" | "round" | "celebration";

export interface CompanionReaction {
  line: string;
  state: CharacterState;
  rate: number;
  pitch: number;
  /** Visual effect to show with the reaction (rendered by existing UI). */
  effect: "balloons" | "none";
}

const PLACEMENT_LINES = [
  "Yes! ✨",
  "You found it! 🌟",
  "Perfect fit! 💫",
  "Right there! 🎉",
  "So clever! ✨",
  "You did it! 🌈",
];

const ROUND_LINES = [
  "Wow! You did it! ✨",
  "So clever! 🌟",
  "You found it! 💫",
  "Wonderful, my friend! 🎉",
  "You're amazing! 🌈",
  "Stars for you! ⭐",
];

const CELEBRATION_LINES = [
  "Wow! You did something wonderful! ✨",
  "Your friend is so proud of you! 🌟",
  "What a magical adventure! 💫",
  "You sparkle like a star! ⭐",
];

function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** The child's primary learning friend (onboarding companion), else fallback. */
export function primaryCompanionId(
  profile: { companion?: { characterId?: string } | null } | null | undefined,
  fallback: CharacterId = "teddy"
): CharacterId {
  return asCharacterId(profile?.companion?.characterId, fallback);
}

export function praiseFor(opts: {
  characterId: string;
  moment: PraiseMoment;
  /** Success counter (placements, rounds, completions) — drives rotation. */
  count: number;
  /** Stable distinguisher per game/mission/round so cycles differ by context. */
  salt?: string;
}): CompanionReaction {
  const character = asCharacterId(opts.characterId);
  const count = Math.max(0, Math.floor(opts.count) || 0);
  const pool = opts.moment === "placement" ? PLACEMENT_LINES : opts.moment === "round" ? ROUND_LINES : CELEBRATION_LINES;
  const index = (hashSeed(`${character}:${opts.salt ?? "play"}`) + count) % pool.length;
  const line = pool[index]!;
  const state: CharacterState =
    opts.moment === "placement" ? (count % 5 === 4 ? "surprised" : "happy") : "celebrating";
  const base = voiceFor(character);
  // Child-friendly drift: each success sounds a little different — same count
  // always gives the same delivery, but now more playful and varied.
  // Rate and pitch vary gently within child-friendly bounds.
  const rate = clamp(base.rate + ((count % 4) - 1.5) * 0.025, 0.82, 0.99);
  const pitch = clamp(base.pitch + ((count % 5) - 2) * 0.04, 1.05, 1.28);
  const effect: "balloons" | "none" =
    opts.moment === "placement" ? (count % 4 === 3 ? "balloons" : "none") : "balloons";
  return { line, state, rate, pitch, effect };
}
