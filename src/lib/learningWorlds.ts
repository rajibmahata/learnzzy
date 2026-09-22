// Learning Worlds — scalable world architecture (spec §3).
// Each world is a *place* with its own interaction style, not just a reskin.
// Existing 6 game worlds are preserved in lib/worlds.ts; this module adds the
// adventure-world layer that the LearningAdventureEngine routes through.
// New worlds can be added by pushing one entry — no engine rewrite.

export type WorldId =
  | "colors"
  | "animals"
  | "birds"
  | "insects"
  | "nature"
  | "dinosaurs"
  | "ocean"
  | "words"
  | "numbers"
  | "thinking"
  | "creative"
  | "robots"
  | "fruits"
  | "space"
  | "stories";

export interface LearningWorld {
  id: WorldId;
  name: string;
  icon: string;
  tagline: string;
  /** Purposeful host — reuses characters.ts ids, never decorative. */
  characterId: "teddy" | "owl" | "bunny" | "monkey" | "parrot" | "puppy" | "dino" | "elephant" | "fox" | "panda" | "butterfly" | "lion";
  gradient: string;
  /** Interaction signatures that distinguish this world (spec §3). */
  mechanics: string[];
  /** Default categories that feed this world (for planner fallback). */
  categories: string[];
}

export const LEARNING_WORLDS: LearningWorld[] = [
  { id: "colors", name: "Colors", icon: "🌈", tagline: "Discover, sort and mix the rainbow!", characterId: "panda", gradient: "from-pink-200 via-violet-200 to-sky-200", mechanics: ["find-color", "sort-color", "mix-color", "memory-color", "story-color"], categories: ["discover", "think"] },
  { id: "animals", name: "Animals", icon: "🐾", tagline: "Roam the jungle and meet new friends!", characterId: "lion", gradient: "from-amber-100 via-emerald-100 to-sky-100", mechanics: ["safari", "sound-match", "habitat-match", "memory-animal", "discovery-animal"], categories: ["discover", "think"] },
  { id: "birds", name: "Birds", icon: "🐦", tagline: "Listen, find and match feathered friends!", characterId: "parrot", gradient: "from-sky-100 via-blue-50 to-indigo-100", mechanics: ["bird-discovery", "bird-sound", "nest-match", "flight-sort", "bird-memory"], categories: ["discover", "think"] },
  { id: "insects", name: "Insects & Butterflies", icon: "🦋", tagline: "From egg to butterfly — watch wonders unfold!", characterId: "butterfly", gradient: "from-lime-100 via-emerald-50 to-teal-100", mechanics: ["life-cycle", "wing-match", "insect-sort", "butterfly-memory", "pollination"], categories: ["discover", "think"] },
  { id: "nature", name: "Nature", icon: "🌳", tagline: "Explore trees, weather and seasons!", characterId: "elephant", gradient: "from-green-100 via-amber-50 to-sky-100", mechanics: ["tree-discovery", "leaf-match", "weather-sort", "season-story", "forest-explore"], categories: ["discover", "think"] },
  { id: "dinosaurs", name: "Dinosaurs", icon: "🦖", tagline: "Stomp with gentle giants!", characterId: "dino", gradient: "from-emerald-100 via-amber-100 to-orange-100", mechanics: ["dino-discovery", "dino-count", "track-match", "dino-story"], categories: ["discover", "numbers"] },
  { id: "ocean", name: "Ocean", icon: "🌊", tagline: "Dive and discover waves and creatures!", characterId: "dolphin" as LearningWorld["characterId"], gradient: "from-cyan-100 via-blue-100 to-indigo-100", mechanics: ["ocean-discovery", "wave-sort", "fish-count", "boat-discovery"], categories: ["discover", "numbers"] },
  { id: "words", name: "Words & Phonics", icon: "🔤", tagline: "Hear sounds, build words!", characterId: "parrot", gradient: "from-pink-100 via-violet-100 to-sky-100", mechanics: ["picture-word", "build-word", "word-family", "listen-choose"], categories: ["words", "write"] },
  { id: "numbers", name: "Numbers", icon: "🔢", tagline: "Count, compare and solve!", characterId: "teddy", gradient: "from-sky-200 via-amber-100 to-emerald-200", mechanics: ["visual-addition", "visual-subtraction", "count-objects", "order-numbers"], categories: ["numbers"] },
  { id: "thinking", name: "Thinking", icon: "🧠", tagline: "Remember, sort and solve!", characterId: "owl", gradient: "from-indigo-100 via-sky-100 to-emerald-100", mechanics: ["memory", "find-difference", "pattern-detective", "sequence", "sorting"], categories: ["think", "puzzles"] },
  { id: "creative", name: "Creative Studio", icon: "🎨", tagline: "Draw, build and imagine!", characterId: "bunny", gradient: "from-violet-100 via-fuchsia-100 to-pink-100", mechanics: ["draw-monster", "design-dino", "build-robot", "create-garden", "finish-picture"], categories: ["write", "shapes"] },
  { id: "robots", name: "Robots", icon: "🤖", tagline: "Build and guide friendly robots!", characterId: "puppy", gradient: "from-slate-100 via-sky-100 to-indigo-100", mechanics: ["build-robot", "repair-robot", "robot-sort", "robot-path", "sequencing"], categories: ["think", "puzzles"] },
  { id: "fruits", name: "Fruits & Food", icon: "🍎", tagline: "Sort, count and taste the rainbow!", characterId: "fox", gradient: "from-red-100 via-amber-100 to-lime-100", mechanics: ["fruit-sort", "fruit-count", "fruit-color", "fruit-memory", "basket"], categories: ["think", "numbers", "discover"] },
  { id: "space", name: "Space", icon: "🚀", tagline: "Blast off and explore stars!", characterId: "owl", gradient: "from-slate-900 via-violet-900 to-indigo-900", mechanics: ["rocket-count", "planet-discovery", "space-sort", "space-story"], categories: ["discover", "numbers"] },
  { id: "stories", name: "Stories", icon: "📖", tagline: "Choose, play and discover together!", characterId: "teddy", gradient: "from-amber-100 via-orange-50 to-pink-100", mechanics: ["interactive-story", "external-story", "story-choice", "story-count"], categories: ["discover", "words", "numbers"] },
];

export function worldForId(id: string): LearningWorld | null {
  return LEARNING_WORLDS.find((w) => w.id === id) ?? null;
}

export function validateWorlds(): string[] {
  const ids = new Set<string>();
  const problems: string[] = [];
  for (const w of LEARNING_WORLDS) {
    if (ids.has(w.id)) problems.push(`duplicate world ${w.id}`);
    ids.add(w.id);
    if (!w.name || !w.icon) problems.push(`${w.id} missing name/icon`);
    if (w.mechanics.length === 0) problems.push(`${w.id} has no mechanics`);
  }
  return problems;
}
