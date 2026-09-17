import { z } from "zod";
import { mulberry32, type GameDefinition } from "./framework.ts";
import { hashSeed } from "./cleanup.ts";

// BR-070..073 — tracing: valid outline asset (guide path), deterministic
// geometry evaluation, no pixel-perfect requirement, positive feedback.

export const GuidePointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const SketchDefSchema = z.object({
  shape: z.string().min(1).max(30),
  guidePath: z.array(GuidePointSchema).min(8).max(200),
  tolerance: z.number().min(3).max(20),
  coverageThreshold: z.number().min(0.3).max(0.9),
});

export type SketchDef = z.infer<typeof SketchDefSchema>;

// Task types supported by the existing canvas (all are "trace this path"
// mechanically; pedagogy varies). Kept minimal per canvas architecture.
export const SketchTaskSchema = z.enum(["trace", "dots", "pattern"]);
export type SketchTask = z.infer<typeof SketchTaskSchema>;

// Full activity: definition + child-facing copy. All new fields are optional
// so every existing pool item, fallback, and test stays valid on the wire.
export const SketchActivitySchema = SketchDefSchema.extend({
  taskType: SketchTaskSchema.optional(),
  instruction: z.string().min(1).max(80).optional(),
  hint: z.string().min(1).max(160).optional(),
});

export type SketchActivity = z.infer<typeof SketchActivitySchema>;

function circle(n = 56): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return { x: 50 + 34 * Math.cos(t), y: 50 + 34 * Math.sin(t) };
  });
}

function polygon(vertices: { x: number; y: number }[], per = 16): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let v = 0; v < vertices.length; v++) {
    const a = vertices[v];
    const b = vertices[(v + 1) % vertices.length];
    for (let i = 0; i < per; i++) {
      pts.push({ x: a.x + ((b.x - a.x) * i) / per, y: a.y + ((b.y - a.y) * i) / per });
    }
  }
  return pts;
}

function star(): { x: number; y: number }[] {
  const outer = 34;
  const inner = 14;
  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const t = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    verts.push({ x: 50 + r * Math.cos(t), y: 50 + r * Math.sin(t) });
  }
  return polygon(verts, 7);
}

export const SKETCH_SHAPES = ["circle", "square", "triangle", "star"] as const;

// Point-set helpers (0–100 guide space). Evaluation is proximity coverage,
// so multi-part drawings (house = square + roof) work as one point set.
function circleAt(cx: number, cy: number, r: number, n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
  });
}

function linePts(ax: number, ay: number, bx: number, by: number, n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: ax + ((bx - ax) * i) / Math.max(1, n - 1),
    y: ay + ((by - ay) * i) / Math.max(1, n - 1),
  }));
}

