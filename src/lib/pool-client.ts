import { z } from "zod";

// Client-side pool access (BR-201 prefetch, DEC-162). Pool output is treated
// as UNTRUSTED (DEC-071): every item is re-validated locally — math recomputed,
// exactly-one-correct enforced — before it can reach gameplay.

// NOTE: This module must stay free of `@/` runtime imports so tests can import
// the real TS directly via node type-stripping. Content shapes are declared
// structurally here and must match src/games/addition.ts + subtraction.ts.

// Structural mirror of AdditionContent { a, b, answers, correctAnswer }.
export interface AdditionLike {
  a: number;
  b: number;
  answers: number[];
  correctAnswer: number;
}

// Structural mirror of SubtractionContent { start, removed, answers, correctAnswer }.
export interface SubtractionLike {
  start: number;
  removed: number;
  answers: number[];
  correctAnswer: number;
}

const PoolItemSchema = z.object({
  contentId: z.string().min(1),
  difficulty: z.number().int(),
  theme: z.string().optional(),
  type: z.string(),
  question: z.record(z.unknown()),
  objects: z.record(z.unknown()).optional(),
  answers: z.array(z.number()).optional(),
  correctAnswer: z.number().optional(),
});

export type PoolItem = z.infer<typeof PoolItemSchema>;

export type PoolGameId = "addition" | "subtraction" | "clean-up" | "puzzle" | "sketch";

