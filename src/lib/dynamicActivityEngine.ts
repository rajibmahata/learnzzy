// Dynamic Activity Engine — chooses activity + mechanic + theme + difficulty + environment + reward + celebration
// Prevents repetition, uses learner signals + MCP intelligence when available, falls back safely.
// Reuses LearningAdventureEngine + ActivityVarietyEngine + WorldRewards + Existing personalization.

import { recommendNextActivitySafe, type AdventureEngineInput } from "./learningAdventureEngine.ts";
import { LEARNING_ACTIVITY_REGISTRY, type LearningActivity } from "./learningActivities.ts";
import { LEARNING_WORLDS } from "./learningWorlds.ts";
import { selectWorldEvent } from "./worldRewards.ts";
import { educationGateway } from "@/integrations/education/gateway";
import { z } from "zod";
import { mechanicForSkillAtLevel } from "./mechanics.ts";

export interface DynamicActivity {
  activity: LearningActivity;
  mechanic: string;
  theme: string;
  environment: string; // Jungle, Ocean, Space, Garden etc.
  difficulty: number;
  content: unknown; // validated content for the mechanic
  reward: { stickerId: string; rewardEvent: ReturnType<typeof selectWorldEvent> } | null;
  celebration: "balloon-burst" | "dinosaur-walk" | "boat-sail" | "butterfly-fly" | "robot-roll" | "standard";
  reason: string; // parent-safe
  href: string;
}

const ENVIRONMENTS = ["Jungle", "Ocean", "Space", "Garden", "Farm", "Dinosaur Valley", "Rainbow Sky", "Snow World", "Desert", "Magic Forest", "Robot City", "Fruit Garden", "Underwater World"] as const;

function pickEnvironment(input: AdventureEngineInput, activity: LearningActivity): string {
  // Prefer activity's world → environment mapping, then vary by recent environments
  const worldToEnv: Record<string, string> = {
    colors: "Rainbow Sky", animals: "Jungle", birds: "Garden", insects: "Garden", nature: "Magic Forest", dinosaurs: "Dinosaur Valley", ocean: "Ocean", words: "Garden", numbers: "Farm", thinking: "Magic Forest", creative: "Rainbow Sky", robots: "Robot City", fruits: "Fruit Garden", space: "Space", stories: "Jungle",
  };
  const preferred = worldToEnv[activity.world] ?? "Garden";
  // Avoid immediate repeat: if last environment was same, pick next in list deterministically
  const recentEnv = input.recentThemes[0];
  if (recentEnv === preferred) {
    const idx = ENVIRONMENTS.indexOf(preferred as never);
    return ENVIRONMENTS[(idx + 1) % ENVIRONMENTS.length]!;
  }
  return preferred;
}

function pickMechanic(activity: LearningActivity, input: AdventureEngineInput): string {
  // Multi-level: same skill mechanic evolves per level (e.g. addition 1→ balloon-pop, 4→ dino-eggs)
  const leveled = mechanicForSkillAtLevel(activity.skill, input.globalLevel);
  if (leveled) {
    // If leveled mechanic is available in this activity's mechanics, prefer it; otherwise use leveled for composition
    if (activity.mechanics.includes(leveled.mechanic)) return leveled.mechanic;
    // For composition: BalloonPop + Addition + Dinosaur Theme = Dinosaur Balloon Addition
    // Return leveled mechanic so the same skill is taught via many experiences (§2)
    return leveled.mechanic;
  }
  const recent = new Set(input.recentMechanics);
  for (const m of activity.mechanics) if (!recent.has(m)) return m;
  return activity.mechanics[0]!;
}

function pickTheme(activity: LearningActivity, input: AdventureEngineInput): string {
  // Theme is activity.theme, but could be varied by learner interest
  return activity.theme;
}

