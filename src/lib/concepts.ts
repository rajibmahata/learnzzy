// Stable educational concept model — the cross-provider bridge between
// Game, Analytics, Tutor/OER/NCERT, Learning Planner, and Parent Progress.
// Concept IDs are stable strings; gameIds are NOT the educational model.
export interface Concept {
  id: string;
  domain: string;
  name: string;
  ageBands: ("4-5" | "6-7" | "8-9")[];
  prerequisites: string[];
  games: string[];
}

export const CONCEPTS: Concept[] = [
  { id: "math.number.recognition", domain: "mathematics", name: "Number recognition", ageBands: ["4-5", "6-7", "8-9"], prerequisites: [], games: ["addition"] },
  { id: "math.counting.objects", domain: "mathematics", name: "Counting objects", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["math.number.recognition"], games: ["addition", "clean-up"] },
  { id: "math.addition.within5", domain: "mathematics", name: "Addition within 5", ageBands: ["4-5", "6-7"], prerequisites: ["math.counting.objects"], games: ["addition"] },
  { id: "math.addition.within10", domain: "mathematics", name: "Addition within 10", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["math.addition.within5"], games: ["addition"] },
  { id: "math.addition.within20", domain: "mathematics", name: "Addition within 20", ageBands: ["6-7", "8-9"], prerequisites: ["math.addition.within10"], games: ["addition"] },
  { id: "math.subtraction.within5", domain: "mathematics", name: "Subtraction within 5", ageBands: ["4-5", "6-7"], prerequisites: ["math.counting.objects"], games: ["subtraction"] },
  { id: "math.subtraction.within10", domain: "mathematics", name: "Subtraction within 10", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["math.subtraction.within5", "math.addition.within5"], games: ["subtraction"] },
  { id: "math.subtraction.within20", domain: "mathematics", name: "Subtraction within 20", ageBands: ["6-7", "8-9"], prerequisites: ["math.subtraction.within10"], games: ["subtraction"] },
  { id: "cognition.visual-discrimination", domain: "cognition", name: "Visual discrimination", ageBands: ["4-5", "6-7", "8-9"], prerequisites: [], games: ["clean-up", "puzzle"] },
  { id: "cognition.sorting", domain: "cognition", name: "Sorting and tidying", ageBands: ["4-5", "6-7"], prerequisites: ["cognition.visual-discrimination"], games: ["clean-up"] },
  { id: "spatial.part-whole", domain: "spatial", name: "Part–whole relationships", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["cognition.visual-discrimination"], games: ["puzzle"] },
  { id: "spatial.rotation", domain: "spatial", name: "Mental rotation", ageBands: ["6-7", "8-9"], prerequisites: ["spatial.part-whole"], games: ["puzzle"] },
  { id: "motor.tracing", domain: "fine-motor", name: "Tracing and control", ageBands: ["4-5", "6-7", "8-9"], prerequisites: [], games: ["sketch"] },
  { id: "geometry.shapes", domain: "mathematics", name: "Shape recognition", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["cognition.visual-discrimination"], games: ["sketch", "puzzle"] },
  { id: "knowledge.world-discovery", domain: "knowledge", name: "World discovery", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["cognition.visual-discrimination"], games: ["discover"] },
  { id: "language.first-words", domain: "language", name: "First words", ageBands: ["4-5", "6-7", "8-9"], prerequisites: ["knowledge.world-discovery"], games: ["discover"] },
];

const byId = new Map(CONCEPTS.map((c) => [c.id, c]));

export function getConceptDef(conceptId: string): Concept | null {
  return byId.get(conceptId) ?? null;
}

// Deterministic gameId + level → conceptIds. Pure function, no I/O.
export function conceptsForGame(gameId: string, level: number): string[] {
  const lvl = Math.max(1, Math.min(5, Math.floor(level)));
  switch (gameId) {
    case "addition":
      if (lvl <= 1) return ["math.number.recognition", "math.counting.objects", "math.addition.within5"];
      if (lvl === 2) return ["math.addition.within5", "math.addition.within10"];
      if (lvl === 3) return ["math.addition.within10"];
      return ["math.addition.within10", "math.addition.within20"];
    case "subtraction":
      if (lvl <= 1) return ["math.counting.objects", "math.subtraction.within5"];
      if (lvl === 2) return ["math.subtraction.within5", "math.subtraction.within10"];
      if (lvl === 3) return ["math.subtraction.within10"];
      return ["math.subtraction.within10", "math.subtraction.within20"];
    case "clean-up":
      return lvl <= 2
        ? ["cognition.visual-discrimination", "cognition.sorting"]
        : ["cognition.sorting", "math.counting.objects"];
    case "puzzle":
      return lvl <= 2
        ? ["cognition.visual-discrimination", "spatial.part-whole", "geometry.shapes"]
        : ["spatial.part-whole", "spatial.rotation", "geometry.shapes"];
    case "sketch":
      return lvl <= 2 ? ["motor.tracing", "geometry.shapes"] : ["motor.tracing", "geometry.shapes", "spatial.part-whole"];
    case "discover":
      return lvl <= 2
        ? ["knowledge.world-discovery", "language.first-words"]
        : ["knowledge.world-discovery", "language.first-words", "cognition.visual-discrimination"];
    default:
      return [];
  }
}

