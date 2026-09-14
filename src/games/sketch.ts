import { z } from "zod";
import { mulberry32, type GameDefinition } from "./framework";
import { hashSeed } from "./cleanup";

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

export function guideForShape(shape: string): { x: number; y: number }[] {
  if (shape === "square") return polygon([{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }]);
  if (shape === "triangle") return polygon([{ x: 50, y: 14 }, { x: 84, y: 78 }, { x: 16, y: 78 }]);
  if (shape === "star") return star();
  return circle();
}

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

export const sketchGame: GameDefinition<{ seed: string; difficulty: 1 | 2 | 3 }> = {
  id: "sketch",
  name: "Shadow Sketch",
  learningObjectives: ["FINE_MOTOR", "TRACING"],
  createRound: ({ difficulty, round }) => ({ seed: `local-skt-${Date.now() % 2147483647}-${round}`, difficulty }),
  validate: () => true,
  correctAnswer: () => 1,
  isComplete: (played, total) => played >= total,
};
