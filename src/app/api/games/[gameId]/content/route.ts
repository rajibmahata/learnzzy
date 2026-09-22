import { NextResponse } from "next/server";
import { getActiveContent } from "@/repositories/content";
import { levelToDifficulty } from "@/lib/difficulty";
import { mulberry32 } from "@/games/framework";
import { createCleanupScene, CLEANUP_THEMES } from "@/games/cleanup";
import { createPuzzleDef } from "@/games/puzzle";
import { createSketchActivity } from "@/games/sketch";
import { requestRefill } from "@/server/pools";
import { getLearner } from "@/repositories/learners";
import { skillLevelFor } from "@/lib/skillLevels";
import { getLevelConfig } from "@/repositories/levels";
import { hashSeed, shuffleWithSeed } from "@/lib/contentSelection";
import { isLevelUnlocked } from "@/lib/learningJourney";

const THEMES = ["jungle", "ocean", "garden", "farm", "space"] as const;
const OBJECTS = ["apple", "banana", "fish", "balloon", "bird"] as const;
const GAME_IDS = ["addition", "subtraction", "clean-up", "puzzle", "sketch"] as const;

function rotateAnswers(answers: number[], seed: number): number[] {
  return shuffleWithSeed(answers, seed);
}

function mathFallback(gameId: "addition" | "subtraction", difficulty: 1 | 2 | 3, curriculumLevel: number, limit: number, seed: number, maxOperand: number) {
  const rand = mulberry32(seed);
  const max = Math.max(1, Math.min(40, maxOperand));
  const items = [];
  for (let i = 0; i < limit; i++) {
    const theme = THEMES[Math.floor(rand() * THEMES.length)];
    const objectType = OBJECTS[Math.floor(rand() * OBJECTS.length)];
    if (gameId === "subtraction") {
      const start = 1 + Math.floor(rand() * max);
      const removed = Math.floor(rand() * (start + 1));
      const correctAnswer = start - removed;
      const set = new Set<number>([correctAnswer]);
       for (const c of [correctAnswer + 1, correctAnswer - 1, correctAnswer + 2, Math.max(0, correctAnswer - 2), start, removed]) {
        if (set.size >= 4) break;
        if (c >= 0 && c <= 20 && !set.has(c)) set.add(c);
      }
       items.push({
          contentId: `fallback-sub-${curriculumLevel}-${seed}-${i}`,
          difficulty,
          difficultyName: levelToDifficulty(difficulty),
        theme,
        type: "subtraction_question",
        question: { start, removed },
        objects: { type: "bird", startCount: start, removedCount: removed },
          answers: rotateAnswers(Array.from(set), seed ^ i),
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
          contentId: `fallback-add-${curriculumLevel}-${seed}-${i}`,
          difficulty,
          difficultyName: levelToDifficulty(difficulty),
        theme,
        type: "visual_addition",
        question: { a, b },
        objects: { type: objectType, countA: a, countB: b },
          answers: rotateAnswers(Array.from(set), seed ^ i),
        animation: "combine",
      });
    }
  }
  return items;
}

