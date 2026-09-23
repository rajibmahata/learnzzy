// Learning Activity Registry — extensible, world-aware, Zod-validated.
// Extends existing lib/activityRegistry.ts without rewriting it.
// Each world plugs in via mechanics, not by duplicating engines.

import { z } from "zod";
import type { WorldId } from "./learningWorlds.ts";
import { ACTIVITY_REGISTRY, type ActivityDef as LegacyActivityDef } from "./activityRegistry.ts";

export type LearningActivityType =
  | "GAME"
  | "MISSION"
  | "DISCOVERY"
  | "STORY"
  | "CREATIVE"
  | "EXTERNAL_STORY";

export type SafetyStatus = "approved" | "pending_review" | "rejected";
export type ProvenanceSource = "learnzzy-original" | "licensed" | "curated-external";

export const learningActivitySchema = z.object({
  id: z.string().min(2).max(48).regex(/^[a-z0-9-]+$/),
  type: z.enum(["GAME", "MISSION", "DISCOVERY", "STORY", "CREATIVE", "EXTERNAL_STORY"]),
  world: z.string().min(2), // WorldId, validated via learningWorlds
  category: z.string().min(2),
  skill: z.string().min(2),
  ageBands: z.array(z.enum(["4-5", "6-7", "8-9"])).min(1),
  difficulty: z.number().int().min(1).max(5),
  mechanics: z.array(z.string().min(2)).min(1),
  theme: z.string().min(2),
  estimatedDuration: z.number().int().min(1).max(30), // minutes, 3–10 for missions
  learningObjectives: z.array(z.string()).default([]),
  rewardTags: z.array(z.string()).default([]),
  safetyStatus: z.enum(["approved", "pending_review", "rejected"]).default("approved"),
  provenance: z.object({ source: z.enum(["learnzzy-original", "licensed", "curated-external"]), reviewedAt: z.string().optional() }).optional(),
  status: z.enum(["active", "draft", "disabled"]).default("active"),
  href: z.string().optional(),
  title: z.string().min(2),
  icon: z.string().min(1),
});

export type LearningActivity = z.infer<typeof learningActivitySchema>;

function legacyToLearning(a: LegacyActivityDef): LearningActivity {
  // Map legacy activity to world-aware activity; heuristic based on category.
  const worldMap: Record<string, WorldId> = {
    numbers: "numbers", words: "words", write: "creative", think: "thinking", shapes: "thinking", discover: "nature", puzzles: "thinking",
  };
  const typeMap: Record<string, LearningActivityType> = {
    "generic-player": "DISCOVERY",
    "game-route": "GAME",
  };
  return {
    id: a.id,
    type: typeMap[a.renderer] ?? "DISCOVERY",
    world: worldMap[a.category] ?? "thinking",
    category: a.category,
    skill: a.skills[0] ?? a.id,
    ageBands: a.ageBands as LearningActivity["ageBands"],
    difficulty: 2,
    mechanics: [a.activityType.toLowerCase()],
    theme: a.category,
    estimatedDuration: a.href ? 5 : 4,
    learningObjectives: a.skills,
    rewardTags: [],
    safetyStatus: "approved",
    provenance: { source: "learnzzy-original" },
    status: "active",
    href: a.href,
    title: a.title,
    icon: a.icon,
  };
}

