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

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Forest progression — environment unlocks as child learns
export function forestLevel(stickerCount: number): { level: number; title: string; unlockedHabitats: Habitat[] } {
  if (stickerCount >= 10) return { level: 4, title: "Enchanted Forest", unlockedHabitats: ["forest", "canopy", "flower-garden", "pond", "deep-forest", "magical-clearing"] };
  if (stickerCount >= 5) return { level: 3, title: "Growing Grove", unlockedHabitats: ["forest", "canopy", "flower-garden", "pond"] };
  if (stickerCount >= 3) return { level: 2, title: "Flower Meadow", unlockedHabitats: ["forest", "flower-garden"] };
  if (stickerCount >= 1) return { level: 1, title: "Tiny Sprout", unlockedHabitats: ["forest"] };
  return { level: 0, title: "Seedling", unlockedHabitats: [] };
}
