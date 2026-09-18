// Learning-first stories + gentle feedback — deterministic, dependency-free.
// Purpose (§3/§16/§19): every math question gets a tiny story ("Teddy has 3
// balloons, 2 more arrived — how many now?") so the child wonders "what
// happens next?" instead of staring at "3 + 2 = ?". Feedback is always
// gentle and always teaches: correct answers restate the concept
// ("Yes! 3 + 2 = 5"), retries invite another look ("Not quite — let's count
// again slowly"). E2E-compatible: praise keeps "Great job", retry keeps
// "Try again" as substrings.

import { themeNoun } from "./visualThemes";

export interface MathStory {
  /** Short story line shown above the stage, e.g. "Teddy has 3 balloons." */
  setup: string;
  /** Arrival / departure line, e.g. "2 more balloons arrived!" */
  event: string;
  /** Question line, e.g. "How many balloons does Teddy have now?" */
  question: string;
  /** Full voice line: setup + event + question, ≤200 chars. */
  voiceLine: string;
}

const ADDITION_HOSTS: Record<string, string> = {
  teddy: "Teddy",
  apple: "Bunny",
  mango: "Monkey",
  star: "Owl",
  car: "Monkey",
  fish: "Parrot",
  balloon: "Teddy",
  butterfly: "Bunny",
  puppy: "Puppy",
  rocket: "Dino",
};

/** Tiny deterministic story for an addition round. Math untouched. */
export function additionStory(a: number, b: number, themeId: string, themeEmoji: string): MathStory {
  const host = ADDITION_HOSTS[themeId] ?? "Teddy";
  const plural = themeNoun(themeId, 2);
  const one = themeNoun(themeId, 1);
  const setup = a === 1 ? `${host} has 1 ${one} ${themeEmoji}.` : `${host} has ${a} ${plural} ${themeEmoji}.`;
  const event = b === 0 ? `No more arrived this time.` : b === 1 ? `1 more ${one} arrived!` : `${b} more ${plural} arrived!`;
  const question = `How many ${plural} does ${host} have now?`;
  const voiceLine = `${setup} ${event} ${question}`.slice(0, 200);
  return { setup, event, question, voiceLine };
}

/** Tiny deterministic story for a subtraction round. */
export function subtractionStory(start: number, removed: number, themeId: string, themeEmoji: string): MathStory {
  const host = ADDITION_HOSTS[themeId] ?? "Teddy";
  const plural = themeNoun(themeId, 2);
  const setup = `${host} has ${start} ${plural} ${themeEmoji}.`;
  const event = removed === 0 ? `Nothing flew away.` : removed === 1 ? `1 ${themeNoun(themeId, 1)} flew away!` : `${removed} ${plural} flew away!`;
  const question = `How many ${plural} are left?`;
  const voiceLine = `${setup} ${event} ${question}`.slice(0, 200);
  return { setup, event, question, voiceLine };
}

/**
 * Learning-first praise: restates the math fact so voice teaches counting,
 * not just celebration. Keeps "Great job!" prefix for existing E2E/tests.
 */
export function additionPraise(a: number, b: number, themeId: string): string {
  const noun = themeNoun(themeId, a + b);
  return `Great job! ${a} + ${b} = ${a + b}. That's ${a + b} ${noun}!`;
}

export function subtractionPraise(start: number, removed: number, themeId: string): string {
  const noun = themeNoun(themeId, start - removed);
  return `Great job! ${start} − ${removed} = ${start - removed}. ${start - removed} ${noun} left!`;
}

/** Gentle retry — never shames. Keeps "Try again" for E2E. */
export function gentleRetry(kind: "count" | "look" | "default" = "default"): string {
  switch (kind) {
    case "count":
      return "Not quite. Try again — count them slowly with me.";
    case "look":
      return "Not quite. Try again — look carefully, take your time.";
    default:
      return "Not quite. Try again — let's look once more together.";
  }
}

/** Discovery praise: name + fact + apply ("You found the Parrot! Remember, parrots are birds."). */
export function discoveryPraise(name: string, fact: string): string {
  const clean = `${name}: ${fact}`;
  return `Great job! You found the ${name}! Remember — ${fact}`.slice(0, 200) || clean.slice(0, 200);
}

/** Calm thinking nudge from Owl — respects thinking time (§15). */
export function thinkingNudge(): string {
  return "Take your time. Look carefully. What do you notice?";
}
