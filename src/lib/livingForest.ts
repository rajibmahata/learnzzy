import type { StickerDef } from "./stickers";

// Sticker → Living Creature mapping — additive, extensible, deterministic.
// Every sticker earned becomes a living entity in the child's personal forest.

export type Habitat = "forest" | "canopy" | "flower-garden" | "pond" | "meadow" | "deep-forest" | "rock-area" | "magical-clearing";
export type MovementType = "walk" | "fly" | "flutter" | "hop" | "swim" | "crawl";
export type CreatureState = "IDLE" | "WALKING" | "FLYING" | "HOPPING" | "RESTING" | "LOOKING" | "DRINKING" | "PLAYING";

export interface StickerCreatureMapping {
  stickerId: string;
  species: string;
  displayName: string;
  category: StickerDef["category"];
  habitat: Habitat;
  movement: MovementType;
  rarity: StickerDef["rarity"];
  emoji: string;
}

const HABITAT_BY_CATEGORY: Record<StickerDef["category"], Habitat> = {
  animals: "forest",
  flowers: "flower-garden",
  nature: "meadow",
  food: "forest",
  space: "magical-clearing",
  transport: "forest",
  fantasy: "deep-forest",
  discovery: "meadow",
};

// Species-specific habitat overrides for forest richness
const HABITAT_OVERRIDE: Record<string, Habitat> = {
  bird: "canopy",
  butterfly: "flower-garden",
  penguin: "pond",
  dolphin: "pond",
  bear: "forest",
  rabbit: "meadow",
  monkey: "canopy",
  frog: "pond", // if added later
  rex: "deep-forest",
  dragon: "deep-forest",
  unicorn: "magical-clearing",
  tree: "forest",
  rainbow: "meadow",
};

const MOVEMENT_BY_HABITAT: Record<Habitat, MovementType> = {
  forest: "walk",
  canopy: "fly",
  "flower-garden": "flutter",
  pond: "swim",
  meadow: "hop",
  "deep-forest": "walk",
  "rock-area": "crawl",
  "magical-clearing": "fly",
};

export function stickerToCreature(sticker: StickerDef): StickerCreatureMapping {
  const habitat = HABITAT_OVERRIDE[sticker.id] ?? HABITAT_BY_CATEGORY[sticker.category] ?? "forest";
  const movement = MOVEMENT_BY_HABITAT[habitat] ?? "walk";
  return {
    stickerId: sticker.id,
    species: sticker.id,
    displayName: sticker.name,
    category: sticker.category,
    habitat,
    movement,
    rarity: sticker.rarity,
    emoji: sticker.emoji,
  };
}

export interface LivingCreature extends StickerCreatureMapping {
  learnerId: string;
  stickerId: string;
  unlockedAt: string;
  state: CreatureState;
  x: number; // 0..100 %
  y: number;
  direction: 1 | -1;
  favorite?: boolean;
}

// Deterministic behavior — no random, seed = learnerId + stickerId
export function initialCreatureState(learnerId: string, stickerId: string): CreatureState {
  const seed = hashSeed(`${learnerId}:${stickerId}`);
  const states: CreatureState[] = ["IDLE", "WALKING", "LOOKING", "RESTING"];
  return states[seed % states.length]!;
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// --- Living Forest World upgrade (additive) ---
// Depth scale: distant 0.55 → foreground 1.1, smooth interpolation by y%.
export function depthScaleFor(y: number): number {
  const clamped = Math.max(0, Math.min(100, y));
  return 0.55 + (clamped / 100) * 0.55;
}

// Expand a single unlocked rabbit into a small population with individual variation.
// Deterministic per learner so forest is stable across visits.
export function expandRabbitPopulation(base: LivingCreature, learnerId: string): LivingCreature[] {
  if (base.species !== "rabbit") return [base];
  const variants: LivingCreature[] = [];
  for (let i = 0; i < 3; i++) {
    const seed = hashSeed(`${learnerId}:rabbit:${i}`);
    variants.push({
      ...base,
      stickerId: i === 0 ? base.stickerId : `${base.stickerId}#cub${i}`,
      displayName: i === 0 ? base.displayName : `${base.displayName} ${i + 1}`,
      x: 8 + (seed % 80),
      y: 62 + (seed % 22),
      direction: (seed % 2 ? 1 : -1) as 1 | -1,
      state: (["HOPPING", "IDLE", "LOOKING"] as CreatureState[])[seed % 3]!,
    });
  }
  return variants;
}

export type FlockBirdState = "FLYING" | "CIRCLING" | "LANDING" | "PERCHED" | "HOPPING" | "LOOKING" | "TAKING_OFF" | "DISAPPEARING" | "RETURNING";

export interface FlockBird {
  id: string;
  x: number;
  y: number;
  vx: number;
  state: FlockBirdState;
  timer: number;
  size: number;
}

export type AmbientEventKind =
  | "rabbit-cross"
  | "bird-flock"
  | "butterfly-pass"
  | "squirrel-branch"
  | "deer-distant"
  | "leaves-wind"
  | "fish-jump"
  | "fireflies"
  | "rainbow";

export type WowMomentKind = "butterfly-swarm" | "bird-wave" | "rainbow" | "firefly-wave" | "pond-splash" | "dino-cross";


// Forest progression — environment unlocks as child learns
export function forestLevel(stickerCount: number): { level: number; title: string; unlockedHabitats: Habitat[] } {
  if (stickerCount >= 10) return { level: 4, title: "Enchanted Forest", unlockedHabitats: ["forest", "canopy", "flower-garden", "pond", "deep-forest", "magical-clearing"] };
  if (stickerCount >= 5) return { level: 3, title: "Growing Grove", unlockedHabitats: ["forest", "canopy", "flower-garden", "pond"] };
  if (stickerCount >= 3) return { level: 2, title: "Flower Meadow", unlockedHabitats: ["forest", "flower-garden"] };
  if (stickerCount >= 1) return { level: 1, title: "Tiny Sprout", unlockedHabitats: ["forest"] };
  return { level: 0, title: "Seedling", unlockedHabitats: [] };
}