export function guideForShape(shape: string): { x: number; y: number }[] {
  if (shape === "square") return polygon([{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }]);
  if (shape === "triangle") return polygon([{ x: 50, y: 14 }, { x: 84, y: 78 }, { x: 16, y: 78 }]);
  if (shape === "star") return star();
  if (shape === "rectangle") return polygon([{ x: 18, y: 32 }, { x: 82, y: 32 }, { x: 82, y: 68 }, { x: 18, y: 68 }], 14);
  if (shape === "house")
    return [
      ...polygon([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 64, y: 84 }, { x: 22, y: 84 }], 16),
      ...polygon([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 43, y: 16 }], 16),
    ];
  if (shape === "sun")
    return [...circleAt(50, 44, 20, 48), ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((k) => {
      const t = (k / 8) * Math.PI * 2;
      return linePts(50 + 26 * Math.cos(t), 44 + 26 * Math.sin(t), 50 + 36 * Math.cos(t), 44 + 36 * Math.sin(t), 6);
    })];
  if (shape === "tree")
    return [...linePts(50, 95, 50, 62, 12), ...polygon([{ x: 50, y: 12 }, { x: 80, y: 62 }, { x: 20, y: 62 }], 16)];
  if (shape === "flower")
    return [...circleAt(50, 50, 8, 20), ...[0, 1, 2, 3, 4, 5].flatMap((k) => {
      const t = (k / 6) * Math.PI * 2;
      return circleAt(50 + 20 * Math.cos(t), 50 + 20 * Math.sin(t), 9, 12);
    })];
  if (shape === "balloon") return [...circleAt(50, 38, 24, 48), ...linePts(50, 62, 50, 95, 10)];
  if (shape === "cloud")
    return [...circleAt(35, 56, 14, 24), ...circleAt(52, 48, 17, 28), ...circleAt(68, 56, 13, 22)];
  if (shape === "fish")
    return [...circleAt(42, 50, 20, 48), ...polygon([{ x: 60, y: 50 }, { x: 82, y: 32 }, { x: 82, y: 68 }], 8)];
  if (shape === "car")
    return [...polygon([{ x: 14, y: 55 }, { x: 86, y: 55 }, { x: 86, y: 74 }, { x: 14, y: 74 }], 12), ...circleAt(31, 78, 8, 14), ...circleAt(69, 78, 8, 14)];
  if (shape === "boat")
    return [...polygon([{ x: 18, y: 62 }, { x: 82, y: 62 }, { x: 68, y: 82 }, { x: 32, y: 82 }], 12), ...linePts(50, 62, 50, 24, 10), ...polygon([{ x: 50, y: 24 }, { x: 50, y: 58 }, { x: 74, y: 58 }], 8)];
  if (shape === "rocket")
    return [...polygon([{ x: 50, y: 6 }, { x: 62, y: 30 }, { x: 62, y: 64 }, { x: 38, y: 64 }, { x: 38, y: 30 }], 10), ...circleAt(50, 40, 7, 14), ...linePts(50, 64, 50, 86, 8)];
  if (shape === "butterfly")
    return [...circleAt(31, 50, 20, 36), ...circleAt(69, 50, 20, 36), ...linePts(50, 24, 50, 78, 14)];
  if (shape === "kite")
    return [...polygon([{ x: 50, y: 10 }, { x: 78, y: 45 }, { x: 50, y: 78 }, { x: 22, y: 45 }], 12), ...linePts(50, 78, 50, 97, 6)];
  if (shape === "robot")
    return [...polygon([{ x: 32, y: 12 }, { x: 68, y: 12 }, { x: 68, y: 42 }, { x: 32, y: 42 }], 10), ...polygon([{ x: 28, y: 48 }, { x: 72, y: 48 }, { x: 72, y: 88 }, { x: 28, y: 88 }], 12)];
  if (shape === "pattern-triangles")
    return [8, 38, 68].flatMap((x0) => polygon([{ x: x0, y: 68 }, { x: x0 + 24, y: 68 }, { x: x0 + 12, y: 40 }], 8));
  if (shape === "dots-star") {
    const outer = 34;
    const inner = 14;
    const verts: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const t = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      verts.push({ x: 50 + r * Math.cos(t), y: 50 + r * Math.sin(t) });
    }
    return polygon(verts, 3);
  }
  if (shape === "dots-house")
    return [...polygon([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 64, y: 84 }, { x: 22, y: 84 }], 4), ...polygon([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 43, y: 16 }], 4)];
  if (shape === "landscape")
    return [...linePts(5, 80, 25, 40, 12), ...linePts(25, 40, 45, 75, 12), ...linePts(45, 75, 65, 35, 12), ...linePts(65, 35, 85, 80, 12), ...circleAt(80, 16, 8, 16)];
  if (shape === "cat")
    return [...circleAt(50, 56, 22, 48), ...polygon([{ x: 32, y: 44 }, { x: 40, y: 22 }, { x: 47, y: 41 }], 6), ...polygon([{ x: 53, y: 41 }, { x: 60, y: 22 }, { x: 68, y: 44 }], 6)];
  return circle();
}

// Leveled activity catalog: shape + task + child copy. Levels follow the
// learner progression (1–5): shapes → objects → combos → patterns → scenes.
export interface SketchCatalogEntry {
  shape: string;
  level: number;
  taskType: SketchTask;
  instruction: string;
  hint: string;
}

