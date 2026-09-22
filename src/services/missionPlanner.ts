import type { LearnerDoc } from "../repositories/learners.ts";
import type { AgeBand } from "../lib/complexity.ts";
import { evaluateSkill, skillLevelFor } from "../lib/skillLevels.ts";
import {
  generateMission,
  MISSION_TEMPLATES,
  type Mission,
  type MissionSkill,
  type MissionTemplate,
} from "../lib/missionEngine.ts";

export interface MissionRecommendation {
  mission: Mission;
  reason: string;
  priority: number;
}

export interface MissionPlannerInput {
  learnerId: string;
  ageBand: AgeBand;
  globalLevel?: number;
  gameProgress?: LearnerDoc["gameProgress"];
  recentMissionIds?: string[];
  dateKey?: string;
  limit?: number;
}

const SKILL_GAME: Partial<Record<MissionSkill, string>> = {
  memory: "memory",
  observation: "find-object",
  problemSolving: "puzzle",
  flexibility: "sorting",
  creativity: "sketch",
  planning: "number-order",
  phonics: "word-family",
  language: "word-match",
  math: "number-count",
};

function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(seed: string): number {
  let x = hashSeed(seed);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function skillNeed(template: MissionTemplate, input: MissionPlannerInput): { score: number; reason: string } {
  const gameId = SKILL_GAME[template.primarySkill];
  const progress = gameId ? input.gameProgress?.[gameId] : undefined;
  if (!progress || progress.completions < 1) {
    return { score: 0.75, reason: "new practice opportunity" };
  }
  const evaluation = evaluateSkill({
    completions: progress.completions,
    recentAccuracy: progress.recentAccuracy ?? [],
    hintsUsed: progress.hintsUsed ?? 0,
  });
  if (evaluation.trend === "needs_practice") return { score: 1.2, reason: "recent practice will help" };
  if (evaluation.trend === "improving") return { score: 1.0, reason: "keep the growing skill moving" };
  return { score: 0.55, reason: "review a growing strength" };
}

function difficultyFor(template: MissionTemplate, input: MissionPlannerInput): number {
  const gameId = SKILL_GAME[template.primarySkill];
  const perSkill = gameId && input.gameProgress ? skillLevelFor({
    level: input.globalLevel ?? 1,
    gameProgress: input.gameProgress,
  } as unknown as LearnerDoc, gameId) : 1;
  const global = Math.max(1, Math.min(5, Math.floor(input.globalLevel ?? 1)));
  return Math.max(1, Math.min(5, Math.round((global + perSkill) / 2)));
}

export class MissionPlanner {
  recommend(input: MissionPlannerInput): MissionRecommendation[] {
    const limit = Math.max(1, Math.min(5, Math.floor(input.limit ?? 4)));
    const dateKey = input.dateKey ?? todayKey();
    const recent = new Set((input.recentMissionIds ?? []).map((missionId) => missionId.split(":")[1] ?? missionId));
    const eligible = MISSION_TEMPLATES.filter((template) => template.status === "approved" && template.ageBands.includes(input.ageBand));
    const scored = eligible.map((template) => {
      const need = skillNeed(template, input);
      const recencyPenalty = recent.has(template.templateId) ? 0.7 : 0;
      const stableJitter = jitter(`${input.learnerId}:${dateKey}:${template.templateId}`) * 0.2;
      const priority = need.score - recencyPenalty + stableJitter;
      const mission = generateMission(
        template.templateId,
        input.ageBand,
        `${dateKey}:${input.learnerId}:${template.templateId}`,
        difficultyFor(template, input)
      );
      return mission ? { mission, reason: need.reason, priority } : null;
    }).filter((item): item is MissionRecommendation => Boolean(item));

    // First satisfy skill variety, then fill by deterministic priority. This is
    // planning, not a second progression system and never jumps global level.
    scored.sort((a, b) => b.priority - a.priority || a.mission.templateId.localeCompare(b.mission.templateId));
    const selected: MissionRecommendation[] = [];
    const seenSkills = new Set<MissionSkill>();
    for (const item of scored) {
      if (selected.length >= limit) break;
      if (!seenSkills.has(item.mission.primarySkill)) {
        selected.push(item);
        seenSkills.add(item.mission.primarySkill);
      }
    }
    for (const item of scored) {
      if (selected.length >= limit) break;
      if (!selected.includes(item)) selected.push(item);
    }
    return selected;
  }
}

export const missionPlanner = new MissionPlanner();

export function buildTodaysAdventure(input: Omit<MissionPlannerInput, "dateKey"> & { date?: Date }): MissionRecommendation[] {
  return missionPlanner.recommend({ ...input, dateKey: todayKey(input.date), limit: input.limit ?? 4 });
}