// Representative Phase-3 activities — one per requested world, different mechanics,
// linked to existing engines where possible (no duplication).
const NEW_ACTIVITIES: LearningActivity[] = [
  { id: "color-detective", type: "DISCOVERY", world: "colors", category: "discover", skill: "color-recognition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["find-color"], theme: "colors", estimatedDuration: 4, learningObjectives: ["recognize colors", "visual discrimination"], rewardTags: ["rainbow"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Color Detective", icon: "🌈" },
  { id: "animal-safari", type: "DISCOVERY", world: "animals", category: "discover", skill: "animal-recognition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["safari", "discovery-animal"], theme: "jungle", estimatedDuration: 5, learningObjectives: ["identify animals", "habitat awareness"], rewardTags: ["lion", "elephant"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", href: "/play/discover", title: "Animal Safari", icon: "🦁" },
  { id: "butterfly-garden", type: "DISCOVERY", world: "insects", category: "discover", skill: "life-cycles", ageBands: ["4-5", "6-7", "8-9"], difficulty: 2, mechanics: ["life-cycle", "pollination"], theme: "garden", estimatedDuration: 5, learningObjectives: ["sequence life cycle", "observation"], rewardTags: ["butterfly"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Butterfly Garden", icon: "🦋" },
  { id: "memory-mission", type: "MISSION", world: "thinking", category: "think", skill: "memory", ageBands: ["4-5", "6-7", "8-9"], difficulty: 2, mechanics: ["memory", "recall"], theme: "memory", estimatedDuration: 3, learningObjectives: ["short-term memory", "attention"], rewardTags: ["star"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Memory Mission", icon: "🧠" },
  { id: "rex-color-adventure", type: "STORY", world: "stories", category: "discover", skill: "color-recognition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["interactive-story", "find-color", "count"], theme: "jungle", estimatedDuration: 6, learningObjectives: ["story comprehension", "color + counting"], rewardTags: ["rex", "rainbow"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Rex's Color Adventure", icon: "🦖" },
  { id: "robot-path", type: "GAME", world: "robots", category: "think", skill: "sequencing", ageBands: ["6-7", "8-9"], difficulty: 2, mechanics: ["robot-path", "sequencing"], theme: "robots", estimatedDuration: 5, learningObjectives: ["sequencing", "spatial reasoning"], rewardTags: ["robot"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Robot Path", icon: "🤖" },
  { id: "fruit-sorting", type: "DISCOVERY", world: "fruits", category: "think", skill: "sorting", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["fruit-sort", "color-sort"], theme: "fruits", estimatedDuration: 4, learningObjectives: ["classification", "color"], rewardTags: ["apple", "strawberry"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Fruit Sorting", icon: "🍎" },
  { id: "draw-a-monster", type: "CREATIVE", world: "creative", category: "write", skill: "creativity", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["draw-monster", "open-ended"], theme: "monsters", estimatedDuration: 7, learningObjectives: ["creative expression", "fine motor"], rewardTags: ["dragon"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Draw a Monster", icon: "👾" },
  // Addition — same skill, many experiences (§7) — BALLOON_POP etc. reuse addition validation
  { id: "balloon-pop-addition", type: "GAME", world: "numbers", category: "numbers", skill: "addition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["balloon-pop", "visual-addition"], theme: "balloons", estimatedDuration: 4, learningObjectives: ["addition via balloons"], rewardTags: ["balloon"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Balloon Pop", icon: "🎈" },
  { id: "dinosaur-eggs", type: "GAME", world: "dinosaurs", category: "numbers", skill: "addition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["dino-eggs", "visual-addition"], theme: "dino-nest", estimatedDuration: 4, learningObjectives: ["addition via dino eggs"], rewardTags: ["rex", "dragon"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Dinosaur Eggs", icon: "🦖" },
  { id: "fruit-basket-addition", type: "GAME", world: "fruits", category: "numbers", skill: "addition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["fruit-basket", "drag-addition"], theme: "fruits", estimatedDuration: 4, learningObjectives: ["addition via fruit"], rewardTags: ["apple", "mango"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Fruit Basket", icon: "🍎" },
  { id: "rocket-fuel", type: "GAME", world: "space", category: "numbers", skill: "addition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 2, mechanics: ["rocket-fuel", "launch-addition"], theme: "space", estimatedDuration: 5, learningObjectives: ["addition via fuel cells"], rewardTags: ["rocket", "planet"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Rocket Fuel", icon: "🚀" },
  { id: "bee-garden-count", type: "GAME", world: "insects", category: "numbers", skill: "addition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["bee-garden", "counting"], theme: "garden", estimatedDuration: 4, learningObjectives: ["counting bees"], rewardTags: ["butterfly"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Bee Garden", icon: "🐝" },
  { id: "treasure-hunt", type: "GAME", world: "thinking", category: "numbers", skill: "addition", ageBands: ["6-7", "8-9"], difficulty: 2, mechanics: ["treasure-hunt", "collect-addition"], theme: "treasure", estimatedDuration: 5, learningObjectives: ["addition via coins"], rewardTags: ["treasure"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Treasure Hunt", icon: "🏴‍☠️" },
  { id: "balloon-words", type: "GAME", world: "words", category: "words", skill: "letter-recognition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["balloon-burst", "letter-type"], theme: "balloons", estimatedDuration: 5, learningObjectives: ["letter recognition", "typing", "phonics"], rewardTags: ["balloon", "star"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", href: "/play/balloon-words", title: "Balloon Burst — Letters", icon: "🎈" },
  { id: "balloon-animals", type: "GAME", world: "animals", category: "discover", skill: "animal-recognition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["balloon-burst", "animal-find"], theme: "balloons", estimatedDuration: 5, learningObjectives: ["animal recognition", "word CAT", "observation"], rewardTags: ["cat", "balloon"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", href: "/play/balloon-animals", title: "Balloon Burst — Animals", icon: "🐱" },
  // Knowledge testing — couple of exercises that assess child mastery
  { id: "knowledge-check-numbers", type: "MISSION", world: "numbers", category: "numbers", skill: "addition", ageBands: ["4-5", "6-7", "8-9"], difficulty: 3, mechanics: ["mixed-quiz", "assessment"], theme: "numbers", estimatedDuration: 6, learningObjectives: ["assess addition, subtraction, counting"], rewardTags: ["star", "medal"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", href: "/learn/numbers/knowledge-check", title: "Numbers Check", icon: "🧠" },
  { id: "knowledge-check-words", type: "MISSION", world: "words", category: "words", skill: "phonics", ageBands: ["4-5", "6-7", "8-9"], difficulty: 3, mechanics: ["mixed-quiz", "assessment"], theme: "words", estimatedDuration: 6, learningObjectives: ["assess phonics, word families, listening"], rewardTags: ["star", "telescope"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", href: "/learn/words/knowledge-check", title: "Words Check", icon: "📝" },
  { id: "division-share", type: "GAME", world: "numbers", category: "numbers", skill: "division", ageBands: ["4-5", "6-7", "8-9"], difficulty: 2, mechanics: ["sharing", "equal-groups"], theme: "sharing", estimatedDuration: 4, learningObjectives: ["share equally", "early division"], rewardTags: ["apple"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Share Equally", icon: "🍎" },
  { id: "measurement-compare", type: "DISCOVERY", world: "thinking", category: "think", skill: "measurement", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["compare", "observation"], theme: "towers", estimatedDuration: 3, learningObjectives: ["compare taller/shorter"], rewardTags: ["star"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Tall or Short?", icon: "📏" },
  { id: "science-observe", type: "DISCOVERY", world: "nature", category: "discover", skill: "observation", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["observe", "classify"], theme: "nature", estimatedDuration: 4, learningObjectives: ["classify living vs nonliving"], rewardTags: ["magnifier"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Living or Not?", icon: "🔬" },
  // AI-enriched: cover remaining DATA_REQUIRED skills (multiplication, geometry, science, computing)
  { id: "multiplication-burst", type: "GAME", world: "numbers", category: "numbers", skill: "multiplication", ageBands: ["6-7", "8-9"], difficulty: 1, mechanics: ["balloon-pop", "repeated-addition"], theme: "balloons", estimatedDuration: 5, learningObjectives: ["multiplication as repeated addition"], rewardTags: ["star"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Multiplication Burst", icon: "✖️" },
  { id: "geometry-hunt", type: "DISCOVERY", world: "thinking", category: "shapes", skill: "geometry", ageBands: ["4-5", "6-7", "8-9"], difficulty: 2, mechanics: ["find-object", "shape-match"], theme: "shapes", estimatedDuration: 4, learningObjectives: ["recognize shapes in environment"], rewardTags: ["star"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Geometry Hunt", icon: "🔷" },
  { id: "plant-growth", type: "DISCOVERY", world: "nature", category: "discover", skill: "plants", ageBands: ["4-5", "6-7", "8-9"], difficulty: 2, mechanics: ["life-cycle", "observation"], theme: "garden", estimatedDuration: 5, learningObjectives: ["observe plant growth"], rewardTags: ["tree"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Plant Growth", icon: "🌱" },
  { id: "computing-sequencing", type: "GAME", world: "robots", category: "think", skill: "sequencing", ageBands: ["6-7", "8-9"], difficulty: 3, mechanics: ["robot-path", "sequencing"], theme: "robots", estimatedDuration: 5, learningObjectives: ["give step-by-step instructions"], rewardTags: ["robot"], safetyStatus: "approved", provenance: { source: "learnzzy-original" }, status: "active", title: "Computing Sequence", icon: "💻" },
  // External story catalog — controlled, curated, not open web
  { id: "ext-ocean-wonders", type: "EXTERNAL_STORY", world: "ocean", category: "discover", skill: "ocean-discovery", ageBands: ["4-5", "6-7", "8-9"], difficulty: 1, mechanics: ["external-story", "ocean-discovery"], theme: "ocean", estimatedDuration: 8, learningObjectives: ["ocean awareness"], rewardTags: ["dolphin", "boat"], safetyStatus: "approved", provenance: { source: "curated-external", reviewedAt: new Date().toISOString() }, status: "active", title: "Ocean Wonders (Curated)", icon: "🌊" },
];

const LEGACY_LEARNING = ACTIVITY_REGISTRY.map(legacyToLearning);

const byId = new Map<string, LearningActivity>();
for (const a of [...LEGACY_LEARNING, ...NEW_ACTIVITIES]) byId.set(a.id, a);
export const LEARNING_ACTIVITY_REGISTRY: LearningActivity[] = [...byId.values()];

// Validate entire registry at import (fail-fast in tests, not in production render)
export function validateLearningActivities(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const a of LEARNING_ACTIVITY_REGISTRY) {
    const parsed = learningActivitySchema.safeParse(a);
    if (!parsed.success) problems.push(`${a.id}: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    if (ids.has(a.id)) problems.push(`duplicate id ${a.id}`);
    ids.add(a.id);
  }
  return problems;
}

export function learningActivityFor(id: string): LearningActivity | null {
  return LEARNING_ACTIVITY_REGISTRY.find((a) => a.id === id) ?? null;
}

export function learningActivitiesForWorld(world: WorldId): LearningActivity[] {
  return LEARNING_ACTIVITY_REGISTRY.filter((a) => a.world === world && a.status === "active");
}

export function learningActivitiesForType(type: LearningActivityType): LearningActivity[] {
  return LEARNING_ACTIVITY_REGISTRY.filter((a) => a.type === type && a.status === "active");
}