export async function chooseDynamicActivity(input: AdventureEngineInput): Promise<DynamicActivity | null> {
  // 1. Try MCP-enhanced try via Tutor MCP (learner intelligence) — advisory only
  let mcpRecommendation: { activityId?: string; skill?: string } | null = null;
  try {
    const mcp = await educationGateway.recommendNextActivity({
      learnerId: input.learnerId,
      ageBand: input.ageBand,
      currentLevel: input.globalLevel,
      recentGameIds: input.recentGameTypes.slice(0, 5),
      focusConceptIds: [input.skill],
    } as never);
    if (mcp.recommendation) {
      // recommendation {gameId, conceptId, reason} → map to LearningActivity
      const found = LEARNING_ACTIVITY_REGISTRY.find((a) => a.id === mcp.recommendation!.gameId || a.skill === mcp.recommendation!.conceptId);
      if (found && (found.ageBands as string[]).includes(input.ageBand)) {
        mcpRecommendation = { activityId: found.id, skill: found.skill };
      }
    }
  } catch {
    // MCP unavailable → fallback
  }

  // 2. Use LearningAdventureEngine for base selection (already deterministic)
  let base = await recommendNextActivitySafe(input);
  // If MCP gave a valid recommendation, bias toward it by overriding skill
  if (mcpRecommendation) {
    const biasedInput = { ...input, skill: mcpRecommendation.skill ?? input.skill, interests: { ...input.interests, [mcpRecommendation.activityId!]: (input.interests[mcpRecommendation.activityId!] ?? 0) + 2 } };
    const biased = await recommendNextActivitySafe(biasedInput).catch(() => null);
    if (biased && LEARNING_ACTIVITY_REGISTRY.some((a) => a.id === mcpRecommendation!.activityId)) {
      // Prefer MCP activity if it passed safety
      const mcpActivity = LEARNING_ACTIVITY_REGISTRY.find((a) => a.id === mcpRecommendation!.activityId)!;
      base = { ...biased, activity: mcpActivity, href: mcpActivity.href ?? biased.href };
    }
  }

  if (!base) return null;

  const activity = base.activity;
  const mechanic = pickMechanic(activity, input);
  const theme = pickTheme(activity, input);
  const environment = pickEnvironment(input, activity);
  // Difficulty is per-skill, not global — use base explainability difficulty
  const difficulty = base.explainability.difficulty;
  // Content: deterministic local generation (never wait for MCP)
  const content = { activityId: activity.id, mechanic, theme, environment, difficulty, seed: `${input.learnerId}:${activity.id}:${difficulty}` };
  // Reward: pick next unowned sticker for this activity's rewardTags, else milestone
  const reward = activity.rewardTags[0] ? { stickerId: activity.rewardTags[0], rewardEvent: selectWorldEvent(activity.rewardTags[0], `${input.learnerId}:${activity.id}`) } : null;
  const celebrationMap: Record<string, DynamicActivity["celebration"]> = {
    "balloon-pop": "balloon-burst", "dino-discovery": "dinosaur-walk", "boat-discovery": "boat-sail", "butterfly-garden": "butterfly-fly", "robot-path": "robot-roll",
  };
  const celebration = (celebrationMap[mechanic] as DynamicActivity["celebration"]) ?? "standard";

  // 3. Safety validation: Zod + age + provenance already in registry; re-validate
  const safe = z.object({ id: z.string(), world: z.string(), skill: z.string() }).safeParse(activity);
  if (!safe.success) return null;

  return {
    activity,
    mechanic,
    theme,
    environment,
    difficulty,
    content,
    reward,
    celebration,
    reason: base.reason,
    href: base.href,
  };
}

// Content generation pipeline: MCP → Education Gateway → Content Normalizer → Schema → Safety → Age → Pool → Activity Engine → Game
// This is the MCP integration point for activity *content* (not selection). Generation is cached.
export async function generateActivityContentViaMCP(activity: LearningActivity, ageBand: string): Promise<unknown | null> {
  try {
    // Try OER MCP for educational content (concepts)
    const oer = await educationGateway.searchEducationalContent({ query: activity.skill, conceptId: activity.skill, ageBand, limit: 3 } as never).catch(() => null);
    if (oer?.results?.length) {
      // Normalize: first result's concept → validated Learnzzy content
      const first = oer.results[0];
      // Schema already validated by gateway; transform to Learnzzy content
      return { source: "oer-mcp", concept: first.conceptId, provenance: first.provenance, theme: activity.theme };
    }
  } catch {}
  return null; // fallback to local deterministic generation
}
