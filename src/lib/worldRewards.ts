import { STICKER_CATALOG, stickerById, type StickerDef } from "./stickers.ts";

export type WorldEventType =
  | "CREATURE_ARRIVAL"
  | "WATER_ARRIVAL"
  | "FLYING_ARRIVAL"
  | "MAGICAL_TRANSFORMATION"
  | "LAUNCH_EVENT"
  | "GROWTH_EVENT";

export type WorldEnvironment =
  | "jungle"
  | "ocean"
  | "sky"
  | "space"
  | "garden"
  | "playroom";

export interface WorldRewardEvent {
  rewardId: string;
  category: StickerDef["category"];
  eventType: WorldEventType;
  environment: WorldEnvironment;
  asset: { emoji: string; scale: number; entranceDirection: "right" | "left" | "bottom" | "top" };
  animation: "walk" | "sail" | "fly" | "grow" | "appear" | "launch";
  durationMs: number;
  soundEffects: string[];
  particleEffects: ("dust" | "waves" | "sparkles" | "stars" | "bubbles" | "confetti")[];
  companionReaction: "excited" | "curious" | "happy" | "surprised";
  /** Tags that let future activities use this reward as learning context (e.g. rex → counting). */
  rewardTags: string[];
  learningThemes: string[];
  gameAffinity: string[];
}

