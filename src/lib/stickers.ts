// Sticker catalog — deterministic, dependency-free, Learnzzy-native.
// Emoji-only artwork: zero asset payload, no bundle cost, no PII.
// The SERVER is authoritative for awards (see repositories/rewards.ts); this
// module only defines the catalog, deterministic selection, and milestones so
// unit tests import the real code. Rarity only organizes the collection —
// every sticker is obtainable through normal learning activity.

export type StickerCategory =
  | "animals"
  | "flowers"
  | "nature"
  | "food"
  | "space"
  | "transport"
  | "fantasy"
  | "discovery";

export type StickerRarity = "common" | "special" | "rare";

export interface StickerDef {
  id: string;
  name: string;
  emoji: string;
  category: StickerCategory;
  rarity: StickerRarity;
  description: string;
  sortOrder: number;
  active: boolean;
}

export const STICKER_CATEGORIES: { id: StickerCategory; name: string; icon: string }[] = [
  { id: "animals", name: "Animals", icon: "🐾" },
  { id: "flowers", name: "Flowers", icon: "🌸" },
  { id: "nature", name: "Nature", icon: "🌈" },
  { id: "food", name: "Food", icon: "🍎" },
  { id: "space", name: "Space", icon: "🚀" },
  { id: "transport", name: "Transport", icon: "🚗" },
  { id: "fantasy", name: "Fantasy", icon: "🦄" },
  { id: "discovery", name: "Discovery", icon: "🧭" },
];

function def(
  id: string,
  name: string,
  emoji: string,
  category: StickerCategory,
  rarity: StickerRarity,
  description: string,
  sortOrder: number,
  active = true
): StickerDef {
  return { id, name, emoji, category, rarity, description, sortOrder, active };
}

export const STICKER_CATALOG: StickerDef[] = [
  // Animals
  def("lion", "Lion Friend", "🦁", "animals", "common", "Brave and kind.", 1),
  def("tiger", "Tiger Buddy", "🐯", "animals", "common", "Stripes of courage.", 2),
  def("elephant", "Elephant Pal", "🐘", "animals", "common", "Never forgets a friend.", 3),
  def("panda", "Panda Pal", "🐼", "animals", "common", "Gentle and playful.", 4),
  def("fox", "Fox Friend", "🦊", "animals", "common", "Clever and quick.", 5),
  def("rabbit", "Rabbit Buddy", "🐰", "animals", "common", "Hoppy and happy.", 6),
  def("monkey", "Monkey Pal", "🐵", "animals", "common", "Swings into fun.", 7),
  def("penguin", "Penguin Pal", "🐧", "animals", "special", "Waddles with joy.", 8),
  def("dolphin", "Dolphin Friend", "🐬", "animals", "special", "Splashes of smiles.", 9),
  def("butterfly", "Butterfly Beauty", "🦋", "animals", "special", "Grew wings by learning.", 10),
  def("bird", "Bluebird Buddy", "🐦", "animals", "common", "Sings when you learn.", 11),
  def("bear", "Teddy Friend", "🧸", "animals", "common", "Always huggable.", 12),
  // Flowers
  def("sunflower", "Sunflower Smile", "🌻", "flowers", "common", "Tall and sunny.", 20),
  def("rose", "Rose Buddy", "🌹", "flowers", "common", "Blooms with kindness.", 21),
  def("tulip", "Tulip Friend", "🌷", "flowers", "common", "Springs up happy.", 22),
  def("daisy", "Daisy Pal", "🌼", "flowers", "common", "Fresh as morning.", 23),
  def("lotus", "Lotus Dream", "🪷", "flowers", "rare", "Calm on the water.", 24),
  def("blossom", "Cherry Blossom", "🌸", "flowers", "special", "Soft pink wonder.", 25),
  // Nature
  def("rainbow", "Rainbow Bridge", "🌈", "nature", "special", "Colors after rain.", 30),
  def("cloud", "Cloud Puff", "☁️", "nature", "common", "Floats along gently.", 31),
  def("moon", "Moon Glow", "🌙", "nature", "common", "Watches over dreams.", 32),
  def("star", "Shining Star", "⭐", "nature", "common", "You shine bright.", 33),
  def("tree", "Mighty Tree", "🌳", "nature", "common", "Grows a little daily.", 34),
  def("mountain", "Mountain Peak", "⛰️", "nature", "special", "Climbed step by step.", 35),
  def("waterfall", "Waterfall Song", "🌊", "nature", "rare", "Music of the river.", 36),
  def("sun", "Sunny Day", "☀️", "nature", "common", "Warm and bright.", 37),
  // Food
  def("apple", "Apple Star", "🍎", "food", "common", "Crunchy and sweet.", 40),
  def("mango", "Mango Joy", "🥭", "food", "common", "Golden and juicy.", 41),
  def("strawberry", "Strawberry Sweet", "🍓", "food", "common", "Tiny heart fruit.", 42),
  def("watermelon", "Watermelon Splash", "🍉", "food", "special", "Summer in a slice.", 43),
  def("grapes", "Grape Bunch", "🍇", "food", "common", "Better together.", 44),
  // Space
  def("rocket", "Rocket Ride", "🚀", "space", "special", "Blast off to learn.", 50),
  def("planet", "Planet Explorer", "🪐", "space", "special", "Rings of wonder.", 51),
  def("astronaut", "Astronaut Buddy", "🧑‍🚀", "space", "rare", "Floats among stars.", 52),
  def("comet", "Comet Trail", "☄️", "space", "rare", "A wish flying by.", 53),
  def("alien", "Alien Friend", "👽", "space", "special", "Hello from far away.", 54),
  // Transport
  def("car", "Little Car", "🚗", "transport", "common", "Beep beep, let's go.", 60),
  def("train", "Choo Train", "🚂", "transport", "common", "Chugging along.", 61),
  def("airplane", "Sky Plane", "✈️", "transport", "special", "Flying high.", 62),
  def("boat", "Sailboat Drift", "⛵", "transport", "common", "Sails calm seas.", 63),
  def("balloon", "Hot Air Balloon", "🎈", "transport", "special", "Up, up and away.", 64),
  def("rex", "Rex Explorer", "🦖", "animals", "special", "Stomps in to celebrate.", 13),
  // Fantasy
  def("dragon", "Dragon Friend", "🐉", "fantasy", "rare", "Kind fire at heart.", 70),
  def("unicorn", "Unicorn Magic", "🦄", "fantasy", "rare", "Sparkles everywhere.", 71),
  def("fairy", "Fairy Dust", "🧚", "fantasy", "special", "A sprinkle of magic.", 72),
  def("magic-star", "Magic Star", "🌟", "fantasy", "special", "Glows when you try.", 73),
  def("castle", "Story Castle", "🏰", "fantasy", "rare", "Every story lives here.", 74),
  // Discovery
  def("robot", "Robo Buddy", "🤖", "discovery", "special", "Beep boop, let’s play!", 79),
  def("telescope", "Telescope Eye", "🔭", "discovery", "special", "See faraway things.", 80),
  def("magnifier", "Magnifying Glass", "🔍", "discovery", "common", "Look closer, wonder more.", 81),
  def("treasure", "Treasure Chest", "🧰", "discovery", "rare", "Learning is treasure.", 82),
  def("compass", "Compass Guide", "🧭", "discovery", "special", "Points to curiosity.", 83),
  def("map", "Explorer Map", "🗺️", "discovery", "common", "X marks the fun.", 84),
  def("medal", "Explorer Medal", "🏅", "discovery", "special", "Earned by thinking.", 85),
];