// Deterministic server-side fallback for scene games (BR-222). The definition
// lives in `question`, matching the client validators in pool-client.ts.
function sceneFallback(gameId: "clean-up" | "puzzle" | "sketch", level: 1 | 2 | 3, limit: number, seed: number, curriculumLevel: number) {
  const items = [];
  const sketchLevel = Math.max(1, Math.min(5, curriculumLevel));
  for (let i = 0; i < limit; i++) {
    const s = `fallback-${gameId}-${level}-${seed}-${i}`;
    if (gameId === "clean-up") {
      const def = createCleanupScene(s, CLEANUP_THEMES[(seed + i) % CLEANUP_THEMES.length], 3);
      items.push({ contentId: s, difficulty: level, difficultyName: levelToDifficulty(level), theme: def.theme, type: "clean_up_scene", question: def });
    } else if (gameId === "puzzle") {
      const def = createPuzzleDef(s, level);
      items.push({ contentId: s, difficulty: level, difficultyName: levelToDifficulty(level), theme: "playroom", type: "picture_puzzle", question: def });
    } else {
      // Level-aware activity (shape + task + instruction + hint), not the
      // legacy 4-shape pool — fallback variety matches pool variety.
      const def = createSketchActivity(`${s}-L${sketchLevel}`, sketchLevel);
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
  const rawLevel = url.searchParams.get("level");
  const requestedLevel = rawLevel === null
    ? rawDiff === "medium" ? 2 : rawDiff === "hard" ? 3 : Number(rawDiff)
    : Number(rawLevel);
  const selectedLevel = Number.isInteger(requestedLevel) ? Math.max(1, Math.min(100, requestedLevel)) : 1;
  const lvl: 1 | 2 | 3 = selectedLevel === 2 ? 2 : selectedLevel >= 3 ? 3 : 1;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "5") || 5, 1), 10);
  const difficultyName = levelToDifficulty(lvl);
  const isMath = gameId === "addition" || gameId === "subtraction";
  const learnerId = url.searchParams.get("learnerId") ?? undefined;
  const ageBand = url.searchParams.get("ageBand") as "4-5" | "6-7" | "8-9" | null;
  const recentIds = (url.searchParams.get("recent") ?? "").split(",").filter((id) => id.length > 0).slice(0, 20);
  const seedRaw = Number(url.searchParams.get("seed"));
  const seed = Number.isFinite(seedRaw) ? seedRaw : hashSeed(`${learnerId ?? "guest"}:${gameId}:${Date.now()}`);

  // Per-skill complexity: this game's level comes from the learner's skill
  // profile (falls back to the global level). Unlock gating stays on the
  // global journey level; complexity never leaks across skills.
  let skillLevel = selectedLevel;
  if (learnerId) {
    const learner = await getLearner(learnerId);
    if (!learner) return NextResponse.json({ success: false, error: { code: "LEARNER_NOT_FOUND", message: "Learner not found.", requestId } }, { status: 404 });
    if (!isLevelUnlocked(learner.level, selectedLevel)) {
      return NextResponse.json({ success: false, error: { code: "LEVEL_LOCKED", message: "Finish your current adventure first.", requestId } }, { status: 403 });
    }
    skillLevel = skillLevelFor(learner, gameId);
  }

  const levelConfig = await getLevelConfig(skillLevel, ageBand ?? "6-7");
  const maxOperand = levelConfig?.maxOperand ?? (skillLevel === 1 ? 5 : skillLevel === 2 ? 10 : skillLevel <= 3 ? 20 : 25);

  // 1. Validated pool first (BR-090 active only).
  const pool = await getActiveContent(gameId, difficultyName, limit, { seed, recentIds, level: skillLevel }).catch(() => []);
  if (pool.length > 0) {
    const minimum = gameId === "addition" || gameId === "subtraction" ? 30 : 10;
    if (pool.length < minimum) {
      void requestRefill(gameId, difficultyName, undefined, { type: "pool-monitor" }).catch(() => undefined);
    }
    return NextResponse.json({
      success: true,
      data: {
        gameId,
        level: selectedLevel,
        skillLevel,
        items: pool.slice(0, limit).map((d) => {
          const payload = d.payload as Record<string, unknown>;
          if (isMath) {
            // BR-022: the browser is never authoritative. The answer is NOT
            // sent on the wire; the client recomputes a+b / start-removed
            // from `question` and validates options locally for instant
            // feedback. Server-authoritative scoring remains via events.
            return {
              contentId: d.contentId,
              difficulty: lvl,
              difficultyName,
              theme: payload.theme ?? "garden",
              type: d.contentType,
              question: payload.question,
              objects: payload.objects,
              answers: Array.isArray(payload.answerOptions) ? rotateAnswers(payload.answerOptions as number[], seed ^ hashSeed(d.contentId)) : payload.answerOptions,
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
  // Answers are validated client-side by recomputing from `question`;
  // `correctAnswer` is intentionally omitted from the wire (BR-022).
  const fallbackSeed = seed;
  const items = isMath
    ? mathFallback(gameId as "addition" | "subtraction", lvl, skillLevel, limit, fallbackSeed, maxOperand)
    : sceneFallback(gameId as "clean-up" | "puzzle" | "sketch", lvl, limit, fallbackSeed, skillLevel);
  return NextResponse.json({ success: true, data: { gameId, level: selectedLevel, skillLevel, items } });
}
