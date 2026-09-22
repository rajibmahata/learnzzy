// Activity registry — one template entry per reusable activity (spec §25/§29).
// Each template names its category, skill, activity type, supported age
// bands, the complexity dimensions it varies, its deterministic generator,
// its renderer, and its validator — so new worksheet-inspired activities
// plug into the same engine instead of becoming separate games.
// Existing game engines are NOT duplicated: number/add/sub activities reuse
// games/addition|subtraction math; sorting/puzzle/sketch/discover link to the
// shipped /play/* routes. Generic activities run on the ActivityPlayer with
// deterministic generators in lib/activityContent.

import type { CategoryId } from "./categories";

export type Renderer = "generic-player" | "game-route";
export type Validator = "single-choice" | "trace-write" | "build-order" | "sort-choice";

export interface ActivityDef {
  id: string;
  category: CategoryId;
  title: string;
  icon: string;
  skills: string[];
  ageBands: Array<"4-5" | "6-7" | "8-9">;
  /** Spec §25 activity type, e.g. ORDER_NUMBERS / COMPLETE_WORD. */
  activityType: string;
  /** Complexity dimensions this template varies (spec §8 subset). */
  complexityDimensions: string[];
  /** Existing game route when the activity reuses a shipped engine. */
  href?: string;
  /** Generator key in lib/activityContent (undefined = reuse href engine). */
  generator?: string;
  /** Where the activity renders. */
  renderer: Renderer;
  /** How answers are validated (deterministic, never LLM). */
  validator: Validator;
  blurb: string;
}

const ALL: Array<"4-5" | "6-7" | "8-9"> = ["4-5", "6-7", "8-9"];
const NUM_DIMS = ["numberRange", "itemCount", "optionCount", "visualSupport"];