export const ACTIVE_STICKERS: StickerDef[] = STICKER_CATALOG.filter((s) => s.active);

const byId = new Map(STICKER_CATALOG.map((s) => [s.id, s]));

export function stickerById(id: string): StickerDef | null {
  return byId.get(id) ?? null;
}

export function resolveStickerIds(ids: string[]): StickerDef[] {
  const out: StickerDef[] = [];
  for (const id of ids) {
    const s = byId.get(id);
    if (s) out.push(s);
  }
  return out;
}

function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic unowned-sticker selection. Rotates through the catalog by
 * seed so awards spread across categories; NEVER returns an owned sticker.
 * Returns null when the active catalog is fully collected (caller must use
 * a milestone/other reward instead of duplicating).
 */
export function selectUnownedSticker(ownedIds: readonly string[], seed: string): StickerDef | null {
  const owned = new Set(ownedIds);
  const unowned = ACTIVE_STICKERS.filter((s) => !owned.has(s.id));
  if (unowned.length === 0) return null;
  return unowned[hashSeed(seed) % unowned.length] ?? unowned[0]!;
}

export interface Milestone {
  count: number;
  emoji: string;
  name: string;
  message: string;
}

export const MILESTONES: Milestone[] = [
  { count: 5, emoji: "🌟", name: "Little Explorer", message: "Five discoveries and counting!" },
  { count: 10, emoji: "🌈", name: "Rainbow Collector", message: "Ten stickers of wonder!" },
  { count: 25, emoji: "🦋", name: "Discovery Friend", message: "Twenty-five treasures found!" },
  { count: 50, emoji: "🏆", name: "Learnzzy Explorer", message: "Fifty stickers — amazing journey!" },
];

/** Highest milestone reached at `count` (null when none). Milestones derive
 *  from the count — no extra collection, nothing to duplicate. */
export function milestoneFor(count: number): Milestone | null {
  let reached: Milestone | null = null;
  for (const m of MILESTONES) {
    if (count >= m.count) reached = m;
  }
  return reached;
}

/** Milestone newly reached by growing from `before` to `after` (null if none). */
export function crossedMilestone(before: number, after: number): Milestone | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    const m = MILESTONES[i]!;
    if (after >= m.count && before < m.count) return m;
  }
  return null;
}

export function validateCatalog(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const categories = new Set(STICKER_CATEGORIES.map((c) => c.id));
  for (const s of STICKER_CATALOG) {
    if (seen.has(s.id)) problems.push(`duplicate sticker id ${s.id}`);
    seen.add(s.id);
    if (!categories.has(s.category)) problems.push(`${s.id} unknown category`);
    if (!s.emoji || !s.name) problems.push(`${s.id} missing art/name`);
  }
  return problems;
}
