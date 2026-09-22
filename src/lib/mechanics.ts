// Reusable game primitives — composition over 100 isolated games.
// Each primitive is a pure interaction pattern; activities compose them:
// BalloonPop + Addition + Dinosaur Theme = Dinosaur Balloon Addition
// No LLM, deterministic, mobile/PWA safe.

export type MechanicId =
  | "BalloonPop"
  | "ObjectCollect"
  | "ObjectSort"
  | "DragDrop"
  | "TapTarget"
  | "ObjectCount"
  | "MatchPairs"
  | "MemoryCards"
  | "PathBuilder"
  | "SequenceBuilder"
  | "WordBuilder"
  | "Trace"
  | "Paint"
  | "FindObject"
  | "HiddenObject"
  | "StoryChoice"
  | "SceneExplorer"
  | "BuildObject"
  | "ArrangeObjects";

export interface MechanicDef {
  id: MechanicId;
  description: string;
  interaction: "tap" | "drag" | "trace" | "type" | "choice";
  reusableFor: string[]; // skills that can use this mechanic
  component?: string; // hint for renderer
}

export const MECHANICS: MechanicDef[] = [
  { id: "BalloonPop", description: "Tap/type to pop floating balloons", interaction: "tap", reusableFor: ["addition", "subtraction", "counting", "color-recognition", "letter-recognition"], component: "BalloonStage" },
  { id: "ObjectCollect", description: "Collect correct number of objects", interaction: "tap", reusableFor: ["counting", "addition", "sorting"], component: "AdditionStage" },
  { id: "ObjectSort", description: "Sort objects into color/group buckets", interaction: "drag", reusableFor: ["sorting", "color-recognition", "classification"], component: "CleanupStage" },
  { id: "DragDrop", description: "Drag to correct home", interaction: "drag", reusableFor: ["puzzle", "word-building"], component: "PuzzleStage" },
  { id: "TapTarget", description: "Tap the requested target", interaction: "tap", reusableFor: ["animal-recognition", "find-object"], component: "TapTarget" },
  { id: "ObjectCount", description: "Count objects in scene", interaction: "tap", reusableFor: ["counting", "comparison"], component: "AdditionStage" },
  { id: "MatchPairs", description: "Find matching pairs", interaction: "tap", reusableFor: ["matching", "memory"], component: "MatchPairs" },
  { id: "MemoryCards", description: "Remember positions", interaction: "tap", reusableFor: ["memory"], component: "MemoryStage" },
  { id: "PathBuilder", description: "Build path UP/RIGHT etc. to star", interaction: "tap", reusableFor: ["sequencing", "planning"], component: "RobotPathStage" },
  { id: "SequenceBuilder", description: "Order sequence", interaction: "drag", reusableFor: ["sequencing", "number-ordering"], component: "SequenceStage" },
  { id: "WordBuilder", description: "Drag letters to build word", interaction: "drag", reusableFor: ["phonics", "word-building"], component: "WordBuilderStage" },
  { id: "Trace", description: "Trace glowing path", interaction: "trace", reusableFor: ["tracing", "writing"], component: "SketchStage" },
  { id: "Paint", description: "Paint scene", interaction: "trace", reusableFor: ["creativity", "color-recognition"], component: "PaintStage" },
  { id: "FindObject", description: "Find hidden object", interaction: "tap", reusableFor: ["observation", "visual-discrimination"], component: "FindStage" },
  { id: "HiddenObject", description: "Hidden object in scene", interaction: "tap", reusableFor: ["observation"], component: "HiddenStage" },
  { id: "StoryChoice", description: "Choose story path", interaction: "choice", reusableFor: ["comprehension", "decision"], component: "StoryStage" },
  { id: "SceneExplorer", description: "Explore scene and discover", interaction: "tap", reusableFor: ["discovery", "animal-recognition"], component: "SceneExplorer" },
  { id: "BuildObject", description: "Build creature/object", interaction: "tap", reusableFor: ["creativity"], component: "BuildStage" },
  { id: "ArrangeObjects", description: "Arrange objects", interaction: "drag", reusableFor: ["spatial", "creativity"], component: "ArrangeStage" },
];

export function mechanicFor(id: MechanicId): MechanicDef | null {
  return MECHANICS.find((m) => m.id === id) ?? null;
}

// Multi-level mapping — same skill, mechanic evolves per level, not just number++
// Example BALLOON COUNT 1→8 keeps addition skill but changes mechanic/theme.
// For addition, levels map to mechanics/themes; for colors, patterns evolve.
export const SKILL_LEVEL_MECHANICS: Record<string, { level: number; mechanic: MechanicId; theme: string; description: string }[]> = {
  addition: [
    { level: 1, mechanic: "BalloonPop", theme: "balloons", description: "1–3 balloons" },
    { level: 2, mechanic: "BalloonPop", theme: "balloons", description: "1–5 balloons" },
    { level: 3, mechanic: "BalloonPop", theme: "balloons", description: "1–10 balloons" },
    { level: 4, mechanic: "ObjectCollect", theme: "dinosaur-eggs", description: "two groups" },
    { level: 5, mechanic: "ObjectCollect", theme: "fruit-basket", description: "addition via fruit" },
    { level: 6, mechanic: "TapTarget", theme: "treasure", description: "missing number" },
    { level: 7, mechanic: "StoryChoice", theme: "word-problem", description: "visual word problem" },
    { level: 8, mechanic: "ObjectCollect", theme: "multi-step", description: "multi-step challenge" },
  ],
  "color-recognition": [
    { level: 1, mechanic: "TapTarget", theme: "basic-colors", description: "basic colors" },
    { level: 2, mechanic: "TapTarget", theme: "multiple-colors", description: "multiple colors" },
    { level: 3, mechanic: "MatchPairs", theme: "color-matching", description: "color matching" },
    { level: 4, mechanic: "ObjectSort", theme: "color-patterns", description: "patterns" },
    { level: 5, mechanic: "ObjectSort", theme: "mixed-colors", description: "mixed colors" },
    { level: 6, mechanic: "ObjectSort", theme: "classification", description: "classification" },
    { level: 7, mechanic: "FindObject", theme: "color-logic", description: "color-based logic" },
  ],
};

export function mechanicForSkillAtLevel(skill: string, level: number): { mechanic: MechanicId; theme: string } | null {
  const list = SKILL_LEVEL_MECHANICS[skill];
  if (!list) return null;
  const clamped = Math.max(1, Math.min(8, level));
  const entry = list.find((e) => e.level === clamped) ?? list[list.length - 1];
  if (!entry) return null;
  return { mechanic: entry.mechanic, theme: entry.theme };
}