export async function fetchPool(gameId: PoolGameId, difficulty: number, limit: number): Promise<PoolItem[]> {
  const res = await fetch(
    `/api/games/${gameId}/content?difficulty=${difficulty}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`pool request failed: ${res.status}`);
  const body: unknown = await res.json();
  const items = z.array(PoolItemSchema).safeParse((body as { data?: { items?: unknown } })?.data?.items);
  if (!items.success) throw new Error("pool response shape invalid");
  return items.data;
}

function validOptions(answers: number[], correct: number): boolean {
  if (answers.length < 3 || answers.length > 4) return false;
  if (new Set(answers).size !== answers.length) return false;
  return answers.filter((a) => a === correct).length === 1;
}

export function toAdditionContent(item: PoolItem): AdditionLike | null {
  const q = item.question as { a?: unknown; b?: unknown };
  if (!Number.isInteger(q.a) || !Number.isInteger(q.b)) return null;
  const a = q.a as number;
  const b = q.b as number;
  if (a < 0 || b < 0 || a > 20 || b > 20) return null;
  const correct = a + b; // authoritative recompute — pool value never trusted
  if (item.correctAnswer !== correct) return null;
  if (!item.answers || !validOptions(item.answers, correct)) return null;
  return { a, b, answers: item.answers, correctAnswer: correct };
}

export function toSubtractionContent(item: PoolItem): SubtractionLike | null {
  const q = item.question as { start?: unknown; removed?: unknown };
  if (!Number.isInteger(q.start) || !Number.isInteger(q.removed)) return null;
  const start = q.start as number;
  const removed = q.removed as number;
  if (start < 1 || start > 20 || removed < 0 || removed > 20) return null;
  if (removed > start) return null; // BR-040 non-negative
  const correct = start - removed;
  if (item.correctAnswer !== correct) return null;
  if (!item.answers || !validOptions(item.answers, correct)) return null;
  return { start, removed, answers: item.answers, correctAnswer: correct };
}

// Structural mirror of CleanupSceneDef { theme, targets, nonTargets }.
export interface CleanupLike {
  theme: string;
  targets: { targetId: string; emoji: string; x: number; y: number }[];
  nonTargets: { id: string; emoji: string; x: number; y: number }[];
}

function inBounds(x: unknown, y: unknown): boolean {
  return typeof x === "number" && typeof y === "number" && x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

export function toCleanupContent(item: PoolItem): CleanupLike | null {
  // The content API places the scene definition in `question` for clean-up.
  const obj = item.question as {
    theme?: unknown;
    targets?: unknown;
    nonTargets?: unknown;
  };
  if (typeof obj.theme !== "string" || obj.theme.length === 0) return null;
  if (!Array.isArray(obj.targets) || obj.targets.length < 2 || obj.targets.length > 8) return null;
  const ids = new Set<string>();
  const targets: CleanupLike["targets"] = [];
  for (const t of obj.targets as Array<{ targetId?: unknown; emoji?: unknown; x?: unknown; y?: unknown }>) {
    if (typeof t.targetId !== "string" || typeof t.emoji !== "string" || t.emoji.length === 0) return null;
    if (!inBounds(t.x, t.y)) return null;
    if (ids.has(t.targetId)) return null; // BR-063-style: unique piece IDs
    ids.add(t.targetId);
    targets.push({ targetId: t.targetId, emoji: t.emoji, x: t.x as number, y: t.y as number });
  }
  const nonTargets: CleanupLike["nonTargets"] = [];
  if (Array.isArray(obj.nonTargets)) {
    if (obj.nonTargets.length > 10) return null;
    for (const d of obj.nonTargets as Array<{ id?: unknown; emoji?: unknown; x?: unknown; y?: unknown }>) {
      if (typeof d.id !== "string" || typeof d.emoji !== "string") return null;
      if (!inBounds(d.x, d.y)) return null;
      nonTargets.push({ id: d.id, emoji: d.emoji, x: d.x as number, y: d.y as number });
    }
  }
  return { theme: obj.theme, targets, nonTargets };
}

// Structural mirror of PuzzleDef { picture, rows, columns, pieces }.
export interface PuzzleLike {
  picture: string[];
  rows: number;
  columns: number;
  pieces: { pieceId: string; correctPosition: number; emoji: string }[];
}

export function toPuzzleContent(item: PoolItem): PuzzleLike | null {
  const obj = item.question as {
    picture?: unknown;
    rows?: unknown;
    columns?: unknown;
    pieces?: unknown;
  };
  if (!Number.isInteger(obj.rows) || !Number.isInteger(obj.columns)) return null;
  const rows = obj.rows as number;
  const columns = obj.columns as number;
  if (rows < 2 || rows > 3 || columns < 2 || columns > 3) return null;
  const n = rows * columns;
  if (!Array.isArray(obj.picture) || obj.picture.length !== n) return null;
  if (!Array.isArray(obj.pieces) || obj.pieces.length !== n) return null;
  const ids = new Set<string>();
  const positions: number[] = [];
  const pieces: PuzzleLike["pieces"] = [];
  for (const p of obj.pieces as Array<{ pieceId?: unknown; correctPosition?: unknown; emoji?: unknown }>) {
    if (typeof p.pieceId !== "string" || typeof p.emoji !== "string") return null;
    if (!Number.isInteger(p.correctPosition)) return null;
    if (ids.has(p.pieceId)) return null;
    ids.add(p.pieceId);
    positions.push(p.correctPosition as number);
    pieces.push({ pieceId: p.pieceId, correctPosition: p.correctPosition as number, emoji: p.emoji });
  }
  // Every piece exactly one slot; all slots covered (BR-061).
  const sorted = [...positions].sort((x, y) => x - y);
  if (!sorted.every((v, i) => v === i)) return null;
  if (!(obj.picture as unknown[]).every((e) => typeof e === "string")) return null;
  return { picture: obj.picture as string[], rows, columns, pieces };
}

// Structural mirror of SketchDef { shape, guidePath, tolerance, coverageThreshold }.
export interface SketchLike {
  shape: string;
  guidePath: { x: number; y: number }[];
  tolerance: number;
  coverageThreshold: number;
}

export function toSketchContent(item: PoolItem): SketchLike | null {
  const obj = item.question as {
    shape?: unknown;
    guidePath?: unknown;
    tolerance?: unknown;
    coverageThreshold?: unknown;
  };
  if (typeof obj.shape !== "string" || obj.shape.length === 0) return null;
  if (!Array.isArray(obj.guidePath) || obj.guidePath.length < 8 || obj.guidePath.length > 200) return null;
  for (const p of obj.guidePath as Array<{ x?: unknown; y?: unknown }>) {
    if (!inBounds(p.x, p.y)) return null;
  }
  const tolerance = typeof obj.tolerance === "number" ? obj.tolerance : 9;
  const coverageThreshold = typeof obj.coverageThreshold === "number" ? obj.coverageThreshold : 0.6;
  if (tolerance < 3 || tolerance > 20 || coverageThreshold < 0.3 || coverageThreshold > 0.9) return null;
  return {
    shape: obj.shape,
    guidePath: obj.guidePath as { x: number; y: number }[],
    tolerance,
    coverageThreshold,
  };
}
