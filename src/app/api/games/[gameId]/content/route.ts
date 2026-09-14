import { NextResponse } from "next/server";
import { getActiveContent } from "@/repositories/content";
import { difficultyToLevel, levelToDifficulty } from "@/lib/difficulty";
import { mulberry32 } from "@/games/framework";
import { createCleanupScene, CLEANUP_THEMES } from "@/games/cleanup";
import { createPuzzleDef } from "@/games/puzzle";
import { createSketchDef } from "@/games/sketch";
import { requestRefill } from "@/server/pools";

const THEMES = ["jungle", "ocean", "garden", "farm", "space"] as const;
const OBJECTS = ["apple", "banana", "fish", "balloon", "bird"] as const;
const GAME_IDS = ["addition", "subtraction", "clean-up", "puzzle", "sketch"] as const;

function mathFallback(gameId: "addition" | "subtraction", level: 1 | 2 | 3, limit: number, seed: number) {
  const rand = mulberry32(seed);
  const max = level === 1 ? 5 : level === 2 ? 10 : 20;
  const items = [];
  for (let i = 0; i < limit; i++) {
    const theme = THEMES[Math.floor(rand() * THEMES.length)];
    const objectType = OBJECTS[Math.floor(rand() * OBJECTS.length)];
    if (gameId === "subtraction") {
      const start = 1 + Math.floor(rand() * max);
      const removed = Math.floor(rand() * (start + 1));
      const correctAnswer = start - removed;
      const set = new Set<number>([correctAnswer]);
      for (const c of [correctAnswer + 1, correctAnswer - 1, correctAnswer + 2, Math.max(0, correctAnswer - 2)]) {
        if (set.size >= 4) break;
        if (c >= 0 && c <= 20 && !set.has(c)) set.add(c);
      }
      items.push({
        contentId: `fallback-sub-${level}-${seed}-${i}`,
        difficulty: level,
        difficultyName: levelToDifficulty(level),
        theme,
        type: "subtraction_question",
        question: { start, removed },
        objects: { type: "bird", startCount: start, removedCount: removed },
        answers: Array.from(set),
        correctAnswer,
      });
    } else {
      const a = 1 + Math.floor(rand() * max);
      const b = 1 + Math.floor(rand() * max);
      const correctAnswer = a + b;
      const set = new Set<number>([correctAnswer]);
      for (const c of [correctAnswer + 1, correctAnswer - 1, correctAnswer + 2, Math.max(0, correctAnswer - 2)]) {
        if (set.size >= 4) break;
        if (c >= 0 && c <= 40 && !set.has(c)) set.add(c);
      }
      items.push({
        contentId: `fallback-add-${level}-${seed}-${i}`,
        difficulty: level,
        difficultyName: levelToDifficulty(level),
        theme,
        type: "visual_addition",
        question: { a, b },
        objects: { type: objectType, countA: a, countB: b },
        answers: Array.from(set),
        correctAnswer,
        animation: "combine",
      });
    }
  }
  return items;
}

// Deterministic server-side fallback for scene games (BR-222). The definition
// lives in `question`, matching the client validators in pool-client.ts.
function sceneFallback(gameId: "clean-up" | "puzzle" | "sketch", level: 1 | 2 | 3, limit: number, seed: number) {
  const items = [];
  for (let i = 0; i < limit; i++) {
    const s = `fallback-${gameId}-${level}-${seed}-${i}`;
    if (gameId === "clean-up") {
      const def = createCleanupScene(s, CLEANUP_THEMES[(seed + i) % CLEANUP_THEMES.length], 3);
      items.push({ contentId: s, difficulty: level, difficultyName: levelToDifficulty(level), theme: def.theme, type: "clean_up_scene", question: def });
    } else if (gameId === "puzzle") {
      const def = createPuzzleDef(s, level);
      items.push({ contentId: s, difficulty: level, difficultyName: levelToDifficulty(level), theme: "playroom", type: "picture_puzzle", question: def });
    } else {
      const def = createSketchDef(s, level);
      items.push({ contentId: s, difficulty: level, difficultyName: levelToDifficulty(level), theme: "studio", type: "shadow_sketch", question: def });
    }
  }
  return items;
}

export async function GET(req: Request, { params }: { params: { gameId: string } }) {
  const requestId = `req_${Date.now().toString(36)}`;
  const { gameId } = params;
  if (!(GAME_IDS as readonly string[]).includes(gameId)) {
    return NextResponse.json(
      { success: false, error: { code: "GAME_NOT_FOUND", message: "Game not available.", requestId } },
      { status: 404 }
    );
  }
  const url = new URL(req.url);
  const rawDiff = url.searchParams.get("difficulty") ?? "1";
  const level =
    rawDiff === "easy" ? 1 : rawDiff === "medium" ? 2 : rawDiff === "hard" ? 3 : difficultyToLevel(rawDiff) ?? 1;
  const lvl: 1 | 2 | 3 = level === 2 ? 2 : level === 3 ? 3 : 1;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "5") || 5, 1), 10);
  const difficultyName = levelToDifficulty(lvl);
  const isMath = gameId === "addition" || gameId === "subtraction";

  // 1. Validated pool first (BR-090 active only).
  const pool = await getActiveContent(gameId, difficultyName, limit).catch(() => []);
  if (pool.length > 0) {
    const minimum = gameId === "addition" || gameId === "subtraction" ? 30 : 10;
    if (pool.length < minimum) {
      void requestRefill(gameId, difficultyName, undefined, { type: "pool-monitor" }).catch(() => undefined);
    }
    return NextResponse.json({
      success: true,
      data: {
        gameId,
        items: pool.slice(0, limit).map((d) => {
          const payload = d.payload as Record<string, unknown>;
          if (isMath) {
            return {
              contentId: d.contentId,
              difficulty: lvl,
              difficultyName,
              theme: payload.theme ?? "garden",
              type: d.contentType,
              question: payload.question,
              objects: payload.objects,
              answers: payload.answerOptions,
              correctAnswer: payload.correctAnswer,
            };
          }
          return {
            contentId: d.contentId,
            difficulty: lvl,
            difficultyName,
            theme: (payload.theme as string) ?? "playroom",
            type: d.contentType,
            question: payload,
          };
        }),
      },
    });
  }

  // Refill asynchronously when a pool is empty/low. Never await this path:
  // gameplay remains deterministic even when Mongo, Redis, or AI is offline.
  void requestRefill(gameId, difficultyName, undefined, { type: "pool-monitor" }).catch(() => undefined);

  // 2. Deterministic fallback so gameplay never blocks (BR-222).
  // NOTE: math correctAnswer is included for current client-side validation.
  // Server-trusted scoring (verification tokens) is a later milestone (API.md §9.1).
  const seed = Date.now() % 2147483647;
  const items = isMath
    ? mathFallback(gameId as "addition" | "subtraction", lvl, limit, seed)
    : sceneFallback(gameId as "clean-up" | "puzzle" | "sketch", lvl, limit, seed);
  return NextResponse.json({ success: true, data: { gameId, items } });
}