export const ACTIVITY_REGISTRY: ActivityDef[] = [
  // ---- Numbers & Math ----
  { id: "number-count", category: "numbers", title: "Count Together", icon: "🍎", skills: ["counting"], ageBands: ALL, activityType: "COUNT_OBJECTS", complexityDimensions: NUM_DIMS, generator: "number-count", renderer: "generic-player", validator: "single-choice", blurb: "Count friendly objects, one at a time." },
  { id: "number-order", category: "numbers", title: "Big to Small", icon: "🔢", skills: ["number-ordering"], ageBands: ALL, activityType: "ORDER_NUMBERS", complexityDimensions: ["numberRange", "itemCount", "optionCount", "visualSupport"], generator: "number-order", renderer: "generic-player", validator: "single-choice", blurb: "Arrange numbers from big to small (or small to big)." },
  { id: "number-before-after", category: "numbers", title: "Before & After", icon: "➡️", skills: ["number-sequencing"], ageBands: ALL, activityType: "BEFORE_AFTER", complexityDimensions: NUM_DIMS, generator: "number-before-after", renderer: "generic-player", validator: "single-choice", blurb: "Find the missing neighbour numbers." },
  { id: "more-less", category: "numbers", title: "More or Less?", icon: "🧁", skills: ["more-less"], ageBands: ALL, activityType: "MORE_LESS", complexityDimensions: ["numberRange", "itemCount", "visualSupport"], generator: "more-less", renderer: "generic-player", validator: "single-choice", blurb: "Which group has more? Which has less?" },
  { id: "number-names", category: "numbers", title: "Number Names", icon: "🔤", skills: ["number-names"], ageBands: ALL, activityType: "NUMBER_TO_WORD", complexityDimensions: ["numberRange", "optionCount", "readingRequirement"], generator: "number-names", renderer: "generic-player", validator: "single-choice", blurb: "Match numbers to their names: 7 → seven." },
  { id: "count-by-tens", category: "numbers", title: "Count by Tens", icon: "🎯", skills: ["count-by-tens"], ageBands: ALL, activityType: "COUNT_BY_TENS", complexityDimensions: ["numberRange", "steps", "visualSupport"], generator: "count-by-tens", renderer: "generic-player", validator: "single-choice", blurb: "10, 20, 30… what comes next?" },
  { id: "addition", category: "numbers", title: "Addition", icon: "➕", skills: ["addition"], ageBands: ALL, activityType: "VISUAL_ADDITION", complexityDimensions: NUM_DIMS, href: "/play/addition", renderer: "game-route", validator: "single-choice", blurb: "Join groups and add — visual stories." },
  { id: "subtraction", category: "numbers", title: "Take Away", icon: "➖", skills: ["subtraction"], ageBands: ALL, activityType: "VISUAL_SUBTRACTION", complexityDimensions: NUM_DIMS, href: "/play/subtraction", renderer: "game-route", validator: "single-choice", blurb: "Watch objects move away, count what is left." },
  // ---- Words & Phonics ----
  { id: "word-family", category: "words", title: "Word Families", icon: "📖", skills: ["phonics"], ageBands: ALL, activityType: "COMPLETE_WORD", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-family", renderer: "generic-player", validator: "single-choice", blurb: "AN, EN, AT… hear the rhyme, build the word." },
  { id: "word-match", category: "words", title: "Read & Match", icon: "👀", skills: ["word-recognition"], ageBands: ALL, activityType: "PICTURE_TO_WORD", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-match", renderer: "generic-player", validator: "single-choice", blurb: "Look carefully — which word matches the picture?" },
  { id: "word-jumble", category: "words", title: "Jumble Time", icon: "🔀", skills: ["phonics"], ageBands: ALL, activityType: "JUMBLE_WORD", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-jumble", renderer: "generic-player", validator: "build-order", blurb: "Unscramble the letters — tap them in order!" },
  { id: "word-builder", category: "words", title: "Build the Word", icon: "🧱", skills: ["phonics", "word-building"], ageBands: ALL, activityType: "BUILD_WORD", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-builder", renderer: "generic-player", validator: "build-order", blurb: "Tap letters into empty slots to build the word." },
  { id: "word-sort", category: "words", title: "Family Baskets", icon: "🧺", skills: ["phonics", "word-sorting"], ageBands: ALL, activityType: "SORT_FAMILY", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-sort", renderer: "generic-player", validator: "sort-choice", blurb: "Which basket rhymes? Sort by word family!" },
  { id: "word-listen", category: "words", title: "Listen & Choose", icon: "🔊", skills: ["phonics", "listening"], ageBands: ALL, activityType: "LISTEN_CHOOSE", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-listen", renderer: "generic-player", validator: "single-choice", blurb: "Listen carefully — which word did you hear?" },
  { id: "word-discovery", category: "words", title: "Rhyme Detectives", icon: "🔍", skills: ["phonics", "word-discovery"], ageBands: ALL, activityType: "DISCOVER_PATTERN", complexityDimensions: ["optionCount", "readingRequirement", "visualSupport"], generator: "word-discovery", renderer: "generic-player", validator: "single-choice", blurb: "What do these words share? Find the pattern!" },
  // ---- Write & Create ----
  { id: "trace-write", category: "write", title: "Trace & Write", icon: "✏️", skills: ["tracing", "writing"], ageBands: ALL, activityType: "TRACE_WORD", complexityDimensions: ["readingRequirement", "writingRequirement", "visualSupport"], generator: "trace-write", renderer: "generic-player", validator: "trace-write", blurb: "Read, trace, then write the word." },
  { id: "trace-number-name", category: "write", title: "Number Name Trace", icon: "🔢", skills: ["number-names", "tracing"], ageBands: ALL, activityType: "TRACE_NUMBER_NAME", complexityDimensions: ["numberRange", "writingRequirement", "visualSupport"], generator: "trace-number-name", renderer: "generic-player", validator: "trace-write", blurb: "Trace number names: o-n-e, t-w-o…" },
  { id: "shadow-sketch", category: "write", title: "Shadow Sketch", icon: "🌟", skills: ["tracing"], ageBands: ALL, activityType: "SHADOW_TRACE", complexityDimensions: ["visualComplexity", "steps"], href: "/play/sketch", renderer: "game-route", validator: "trace-write", blurb: "Trace glowing lines with Bella." },
  // ---- Think & Solve ----
  { id: "big-small", category: "think", title: "Big & Small", icon: "🍎", skills: ["size-comparison"], ageBands: ALL, activityType: "BIGGEST_SMALLEST", complexityDimensions: ["itemCount", "optionCount", "visualComplexity"], generator: "big-small", renderer: "generic-player", validator: "single-choice", blurb: "Find the biggest or the smallest." },
  { id: "matching", category: "think", title: "Find the Match", icon: "👯", skills: ["matching"], ageBands: ALL, activityType: "MATCH_PAIRS", complexityDimensions: ["itemCount", "optionCount", "visualComplexity"], generator: "matching", renderer: "generic-player", validator: "single-choice", blurb: "Look at each one — find its twin!" },
  { id: "odd-one-out", category: "think", title: "Odd One Out", icon: "🦄", skills: ["odd-one-out"], ageBands: ALL, activityType: "ODD_ONE_OUT", complexityDimensions: ["itemCount", "optionCount", "visualComplexity"], generator: "odd-one-out", renderer: "generic-player", validator: "single-choice", blurb: "Three are family. One is different!" },
  { id: "memory", category: "think", title: "Memory Game", icon: "🎩", skills: ["memory"], ageBands: ALL, activityType: "MEMORY_RECALL", complexityDimensions: ["itemCount", "optionCount", "memoryRequirement"], generator: "memory", renderer: "generic-player", validator: "single-choice", blurb: "Look, remember… which one did you see?" },
  { id: "sorting", category: "think", title: "Tidy Up", icon: "🧹", skills: ["sorting"], ageBands: ALL, activityType: "SORT_OBJECTS", complexityDimensions: ["itemCount", "optionCount"], href: "/play/clean-up", renderer: "game-route", validator: "single-choice", blurb: "Sort toys, books and crayons with Pip." },
  // ---- Shapes & Visual ----
  { id: "shape-count", category: "shapes", title: "Shape Search", icon: "🔷", skills: ["shape-counting"], ageBands: ALL, activityType: "COUNT_SHAPES", complexityDimensions: ["itemCount", "optionCount", "visualComplexity", "spatialComplexity"], generator: "shape-count", renderer: "generic-player", validator: "single-choice", blurb: "How many circles, triangles, squares?" },
  { id: "shape-match", category: "shapes", title: "Shape Match", icon: "🟢", skills: ["shape-recognition"], ageBands: ALL, activityType: "SHAPE_MATCH", complexityDimensions: ["optionCount", "visualComplexity", "readingRequirement"], generator: "shape-match", renderer: "generic-player", validator: "single-choice", blurb: "Which name belongs to this shape?" },
  { id: "shape-pattern", category: "shapes", title: "Shape Patterns", icon: "🟡", skills: ["shape-patterns"], ageBands: ALL, activityType: "SHAPE_PATTERN", complexityDimensions: ["itemCount", "patternComplexity", "visualComplexity"], generator: "shape-pattern", renderer: "generic-player", validator: "single-choice", blurb: "Finish the shape pattern!" },
  { id: "pattern", category: "think", title: "What Comes Next?", icon: "🟢", skills: ["patterns"], ageBands: ALL, activityType: "COMPLETE_PATTERN", complexityDimensions: ["itemCount", "patternComplexity", "visualComplexity"], generator: "pattern", renderer: "generic-player", validator: "single-choice", blurb: "Finish the pattern — AB, AAB, ABC." },
  { id: "find-object", category: "think", title: "Find the Different One", icon: "🔍", skills: ["visual-discrimination"], ageBands: ALL, activityType: "FIND_OBJECT", complexityDimensions: ["itemCount", "optionCount", "visualComplexity"], generator: "find-object", renderer: "generic-player", validator: "single-choice", blurb: "Which one is different? Look carefully." },
  // ---- Discover ----
  { id: "discovery", category: "discover", title: "Discovery Time", icon: "🦜", skills: ["discovery"], ageBands: ALL, activityType: "DISCOVER_FACT", complexityDimensions: ["readingRequirement", "visualSupport"], href: "/play/discover", renderer: "game-route", validator: "single-choice", blurb: "Meet animals, colors and nature." },
  // ---- Puzzles ----
  { id: "picture-puzzle", category: "puzzles", title: "Picture Puzzle", icon: "🧩", skills: ["visual-reasoning"], ageBands: ALL, activityType: "PICTURE_PUZZLE", complexityDimensions: ["itemCount", "spatialComplexity", "steps"], href: "/play/puzzle", renderer: "game-route", validator: "single-choice", blurb: "Snap chunky pieces to reveal friends." },
];

export function activityFor(id: string): ActivityDef | null {
  return ACTIVITY_REGISTRY.find((a) => a.id === id) ?? null;
}

export function activitiesForCategory(category: CategoryId): ActivityDef[] {
  return ACTIVITY_REGISTRY.filter((a) => a.category === category);
}
