import { z } from "zod";
import { mulberry32, type GameDefinition } from "./framework";
import { hashSeed } from "./cleanup";

// BR-060..064 — puzzles: source image (emoji mosaic), grid, unique piece IDs,
// exactly one correct position per piece, age-appropriate piece counts.

export const PuzzlePieceSchema = z.object({
  pieceId: z.string().min(1).max(40),
  correctPosition: z.number().int().min(0),
  emoji: z.string().min(1).max(12),
});

export const PuzzleDefSchema = z.object({
  picture: z.array(z.string().min(1).max(12)).min(4).max(9),
  rows: z.number().int().min(2).max(3),
  columns: z.number().int().min(2).max(3),
  pieces: z.array(PuzzlePieceSchema).min(4).max(9),
});

export type PuzzleDef = z.infer<typeof PuzzleDefSchema>;

const PICTURES: string[][] = [
  ["🐱", "🐟", "🌸", "🦋", "🐞", "🍎", "🌈", "⭐", "🐝"],
  ["🐶", "🦴", "⚽", "🌳", "🦋", "🌸", "🐦", "🍂", "🌈"],
  ["🦁", "🌞", "🌴", "🐒", "🍌", "🦜", "🌸", "🐘", "⭐"],
  ["🐧", "❄️", "⛄", "🎣", "🐟", "🌊", "⭐", "🔵", "⚪"],
  ["🐸", "🌿", "💧", "🦟", "🌸", "🍀", "🐌", "🌈", "⭐"],
  ["🦄", "🌈", "⭐", "🌸", "🦋", "☁️", "🎈", "🍭", "🌙"],
];

export function gridForDifficulty(difficulty: 1 | 2 | 3): { rows: number; columns: number } {
  if (difficulty === 1) return { rows: 2, columns: 2 };
  if (difficulty === 2) return { rows: 2, columns: 3 };
  return { rows: 3, columns: 3 };
}

export function createPuzzleDef(seedStr: string, difficulty: 1 | 2 | 3): PuzzleDef {
  const rand = mulberry32(hashSeed(seedStr));
  const { rows, columns } = gridForDifficulty(difficulty);
  const n = rows * columns;
  const picture = [...PICTURES[Math.floor(rand() * PICTURES.length)]].slice(0, n);
  // Tray order: deterministic shuffle of positions.
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const pieces = order.map((correctPosition, k) => ({
    pieceId: `piece_${k}`,
    correctPosition,
    emoji: picture[correctPosition],
  }));
  return PuzzleDefSchema.parse({ picture, rows, columns, pieces });
}

export function validatePuzzleDef(def: PuzzleDef): boolean {
  const n = def.rows * def.columns;
  if (def.picture.length !== n || def.pieces.length !== n) return false;
  const ids = new Set(def.pieces.map((p) => p.pieceId));
  if (ids.size !== n) return false;
  const pos = [...def.pieces.map((p) => p.correctPosition)].sort((x, y) => x - y);
  return pos.every((v, i) => v === i); // every piece exactly one slot, all slots filled
}

export function isPuzzleComplete(placed: Record<string, number>, def: PuzzleDef): boolean {
  return def.pieces.every((p) => placed[p.pieceId] === p.correctPosition);
}

export const puzzleGame: GameDefinition<{ seed: string; difficulty: 1 | 2 | 3 }> = {
  id: "puzzle",
  name: "Picture Puzzle",
  learningObjectives: ["SPATIAL_REASONING", "VISUAL_RECOGNITION"],
  createRound: ({ difficulty, round }) => ({ seed: `local-puz-${Date.now() % 2147483647}-${round}`, difficulty }),
  validate: () => true,
  correctAnswer: () => 1,
  isComplete: (played, total) => played >= total,
};
