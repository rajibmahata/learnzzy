// Cartoon character system — deterministic, dependency-free, testable.
// Characters are playful friends with a purpose (never decoration): each one
// guides a specific kind of learning. Emoji visuals keep every state
// offline, license-clean, and consistent with the existing Learnzzy idiom.
// States follow §8: idle/happy/thinking/curious/encouraging/celebrating/
// explaining/surprised. Voice presets live in lib/audio CHARACTER_VOICES;
// this module only maps character → game/state/line (pure, no I/O).

export type CharacterId =
  | "teddy"
  | "bunny"
  | "owl"
  | "monkey"
  | "parrot"
  | "puppy"
  | "dino"
  | "elephant";

export type CharacterState =
  | "idle"
  | "happy"
  | "thinking"
  | "curious"
  | "encouraging"
  | "celebrating"
  | "explaining"
  | "surprised";

export interface CharacterDef {
  id: CharacterId;
  emoji: string;
  name: string;
  role: string;
  games: string[];
}

export const CHARACTERS: CharacterDef[] = [
  { id: "teddy", emoji: "🧸", name: "Teddy", role: "Math companion", games: ["addition", "subtraction"] },
  { id: "bunny", emoji: "🐰", name: "Bunny", role: "Creative activities", games: ["sketch"] },
  { id: "owl", emoji: "🦉", name: "Owl", role: "Thinking and learning guide", games: ["puzzle", "clean-up"] },
  { id: "monkey", emoji: "🐵", name: "Monkey", role: "Playful encouragement", games: ["addition", "subtraction", "discover"] },
  { id: "parrot", emoji: "🦜", name: "Parrot", role: "Vocabulary and discovery", games: ["discover"] },
  { id: "puppy", emoji: "🐶", name: "Puppy", role: "Sorting and clean-up", games: ["clean-up"] },
  { id: "dino", emoji: "🦕", name: "Dino", role: "Puzzle and discovery", games: ["puzzle", "discover"] },
  { id: "elephant", emoji: "🐘", name: "Elephant", role: "Magic and creative discovery", games: ["sketch", "discover"] },
];

const byId = new Map< string, CharacterDef>(CHARACTERS.map((c) => [c.id, c]));

export function getCharacterDef(id: string): CharacterDef {
  return byId.get(id) ?? byId.get("teddy")!;
}

/** Coerce an unknown id (e.g. plan characterId) to a valid CharacterId. */
export function asCharacterId(id: string | undefined | null, fallback: CharacterId = "teddy"): CharacterId {
  return (byId.has(String(id)) ? String(id) : fallback) as CharacterId;
}

/** Purposeful guide per game (spec §7). Unknown games fall back to Teddy. */
export function characterForGame(gameId: string): CharacterId {
  switch (gameId) {
    case "addition":
    case "subtraction":
      return "teddy";
    case "clean-up":
      return "puppy";
    case "puzzle":
      return "dino";
    case "sketch":
      return "bunny";
    case "discover":
      return "parrot";
    default:
      return "teddy";
  }
}

export type FeedbackKind = "idle" | "correct" | "retry" | "good";

/**
 * Interaction → character state (§8). Done always celebrates; a correct
 * answer is happy; a miss is encouraging (never judgment); an open question
 * is thinking; drawing/tracing is curious.
 */
export function stateForMoment(args: { done?: boolean; feedback?: FeedbackKind; tracing?: boolean }): CharacterState {
  if (args.done) return "celebrating";
  if (args.feedback === "correct" || args.feedback === "good") return "happy";
  if (args.feedback === "retry") return "encouraging";
  if (args.tracing) return "curious";
  return "thinking";
}

const STATE_LINES: Record<CharacterState, string> = {
  idle: "Shall we try this one?",
  happy: "Wonderful. You got it.",
  thinking: "Take your time. Look carefully.",
  curious: "What do you notice?",
  encouraging: "Not quite. Let's look carefully.",
  celebrating: "Nice thinking.",
  explaining: "Let's try together. Watch first.",
  surprised: "Wonderful. You noticed something new.",
};

/** Short useful line for the state (supplements the game instruction, never replaces it). */
export function lineForState(state: CharacterState): string {
  return STATE_LINES[state] ?? STATE_LINES.idle;
}

/** Screen-reader label: character name + state + purpose. */
export function ariaLabelFor(characterId: string, state: CharacterState): string {
  const c = getCharacterDef(characterId);
  return `${c.name}, ${c.role}, feeling ${state}`;
}
