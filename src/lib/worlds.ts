// Living Wonder Worlds metadata — deterministic, dependency-free, testable.
// Presentation facts for the Stitch-grounded world selector (screens
// e738ae27…): each game is a *place* with a scene banner, a host character,
// and a spark badge. Game ids/hrefs/levels/locking live in games/registry;
// this module only describes how a world looks. Scene art paths reference
// optimized Stitch-fetched postcards in public/assets/learnzzy/games/.

export interface WorldMeta {
  gameId: string;
  /** Big place name, e.g. "Number Orchard". */
  world: string;
  /** Banner tag pill, e.g. "🍎 Math Island". */
  islandTag: string;
  /** Host pill, e.g. "🧸 Teddy Bear Host". */
  host: string;
  /** Top-right spark badge, e.g. "+1+2 Sparks". */
  spark: string;
  /** Inviting one-liner under the banner. */
  tagline: string;
  /** Banner gradient when no scene art exists. */
  gradient: string;
  /** Dark (night) card treatment, e.g. Starlight Sketch. */
  dark?: boolean;
}

export const WORLDS: WorldMeta[] = [
  {
    gameId: "addition",
    world: "Number Orchard",
    islandTag: "🍎 Math Island",
    host: "🧸 Teddy Host",
    spark: "⭐ +2 Sparks",
    tagline: "Pick juicy counting apples, feed hungry critters, and master early numbers 1 to 20!",
    gradient: "from-sky-200 via-amber-100 to-emerald-200",
  },
  {
    gameId: "subtraction",
    world: "Breeze Valley",
    islandTag: "🐦 Subtraction Joy",
    host: "🐰 Bella Bunny Host",
    spark: "⭐ -1 Fly Away!",
    tagline: "Watch feathered bluebirds leap into soft clouds and grasp physical subtraction with pure smile power.",
    gradient: "from-[#d9f0ff] via-[#fff6f0] to-[#e8f5ff]",
  },
  {
    gameId: "clean-up",
    world: "Playroom Adventure",
    islandTag: "🐶 Tidy Playroom",
    host: "🐾 Pip the Puppy Host",
    spark: "⭐ +1 Star",
    tagline: "Sort wooden blocks, crayons, and cars into tactile woven baskets with cheerful pup Pip!",
    gradient: "from-amber-100 via-orange-50 to-yellow-100",
  },
  {
    gameId: "puzzle",
    world: "Dino Discovery",
    islandTag: "🦖 Logic & Shapes",
    host: "🦉 Prof. Hoot Host",
    spark: "⭐ Snap & Match",
    tagline: "Snap chunky wooden pieces into place to hatch friendly baby brachiosaurs and stegos!",
    gradient: "from-emerald-100 via-teal-50 to-lime-100",
  },
  {
    gameId: "sketch",
    world: "Starlight Sketch",
    islandTag: "✨ Motor Glow Tracing",
    host: "🐘 Ellie Host",
    spark: "⭐ Rainbow Dust",
    tagline: "Trace glowing neon constellations with gentle finger sweeps to unlock calming phonics chords.",
    gradient: "from-[#232a55] via-[#3b4a8a] to-[#10153a]",
    dark: true,
  },
  {
    gameId: "discover",
    world: "Animal Safari World",
    islandTag: "🌈 Discovery Safari",
    host: "🦜 Parrot Host",
    spark: "⭐ New Friends",
    tagline: "Meet friendly jungle creatures, mimic acoustic animal calls, and learn rainbow habitat science!",
    gradient: "from-pink-100 via-violet-100 to-sky-100",
  },
];

/** Optimized Stitch-fetched scene postcards (WebP/JPG, ~40–110KB, lazy-loaded) — 3D images for every world. */
const WORLD_ART: Record<string, string> = {
  addition: "/images/stitch/number-orchard.jpg",
  subtraction: "/images/stitch/breeze-valley.jpg",
  "clean-up": "/assets/learnzzy/games/clean-up/scene.webp",
  puzzle: "/assets/learnzzy/games/puzzle/scene.webp",
  sketch: "/assets/learnzzy/games/sketch/scene.webp",
  discover: "/images/stitch/level-island-map.png",
};

/** Scene art for a world, or null when the world uses a gradient scene. */
export function artForGame(gameId: string): string | null {
  return WORLD_ART[gameId] ?? null;
}

export function worldForGame(gameId: string): WorldMeta | null {
  return WORLDS.find((w) => w.gameId === gameId) ?? null;
}
