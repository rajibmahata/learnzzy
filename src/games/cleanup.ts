import { z } from "zod";
import { mulberry32, type GameDefinition } from "./framework";

// BR-050..055 — Clean Up: defined targets, valid hit areas, decorations never
// count, complete only when all targets collected.

export const CleanupTargetSchema = z.object({
  targetId: z.string().min(1).max(40),
  emoji: z.string().min(1).max(12),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const CleanupDecoSchema = z.object({
  id: z.string().min(1).max(40),
  emoji: z.string().min(1).max(12),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const CleanupSceneSchema = z.object({
  theme: z.string().min(1).max(30),
  targets: z.array(CleanupTargetSchema).min(2).max(8),
  nonTargets: z.array(CleanupDecoSchema).max(10),
});

export type CleanupSceneDef = z.infer<typeof CleanupSceneSchema>;

const THEMES: Record<string, { targets: string[]; deco: string[] }> = {
  bedroom: { targets: ["🧸", "🧦", "📚", "🧩", "🎈"], deco: ["🛏️", "🚪", "🪟", "💡"] },
  classroom: { targets: ["📄", "✏️", "📚", "🖍️", "📏"], deco: ["🪑", "🚪", "🖥️", "⏰"] },
  playground: { targets: ["⚽", "🪁", "🧸", "🎈", "🛝"], deco: ["🌳", "☁️", "🌞", "🪑"] },
  garden: { targets: ["🌸", "🍂", "🪴", "🦋", "🍎"], deco: ["🌳", "☁️", "🌞", "🏠"] },
  park: { targets: ["🍌", "🧃", "🎈", "📰", "🧸"], deco: ["🌳", "⛲", "☁️", "🪑"] },
  beach: { targets: ["🐚", "🦀", "🕶️", "🎈", "🧃"], deco: ["🌊", "☁️", "🌞", "🏖️"] },
};

export const CLEANUP_THEMES = Object.keys(THEMES);

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic scene from any seed string — pool and local fallback render identically.
export function createCleanupScene(seedStr: string, theme: string, targetCount = 3): CleanupSceneDef {
  const t = THEMES[theme] ?? THEMES.bedroom;
  const rand = mulberry32(hashSeed(seedStr));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const spot = (used: { x: number; y: number }[]) => {
    for (let tries = 0; tries < 40; tries++) {
      const p = { x: 8 + rand() * 84, y: 12 + rand() * 68 };
      if (used.every((u) => Math.hypot(u.x - p.x, u.y - p.y) > 16)) {
        used.push(p);
        return p;
      }
    }
    const p = { x: 8 + rand() * 84, y: 12 + rand() * 68 };
    used.push(p);
    return p;
  };
  const used: { x: number; y: number }[] = [];
  const emojis = [...t.targets].sort(() => rand() - 0.5).slice(0, targetCount);
  const targets = emojis.map((emoji, i) => ({
    targetId: `target_${i}`,
    emoji,
    ...spot(used),
  }));
  const decoCount = 3;
  const nonTargets = Array.from({ length: decoCount }, (_, i) => ({
    id: `deco_${i}`,
    emoji: pick(t.deco),
    ...spot(used),
  }));
  return CleanupSceneSchema.parse({ theme, targets, nonTargets });
}

export function isSceneComplete(totalTargets: number, collected: string[]): boolean {
  return totalTargets > 0 && collected.length >= totalTargets;
}

export const cleanupGame: GameDefinition<{ seed: string; theme: string }> = {
  id: "clean-up",
  name: "Clean Up",
  learningObjectives: ["VISUAL_RECOGNITION", "CLASSIFICATION"],
  createRound: ({ round }) => ({ seed: `local-clean-${Date.now() % 2147483647}-${round}`, theme: CLEANUP_THEMES[round % CLEANUP_THEMES.length] }),
  validate: () => true,
  correctAnswer: () => 1,
  isComplete: (played, total) => played >= total,
};