export const SKETCH_ACTIVITIES: SketchCatalogEntry[] = [
  { shape: "circle", level: 1, taskType: "trace", instruction: "Trace the circle.", hint: "Follow the dots all the way around." },
  { shape: "square", level: 1, taskType: "trace", instruction: "Trace the square.", hint: "Go slowly around the four corners." },
  { shape: "triangle", level: 1, taskType: "trace", instruction: "Trace the triangle.", hint: "Three sides — start at the top." },
  { shape: "rectangle", level: 1, taskType: "trace", instruction: "Trace the rectangle.", hint: "Long side, short side, long side, short side." },
  { shape: "dots-star", level: 1, taskType: "dots", instruction: "Connect the dots to make a star.", hint: "Start at the top dot, then go to the next one." },
  { shape: "sun", level: 2, taskType: "trace", instruction: "Trace the sunny sun.", hint: "Circle first, then the little rays." },
  { shape: "tree", level: 2, taskType: "trace", instruction: "Trace the tree.", hint: "Trunk first, then the leaves on top." },
  { shape: "flower", level: 2, taskType: "trace", instruction: "Trace the flower.", hint: "Middle first, then each petal." },
  { shape: "balloon", level: 2, taskType: "trace", instruction: "Trace the balloon.", hint: "Round and round, then draw the string." },
  { shape: "cloud", level: 2, taskType: "trace", instruction: "Trace the fluffy cloud.", hint: "Bump over bump, nice and slow." },
  { shape: "fish", level: 2, taskType: "trace", instruction: "Trace the fish.", hint: "Body first, then the tail." },
  { shape: "car", level: 2, taskType: "trace", instruction: "Trace the car.", hint: "Body first, then the two round wheels." },
  { shape: "house", level: 3, taskType: "trace", instruction: "Draw a house like the example.", hint: "Start with the square body." },
  { shape: "rocket", level: 3, taskType: "trace", instruction: "Trace the rocket.", hint: "Nose at the top, fire at the bottom." },
  { shape: "boat", level: 3, taskType: "trace", instruction: "Trace the boat.", hint: "Hull first, then the tall sail." },
  { shape: "butterfly", level: 3, taskType: "trace", instruction: "Trace both wings to match.", hint: "Left side, then right side — make them match." },
  { shape: "kite", level: 3, taskType: "trace", instruction: "Trace the kite.", hint: "Diamond first, then the long tail." },
  { shape: "robot", level: 3, taskType: "trace", instruction: "Trace the robot.", hint: "Head first, then the big body." },
  { shape: "pattern-triangles", level: 4, taskType: "pattern", instruction: "Continue the pattern.", hint: "Look at the first two shapes. What comes next?" },
  { shape: "dots-house", level: 4, taskType: "dots", instruction: "Connect the dots to build the house.", hint: "One dot to the next, all the way around." },
  { shape: "star", level: 4, taskType: "trace", instruction: "Trace the big star.", hint: "Five points — take your time." },
  { shape: "landscape", level: 5, taskType: "trace", instruction: "Trace the mountains.", hint: "Up one mountain, down, then up the next." },
  { shape: "cat", level: 5, taskType: "trace", instruction: "Trace the cat.", hint: "Round head first, then the pointy ears." },
];

const SKETCH_TOLERANCE_BY_LEVEL: Record<number, number> = { 1: 14, 2: 12, 3: 10, 4: 9, 5: 8 };

export function createSketchDef(seedStr: string, difficulty: 1 | 2 | 3): SketchDef {
  const rand = mulberry32(hashSeed(seedStr));
  const pool = difficulty === 1 ? ["circle", "square"] : difficulty === 2 ? ["circle", "square", "triangle"] : SKETCH_SHAPES;
  const shape = pool[Math.floor(rand() * pool.length)] as string;
  return SketchDefSchema.parse({
    shape,
    guidePath: guideForShape(shape),
    tolerance: difficulty === 3 ? 7 : 9,
    coverageThreshold: 0.6,
  });
}

// Level-aware activity builder: picks a catalog entry for the band, then
// materializes its guide. Deterministic per seed; same seed ⇒ same activity.
export function createSketchActivity(seedStr: string, level: number): SketchActivity {
  const band = Math.max(1, Math.min(5, Math.floor(level) || 1));
  const entries = SKETCH_ACTIVITIES.filter((e) => e.level === band);
  const pool = entries.length > 0 ? entries : SKETCH_ACTIVITIES.filter((e) => e.level === 1);
  const rand = mulberry32(hashSeed(seedStr));
  const entry = pool[Math.floor(rand() * pool.length)];
  return SketchActivitySchema.parse({
    shape: entry.shape,
    guidePath: guideForShape(entry.shape),
    tolerance: SKETCH_TOLERANCE_BY_LEVEL[band] ?? 10,
    coverageThreshold: band === 1 ? 0.5 : 0.6,
    taskType: entry.taskType,
    instruction: entry.instruction,
    hint: entry.hint,
  });
}

export const sketchGame: GameDefinition<{ seed: string; difficulty: 1 | 2 | 3 }> = {
  id: "sketch",
  name: "Shadow Sketch",
  learningObjectives: ["FINE_MOTOR", "TRACING"],
  createRound: ({ difficulty, round }) => ({ seed: `local-skt-${Date.now() % 2147483647}-${round}`, difficulty }),
  validate: () => true,
  correctAnswer: () => 1,
  isComplete: (played, total) => played >= total,
};
