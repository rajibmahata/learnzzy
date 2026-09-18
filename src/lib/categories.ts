// Learning categories — deterministic, dependency-free.
// Category is the primary navigation (spec §3/§4). Individual activities live
// inside a category; the home page never shows 30 loose cards.
// Reuses character ids from lib/characters (teddy/owl/bunny/monkey/parrot)
// and game hrefs from games/registry so existing games keep working.

export type CategoryId =
  | "numbers"
  | "words"
  | "write"
  | "think"
  | "shapes"
  | "discover"
  | "puzzles";

export interface LearningCategory {
  id: CategoryId;
  name: string;
  icon: string;
  tagline: string;
  /** Small skill words shown on the card, e.g. "Count • Compare • Solve". */
  skillsLine: string;
  /** Purposeful guide (characters.ts id) — never decorative. */
  characterId: "teddy" | "owl" | "bunny" | "monkey" | "parrot";
  gradient: string;
}

export const CATEGORIES: LearningCategory[] = [
  {
    id: "numbers",
    name: "Numbers & Math",
    icon: "🔢",
    tagline: "Count, compare, order and solve with Teddy!",
    skillsLine: "Count • Compare • Solve",
    characterId: "teddy",
    gradient: "from-sky-200 via-amber-100 to-emerald-200",
  },
  {
    id: "words",
    name: "Words & Phonics",
    icon: "🔤",
    tagline: "Hear sounds, build words with Parrot!",
    skillsLine: "Read • Listen • Build",
    characterId: "parrot",
    gradient: "from-pink-100 via-violet-100 to-sky-100",
  },
  {
    id: "write",
    name: "Write & Create",
    icon: "✏️",
    tagline: "Trace, write and draw with Bunny!",
    skillsLine: "Trace • Draw • Create",
    characterId: "bunny",
    gradient: "from-[#232a55] via-[#3b4a8a] to-[#10153a]",
  },
  {
    id: "think",
    name: "Think & Solve",
    icon: "🧠",
    tagline: "Find, match and think with Owl!",
    skillsLine: "Find • Match • Think",
    characterId: "owl",
    gradient: "from-indigo-100 via-sky-100 to-emerald-100",
  },
  {
    id: "shapes",
    name: "Shapes & Visual",
    icon: "🔷",
    tagline: "Spot shapes and patterns with Owl!",
    skillsLine: "Shapes • Count • Match",
    characterId: "owl",
    gradient: "from-violet-100 via-fuchsia-100 to-sky-100",
  },
  {
    id: "discover",
    name: "Discover",
    icon: "🌍",
    tagline: "Meet animals and nature with Parrot!",
    skillsLine: "Animals • Colors • Nature",
    characterId: "parrot",
    gradient: "from-amber-100 via-emerald-100 to-sky-100",
  },
  {
    id: "puzzles",
    name: "Puzzles",
    icon: "🧩",
    tagline: "Snap shapes and solve with Monkey!",
    skillsLine: "Snap • Match • Reason",
    characterId: "monkey",
    gradient: "from-emerald-100 via-teal-50 to-lime-100",
  },
];

export function categoryFor(id: string): LearningCategory | null {
  // "create" is the pre-7-category id for Write & Create (renamed 2026-09-18).
  const normalized = id === "create" ? "write" : id;
  return CATEGORIES.find((c) => c.id === normalized) ?? null;
}