function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Additive, data-driven — future rewards only add an entry here.
// Covers every STICKER_CATEGORIES id so no sticker falls back to a bland star.
export const WORLD_EVENT_CONFIGS: Record<string, WorldRewardEvent> = {
  // Animals — jungle/sky/ocean walks
  rex: { rewardId: "rex", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🦖", scale: 1.6, entranceDirection: "right" }, animation: "walk", durationMs: 6500, soundEffects: ["footsteps", "dust"], particleEffects: ["dust", "sparkles"], companionReaction: "excited", rewardTags: ["dino", "rex"], learningThemes: ["jungle", "counting", "discovery"], gameAffinity: ["addition", "puzzle", "discovery"] },
  lion: { rewardId: "lion", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🦁", scale: 1.4, entranceDirection: "right" }, animation: "walk", durationMs: 6200, soundEffects: ["footsteps"], particleEffects: ["dust"], companionReaction: "excited", rewardTags: ["lion"], learningThemes: ["animals", "counting"], gameAffinity: ["addition", "discovery"] },
  tiger: { rewardId: "tiger", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🐯", scale: 1.35, entranceDirection: "right" }, animation: "walk", durationMs: 6200, soundEffects: ["footsteps"], particleEffects: ["dust"], companionReaction: "excited", rewardTags: ["tiger"], learningThemes: ["animals", "counting"], gameAffinity: ["addition", "discovery"] },
  elephant: { rewardId: "elephant", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🐘", scale: 1.5, entranceDirection: "right" }, animation: "walk", durationMs: 6800, soundEffects: ["footsteps"], particleEffects: ["dust"], companionReaction: "surprised", rewardTags: ["elephant"], learningThemes: ["counting", "size"], gameAffinity: ["addition", "puzzle"] },
  panda: { rewardId: "panda", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🐼", scale: 1.35, entranceDirection: "right" }, animation: "walk", durationMs: 6300, soundEffects: ["footsteps"], particleEffects: ["dust"], companionReaction: "happy", rewardTags: ["panda"], learningThemes: ["animals"], gameAffinity: ["discovery"] },
  fox: { rewardId: "fox", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🦊", scale: 1.3, entranceDirection: "right" }, animation: "walk", durationMs: 6000, soundEffects: ["footsteps"], particleEffects: ["sparkles"], companionReaction: "curious", rewardTags: ["fox"], learningThemes: ["animals"], gameAffinity: ["discovery", "puzzle"] },
  rabbit: { rewardId: "rabbit", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "garden", asset: { emoji: "🐰", scale: 1.3, entranceDirection: "right" }, animation: "walk", durationMs: 5800, soundEffects: ["hop"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["rabbit"], learningThemes: ["animals", "counting"], gameAffinity: ["addition"] },
  monkey: { rewardId: "monkey", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🐵", scale: 1.3, entranceDirection: "right" }, animation: "walk", durationMs: 5900, soundEffects: ["footsteps"], particleEffects: ["sparkles"], companionReaction: "excited", rewardTags: ["monkey"], learningThemes: ["animals", "play"], gameAffinity: ["discovery"] },
  penguin: { rewardId: "penguin", category: "animals", eventType: "WATER_ARRIVAL", environment: "ocean", asset: { emoji: "🐧", scale: 1.3, entranceDirection: "right" }, animation: "sail", durationMs: 6200, soundEffects: ["splash"], particleEffects: ["waves"], companionReaction: "happy", rewardTags: ["penguin"], learningThemes: ["ocean", "animals"], gameAffinity: ["discovery"] },
  butterfly: { rewardId: "butterfly", category: "animals", eventType: "FLYING_ARRIVAL", environment: "sky", asset: { emoji: "🦋", scale: 1.3, entranceDirection: "right" }, animation: "fly", durationMs: 6000, soundEffects: ["flutter"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["butterfly"], learningThemes: ["observation", "counting", "memory"], gameAffinity: ["discovery", "memory"] },
  bird: { rewardId: "bird", category: "animals", eventType: "FLYING_ARRIVAL", environment: "sky", asset: { emoji: "🐦", scale: 1.3, entranceDirection: "right" }, animation: "fly", durationMs: 5800, soundEffects: ["flutter"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["bird"], learningThemes: ["sky", "counting"], gameAffinity: ["subtraction"] },
  bear: { rewardId: "bear", category: "animals", eventType: "CREATURE_ARRIVAL", environment: "jungle", asset: { emoji: "🧸", scale: 1.35, entranceDirection: "right" }, animation: "walk", durationMs: 6000, soundEffects: ["footsteps"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["bear"], learningThemes: ["comfort", "counting"], gameAffinity: ["addition"] },
  dolphin: { rewardId: "dolphin", category: "animals", eventType: "WATER_ARRIVAL", environment: "ocean", asset: { emoji: "🐬", scale: 1.4, entranceDirection: "right" }, animation: "sail", durationMs: 6400, soundEffects: ["splash", "waves"], particleEffects: ["waves", "bubbles"], companionReaction: "happy", rewardTags: ["dolphin", "ocean"], learningThemes: ["ocean", "counting"], gameAffinity: ["discovery", "addition"] },
  // Flowers — garden growth
  sunflower: { rewardId: "sunflower", category: "flowers", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🌻", scale: 1.4, entranceDirection: "bottom" }, animation: "grow", durationMs: 6000, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["sunflower", "flower"], learningThemes: ["nature", "growth", "colors"], gameAffinity: ["discovery"] },
  rose: { rewardId: "rose", category: "flowers", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🌹", scale: 1.35, entranceDirection: "bottom" }, animation: "grow", durationMs: 5800, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["rose"], learningThemes: ["nature", "colors"], gameAffinity: ["discovery"] },
  tulip: { rewardId: "tulip", category: "flowers", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🌷", scale: 1.35, entranceDirection: "bottom" }, animation: "grow", durationMs: 5800, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["tulip"], learningThemes: ["nature"], gameAffinity: ["discovery"] },
  daisy: { rewardId: "daisy", category: "flowers", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🌼", scale: 1.3, entranceDirection: "bottom" }, animation: "grow", durationMs: 5600, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["daisy"], learningThemes: ["nature"], gameAffinity: ["discovery"] },
  lotus: { rewardId: "lotus", category: "flowers", eventType: "GROWTH_EVENT", environment: "ocean", asset: { emoji: "🪷", scale: 1.35, entranceDirection: "bottom" }, animation: "grow", durationMs: 6000, soundEffects: ["splash"], particleEffects: ["waves"], companionReaction: "surprised", rewardTags: ["lotus"], learningThemes: ["nature", "calm"], gameAffinity: ["discovery"] },
  blossom: { rewardId: "blossom", category: "flowers", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🌸", scale: 1.35, entranceDirection: "bottom" }, animation: "grow", durationMs: 5800, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["blossom"], learningThemes: ["nature", "colors"], gameAffinity: ["discovery"] },
  // Nature — sky/garden
  rainbow: { rewardId: "rainbow", category: "nature", eventType: "MAGICAL_TRANSFORMATION", environment: "sky", asset: { emoji: "🌈", scale: 1.6, entranceDirection: "top" }, animation: "appear", durationMs: 6200, soundEffects: ["sparkles"], particleEffects: ["sparkles", "stars"], companionReaction: "surprised", rewardTags: ["rainbow"], learningThemes: ["colors", "nature"], gameAffinity: ["discovery", "puzzle"] },
  cloud: { rewardId: "cloud", category: "nature", eventType: "FLYING_ARRIVAL", environment: "sky", asset: { emoji: "☁️", scale: 1.4, entranceDirection: "right" }, animation: "fly", durationMs: 5600, soundEffects: ["wind"], particleEffects: ["sparkles"], companionReaction: "curious", rewardTags: ["cloud"], learningThemes: ["sky", "weather"], gameAffinity: ["discovery"] },
  moon: { rewardId: "moon", category: "nature", eventType: "MAGICAL_TRANSFORMATION", environment: "space", asset: { emoji: "🌙", scale: 1.4, entranceDirection: "top" }, animation: "appear", durationMs: 6000, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "curious", rewardTags: ["moon"], learningThemes: ["space", "night"], gameAffinity: ["discovery"] },
  star: { rewardId: "star", category: "nature", eventType: "MAGICAL_TRANSFORMATION", environment: "space", asset: { emoji: "⭐", scale: 1.4, entranceDirection: "top" }, animation: "appear", durationMs: 5600, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "excited", rewardTags: ["star"], learningThemes: ["space", "counting"], gameAffinity: ["addition"] },
  tree: { rewardId: "tree", category: "nature", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🌳", scale: 1.4, entranceDirection: "bottom" }, animation: "grow", durationMs: 5800, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["tree"], learningThemes: ["nature", "growth"], gameAffinity: ["discovery"] },
  mountain: { rewardId: "mountain", category: "nature", eventType: "CREATURE_ARRIVAL", environment: "garden", asset: { emoji: "⛰️", scale: 1.5, entranceDirection: "right" }, animation: "walk", durationMs: 6200, soundEffects: ["footsteps"], particleEffects: ["dust"], companionReaction: "surprised", rewardTags: ["mountain"], learningThemes: ["nature", "size"], gameAffinity: ["discovery"] },
  waterfall: { rewardId: "waterfall", category: "nature", eventType: "WATER_ARRIVAL", environment: "ocean", asset: { emoji: "🌊", scale: 1.5, entranceDirection: "right" }, animation: "sail", durationMs: 6400, soundEffects: ["splash"], particleEffects: ["waves", "bubbles"], companionReaction: "excited", rewardTags: ["waterfall"], learningThemes: ["nature", "water"], gameAffinity: ["discovery"] },
  sun: { rewardId: "sun", category: "nature", eventType: "MAGICAL_TRANSFORMATION", environment: "sky", asset: { emoji: "☀️", scale: 1.4, entranceDirection: "top" }, animation: "appear", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["sun"], learningThemes: ["nature", "light"], gameAffinity: ["discovery"] },
  // Food — garden discovery
  apple: { rewardId: "apple", category: "food", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🍎", scale: 1.3, entranceDirection: "bottom" }, animation: "grow", durationMs: 5600, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["apple", "food"], learningThemes: ["food", "counting"], gameAffinity: ["addition"] },
  mango: { rewardId: "mango", category: "food", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🥭", scale: 1.3, entranceDirection: "bottom" }, animation: "grow", durationMs: 5600, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["mango"], learningThemes: ["food"], gameAffinity: ["addition"] },
  strawberry: { rewardId: "strawberry", category: "food", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🍓", scale: 1.3, entranceDirection: "bottom" }, animation: "grow", durationMs: 5600, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["strawberry"], learningThemes: ["food", "colors"], gameAffinity: ["addition"] },
  watermelon: { rewardId: "watermelon", category: "food", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🍉", scale: 1.35, entranceDirection: "bottom" }, animation: "grow", durationMs: 5800, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "excited", rewardTags: ["watermelon"], learningThemes: ["food", "size"], gameAffinity: ["addition"] },
  grapes: { rewardId: "grapes", category: "food", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🍇", scale: 1.3, entranceDirection: "bottom" }, animation: "grow", durationMs: 5600, soundEffects: ["grow"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["grapes"], learningThemes: ["food", "counting"], gameAffinity: ["addition"] },
  // Space — launch/sky
  rocket: { rewardId: "rocket", category: "space", eventType: "LAUNCH_EVENT", environment: "space", asset: { emoji: "🚀", scale: 1.4, entranceDirection: "bottom" }, animation: "launch", durationMs: 6000, soundEffects: ["launch"], particleEffects: ["stars", "confetti"], companionReaction: "excited", rewardTags: ["rocket", "space"], learningThemes: ["space", "counting"], gameAffinity: ["addition", "discovery"] },
  planet: { rewardId: "planet", category: "space", eventType: "MAGICAL_TRANSFORMATION", environment: "space", asset: { emoji: "🪐", scale: 1.4, entranceDirection: "top" }, animation: "appear", durationMs: 6200, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "surprised", rewardTags: ["planet"], learningThemes: ["space"], gameAffinity: ["discovery"] },
  astronaut: { rewardId: "astronaut", category: "space", eventType: "LAUNCH_EVENT", environment: "space", asset: { emoji: "🧑‍🚀", scale: 1.3, entranceDirection: "bottom" }, animation: "launch", durationMs: 6400, soundEffects: ["launch"], particleEffects: ["stars"], companionReaction: "excited", rewardTags: ["astronaut"], learningThemes: ["space"], gameAffinity: ["discovery"] },
  comet: { rewardId: "comet", category: "space", eventType: "FLYING_ARRIVAL", environment: "space", asset: { emoji: "☄️", scale: 1.3, entranceDirection: "right" }, animation: "fly", durationMs: 6000, soundEffects: ["whoosh"], particleEffects: ["stars"], companionReaction: "surprised", rewardTags: ["comet"], learningThemes: ["space"], gameAffinity: ["discovery"] },
  alien: { rewardId: "alien", category: "space", eventType: "MAGICAL_TRANSFORMATION", environment: "space", asset: { emoji: "👽", scale: 1.3, entranceDirection: "top" }, animation: "appear", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "curious", rewardTags: ["alien"], learningThemes: ["space", "play"], gameAffinity: ["discovery"] },
  // Transport — ocean/sky/jungle
  car: { rewardId: "car", category: "transport", eventType: "CREATURE_ARRIVAL", environment: "playroom", asset: { emoji: "🚗", scale: 1.3, entranceDirection: "right" }, animation: "walk", durationMs: 5800, soundEffects: ["beep"], particleEffects: ["dust"], companionReaction: "excited", rewardTags: ["car"], learningThemes: ["transport", "counting"], gameAffinity: ["addition"] },
  train: { rewardId: "train", category: "transport", eventType: "CREATURE_ARRIVAL", environment: "playroom", asset: { emoji: "🚂", scale: 1.4, entranceDirection: "right" }, animation: "walk", durationMs: 6000, soundEffects: ["chugga"], particleEffects: ["dust"], companionReaction: "excited", rewardTags: ["train"], learningThemes: ["transport"], gameAffinity: ["discovery"] },
  airplane: { rewardId: "airplane", category: "transport", eventType: "FLYING_ARRIVAL", environment: "sky", asset: { emoji: "✈️", scale: 1.3, entranceDirection: "right" }, animation: "fly", durationMs: 6000, soundEffects: ["whoosh"], particleEffects: ["sparkles"], companionReaction: "excited", rewardTags: ["airplane"], learningThemes: ["transport", "sky"], gameAffinity: ["subtraction"] },
  boat: { rewardId: "boat", category: "transport", eventType: "WATER_ARRIVAL", environment: "ocean", asset: { emoji: "⛵", scale: 1.5, entranceDirection: "right" }, animation: "sail", durationMs: 7000, soundEffects: ["waves", "horn"], particleEffects: ["waves", "sparkles"], companionReaction: "excited", rewardTags: ["boat", "ocean"], learningThemes: ["ocean", "transport", "counting"], gameAffinity: ["subtraction", "discovery"] },
  balloon: { rewardId: "balloon", category: "transport", eventType: "FLYING_ARRIVAL", environment: "sky", asset: { emoji: "🎈", scale: 1.3, entranceDirection: "bottom" }, animation: "fly", durationMs: 5800, soundEffects: ["whoosh"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["balloon"], learningThemes: ["sky", "colors"], gameAffinity: ["discovery"] },
  // Fantasy — magical/sky
  dragon: { rewardId: "dragon", category: "fantasy", eventType: "FLYING_ARRIVAL", environment: "sky", asset: { emoji: "🐉", scale: 1.5, entranceDirection: "right" }, animation: "fly", durationMs: 6600, soundEffects: ["flutter"], particleEffects: ["sparkles", "stars"], companionReaction: "surprised", rewardTags: ["dragon"], learningThemes: ["fantasy", "courage"], gameAffinity: ["puzzle"] },
  unicorn: { rewardId: "unicorn", category: "fantasy", eventType: "MAGICAL_TRANSFORMATION", environment: "sky", asset: { emoji: "🦄", scale: 1.4, entranceDirection: "top" }, animation: "appear", durationMs: 6400, soundEffects: ["sparkles"], particleEffects: ["stars", "sparkles"], companionReaction: "excited", rewardTags: ["unicorn"], learningThemes: ["fantasy", "colors"], gameAffinity: ["puzzle"] },
  fairy: { rewardId: "fairy", category: "fantasy", eventType: "FLYING_ARRIVAL", environment: "garden", asset: { emoji: "🧚", scale: 1.3, entranceDirection: "right" }, animation: "fly", durationMs: 6000, soundEffects: ["sparkles"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["fairy"], learningThemes: ["fantasy", "nature"], gameAffinity: ["discovery"] },
  "magic-star": { rewardId: "magic-star", category: "fantasy", eventType: "MAGICAL_TRANSFORMATION", environment: "space", asset: { emoji: "🌟", scale: 1.4, entranceDirection: "top" }, animation: "appear", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "excited", rewardTags: ["magic"], learningThemes: ["fantasy", "counting"], gameAffinity: ["addition"] },
  castle: { rewardId: "castle", category: "fantasy", eventType: "MAGICAL_TRANSFORMATION", environment: "sky", asset: { emoji: "🏰", scale: 1.4, entranceDirection: "bottom" }, animation: "appear", durationMs: 6200, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "surprised", rewardTags: ["castle"], learningThemes: ["fantasy", "stories"], gameAffinity: ["discovery"] },
  // Discovery — garden/sky
  telescope: { rewardId: "telescope", category: "discovery", eventType: "MAGICAL_TRANSFORMATION", environment: "space", asset: { emoji: "🔭", scale: 1.3, entranceDirection: "top" }, animation: "appear", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["stars"], companionReaction: "curious", rewardTags: ["telescope"], learningThemes: ["discovery", "space"], gameAffinity: ["discovery"] },
  magnifier: { rewardId: "magnifier", category: "discovery", eventType: "MAGICAL_TRANSFORMATION", environment: "garden", asset: { emoji: "🔍", scale: 1.3, entranceDirection: "top" }, animation: "appear", durationMs: 5600, soundEffects: ["sparkles"], particleEffects: ["sparkles"], companionReaction: "curious", rewardTags: ["magnifier"], learningThemes: ["discovery", "observation"], gameAffinity: ["discovery", "puzzle"] },
  treasure: { rewardId: "treasure", category: "discovery", eventType: "GROWTH_EVENT", environment: "garden", asset: { emoji: "🧰", scale: 1.3, entranceDirection: "bottom" }, animation: "grow", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["sparkles"], companionReaction: "excited", rewardTags: ["treasure"], learningThemes: ["discovery", "reward"], gameAffinity: ["discovery"] },
  compass: { rewardId: "compass", category: "discovery", eventType: "MAGICAL_TRANSFORMATION", environment: "sky", asset: { emoji: "🧭", scale: 1.3, entranceDirection: "top" }, animation: "appear", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["sparkles"], companionReaction: "curious", rewardTags: ["compass"], learningThemes: ["discovery", "direction"], gameAffinity: ["discovery"] },
  map: { rewardId: "map", category: "discovery", eventType: "MAGICAL_TRANSFORMATION", environment: "garden", asset: { emoji: "🗺️", scale: 1.35, entranceDirection: "top" }, animation: "appear", durationMs: 5800, soundEffects: ["sparkles"], particleEffects: ["sparkles"], companionReaction: "happy", rewardTags: ["map"], learningThemes: ["discovery", "exploration"], gameAffinity: ["discovery"] },
  medal: { rewardId: "medal", category: "discovery", eventType: "MAGICAL_TRANSFORMATION", environment: "playroom", asset: { emoji: "🏅", scale: 1.3, entranceDirection: "top" }, animation: "appear", durationMs: 5600, soundEffects: ["sparkles"], particleEffects: ["confetti"], companionReaction: "excited", rewardTags: ["medal"], learningThemes: ["achievement"], gameAffinity: ["addition", "discovery"] },
};

const DEFAULT_EVENT: WorldRewardEvent = {
  rewardId: "default",
  category: "animals",
  eventType: "CREATURE_ARRIVAL",
  environment: "playroom",
  asset: { emoji: "⭐", scale: 1.3, entranceDirection: "right" },
  animation: "walk",
  durationMs: 5000,
  soundEffects: ["sparkles"],
  particleEffects: ["sparkles"],
  companionReaction: "happy",
  rewardTags: [],
  learningThemes: [],
  gameAffinity: [],
};

export function stickerToWorldEventId(stickerId: string): string {
  // Direct mapping where sticker id matches reward id; fallback to category-based
  if (WORLD_EVENT_CONFIGS[stickerId]) return stickerId;
  // Try to map via known aliases (e.g. sticker "star" → no world event, use default)
  return stickerId;
}

const CATEGORY_FALLBACK: Record<StickerDef["category"], { environment: WorldEnvironment; animation: WorldRewardEvent["animation"]; eventType: WorldEventType }> = {
  animals: { environment: "jungle", animation: "walk", eventType: "CREATURE_ARRIVAL" },
  flowers: { environment: "garden", animation: "grow", eventType: "GROWTH_EVENT" },
  nature: { environment: "sky", animation: "appear", eventType: "MAGICAL_TRANSFORMATION" },
  food: { environment: "garden", animation: "grow", eventType: "GROWTH_EVENT" },
  space: { environment: "space", animation: "launch", eventType: "LAUNCH_EVENT" },
  transport: { environment: "playroom", animation: "walk", eventType: "CREATURE_ARRIVAL" },
  fantasy: { environment: "sky", animation: "appear", eventType: "MAGICAL_TRANSFORMATION" },
  discovery: { environment: "garden", animation: "appear", eventType: "MAGICAL_TRANSFORMATION" },
};

export function selectWorldEvent(stickerId: string, variantSeed?: string): WorldRewardEvent {
  let base = WORLD_EVENT_CONFIGS[stickerId];
  if (!base) {
    const def = stickerById(stickerId);
    if (def) {
      const fb = CATEGORY_FALLBACK[def.category] ?? { environment: "playroom" as WorldEnvironment, animation: "walk" as const, eventType: "CREATURE_ARRIVAL" as const };
      base = {
        rewardId: def.id,
        category: def.category,
        eventType: fb.eventType,
        environment: fb.environment,
        asset: { emoji: def.emoji, scale: 1.3, entranceDirection: "right" },
        animation: fb.animation,
        durationMs: 5600,
        soundEffects: ["sparkles"],
        particleEffects: ["sparkles"],
        companionReaction: "happy",
        rewardTags: [def.id],
        learningThemes: [def.category],
        gameAffinity: [],
      };
    } else {
      base = DEFAULT_EVENT;
    }
  }
  // Deterministic variant: same sticker + same count → same experience, testable
  if (!variantSeed) return base;
  const variant = hashSeed(`${stickerId}:${variantSeed}`) % 4;
  // Slight duration/persistence variation per variant, still short (3–8s)
  const durationMs = Math.max(3000, Math.min(8000, base.durationMs + (variant - 1) * 300));
  return { ...base, durationMs };
}

export function validateWorldEvent(event: WorldRewardEvent): string[] {
  const problems: string[] = [];
  if (!event.rewardId) problems.push("rewardId missing");
  if (!event.asset?.emoji) problems.push("asset emoji missing");
  if (event.durationMs < 3000 || event.durationMs > 8000) problems.push("duration must be 3000–8000ms");
  return problems;
}
