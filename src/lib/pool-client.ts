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
  /** Validated visual-theme id (Number Orchard). Display-only; math never reads it. */
  objectType?: string;
}

// Structural mirror of SubtractionContent { start, removed, answers, correctAnswer }.
export interface SubtractionLike {
  start: number;
  removed: number;
  answers: number[];
  correctAnswer: number;
  /** Validated visual-theme id (Breeze Valley). Display-only; math never reads it. */
  objectType?: string;
}

// Canonical display ids live in src/lib/visualThemes.ts (VISUAL_THEMES);
// this allowlist is inlined here because pool-client must stay free of `@/`
// runtime imports (node type-stripping tests). Keep the two lists in sync.
const OBJECT_IDS = new Set([
  "teddy",
  "apple",
  "mango",
  "star",
  "car",
  "fish",
  "balloon",
  "butterfly",
  "puppy",
  "rocket",
]);

/** Extract a validated theme id from a pool item's `objects` record (or undefined). */
function readObjectType(objects: Record<string, unknown> | undefined): string | undefined {
  const t = objects?.type;
  return typeof t === "string" && OBJECT_IDS.has(t) ? t : undefined;
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

export class PoolAccessError extends Error {
  readonly code: "LEVEL_LOCKED" | "LEARNER_NOT_FOUND";

  constructor(code: "LEVEL_LOCKED" | "LEARNER_NOT_FOUND") {
    super(code);
    this.code = code;
    this.name = "PoolAccessError";
  }
}

export async function fetchPool(
  gameId: PoolGameId,
  difficulty: number,
  limit: number,
  options: { level?: number; ageBand?: string; learnerId?: string; seed?: number; recentIds?: string[] } = {}
): Promise<PoolItem[]> {
  const query = new URLSearchParams({ difficulty: String(difficulty), limit: String(limit) });
  if (options.level !== undefined) query.set("level", String(options.level));
  if (options.ageBand) query.set("ageBand", options.ageBand);
  if (options.learnerId) query.set("learnerId", options.learnerId);
  if (options.seed !== undefined) query.set("seed", String(options.seed));
  if (options.recentIds?.length) query.set("recent", options.recentIds.join(","));
  // Bounded fetch: a hanging content API must degrade to deterministic local
  // rounds (BR-200/222) instead of leaving the stage on its loader forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(
      `/api/games/${gameId}/content?${query.toString()}`,
      { cache: "no-store", signal: controller.signal }
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 403) throw new PoolAccessError("LEVEL_LOCKED");
  if (res.status === 404) throw new PoolAccessError("LEARNER_NOT_FOUND");
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
  if (a < 0 || b < 0 || a > 40 || b > 40) return null;
  const correct = a + b; // authoritative recompute — pool value never trusted
  // correctAnswer is optional on the wire (server no longer exposes answers);
  // when present it must match the recomputed value (pool integrity check).
  if (item.correctAnswer !== undefined && item.correctAnswer !== correct) return null;
  if (!item.answers || !validOptions(item.answers, correct)) return null;
  const objectType = readObjectType(item.objects);
  return { a, b, answers: item.answers, correctAnswer: correct, ...(objectType ? { objectType } : {}) };
}

export function toSubtractionContent(item: PoolItem): SubtractionLike | null {
  const q = item.question as { start?: unknown; removed?: unknown };
  if (!Number.isInteger(q.start) || !Number.isInteger(q.removed)) return null;
  const start = q.start as number;
  const removed = q.removed as number;
  if (start < 1 || start > 40 || removed < 0 || removed > 40) return null;
  if (removed > start) return null; // BR-040 non-negative
  const correct = start - removed;
  if (item.correctAnswer !== undefined && item.correctAnswer !== correct) return null;
  if (!item.answers || !validOptions(item.answers, correct)) return null;
  const objectType = readObjectType(item.objects);
  return { start, removed, answers: item.answers, correctAnswer: correct, ...(objectType ? { objectType } : {}) };
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

// Structural mirror of SketchActivity { shape, guidePath, tolerance,
// coverageThreshold, taskType?, instruction?, hint? }.
export interface SketchLike {
  shape: string;
  guidePath: { x: number; y: number }[];
  tolerance: number;
  coverageThreshold: number;
  taskType?: "trace" | "dots" | "pattern";
  instruction?: string;
  hint?: string;
}

export function toSketchContent(item: PoolItem): SketchLike | null {
  const obj = item.question as {
    shape?: unknown;
    guidePath?: unknown;
    tolerance?: unknown;
    coverageThreshold?: unknown;
    taskType?: unknown;
    instruction?: unknown;
    hint?: unknown;
  };
  if (typeof obj.shape !== "string" || obj.shape.length === 0 || obj.shape.length > 30) return null;
  if (!Array.isArray(obj.guidePath) || obj.guidePath.length < 8 || obj.guidePath.length > 200) return null;
  for (const p of obj.guidePath as Array<{ x?: unknown; y?: unknown }>) {
    if (!inBounds(p.x, p.y)) return null;
  }
  const tolerance = typeof obj.tolerance === "number" ? obj.tolerance : 9;
  const coverageThreshold = typeof obj.coverageThreshold === "number" ? obj.coverageThreshold : 0.6;
  if (tolerance < 3 || tolerance > 20 || coverageThreshold < 0.3 || coverageThreshold > 0.9) return null;
  // Optional activity copy: validated when present, absent on legacy items.
  let taskType: SketchLike["taskType"];
  if (obj.taskType !== undefined) {
    if (obj.taskType !== "trace" && obj.taskType !== "dots" && obj.taskType !== "pattern") return null;
    taskType = obj.taskType;
  }
  let instruction: string | undefined;
  if (obj.instruction !== undefined) {
    if (typeof obj.instruction !== "string" || obj.instruction.length < 1 || obj.instruction.length > 80) return null;
    instruction = obj.instruction;
  }
  let hint: string | undefined;
  if (obj.hint !== undefined) {
    if (typeof obj.hint !== "string" || obj.hint.length < 1 || obj.hint.length > 160) return null;
    hint = obj.hint;
  }
  return {
    shape: obj.shape,
    guidePath: obj.guidePath as { x: number; y: number }[],
    tolerance,
    coverageThreshold,
    ...(taskType ? { taskType } : {}),
    ...(instruction ? { instruction } : {}),
    ...(hint ? { hint } : {}),
  };
}
