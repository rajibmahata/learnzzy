import { z } from "zod";
import type { LearnerDoc } from "@/repositories/learners";
import type { LearningPlan } from "./personalizationService";
import { conceptsForGame, getConceptDef } from "@/lib/concepts";
import type { LearningEvidenceInput } from "@/integrations/education/types";

// Advisory layer between the Education Gateway and the deterministic plan.
// The gateway NEVER reorders items, changes levels, or touches score.
// It may only annotate: which planned game to focus, which concept needs
// review, and which misconceptions were observed. UI composes its own
// sentences from these validated fields — raw provider strings are dropped.
export const PlanAdvisorySchema = z.object({
  focusGameId: z.string().min(1).max(50),
  focusConceptId: z.string().min(1).max(80).optional(),
  misconceptions: z.array(z.string().min(1).max(120)).max(10).default([]),
  reviewInDays: z.number().int().min(0).max(90).optional(),
});
export type PlanAdvisory = z.infer<typeof PlanAdvisorySchema>;

export type AnnotatedPlan = LearningPlan & { advisory?: PlanAdvisory };

// Validate a raw gateway recommendation against the already-built plan.
// Returns null unless: gameId is in the plan, concept (if any) is known,
// reason is allowlisted. Reason is re-derived deterministically, never taken
// from the provider.
export function validateAdvisory(
  plan: LearningPlan,
  raw: { gameId?: unknown; conceptId?: unknown; reason?: unknown; misconceptions?: unknown; reviewInDays?: unknown } | null
): PlanAdvisory | null {
  if (!raw) return null;
  const inPlan = plan.items.some((i) => i.gameId === raw.gameId);
  if (!inPlan || typeof raw.gameId !== "string") return null;
  let focusConceptId: string | undefined;
  if (typeof raw.conceptId === "string" && raw.conceptId.length > 0) {
    if (!getConceptDef(raw.conceptId)) return null;
    focusConceptId = raw.conceptId;
  }
  const misconceptions = Array.isArray(raw.misconceptions)
    ? raw.misconceptions.filter((m): m is string => typeof m === "string" && m.length > 0 && m.length <= 120).slice(0, 10)
    : [];
  // Misconceptions must reference known concepts (conceptId or "conceptId:note" form).
  const cleanMisconceptions = misconceptions.filter((m) => getConceptDef(m.split(":")[0]) !== null);
  let reviewInDays: number | undefined;
  if (typeof raw.reviewInDays === "number" && Number.isInteger(raw.reviewInDays) && raw.reviewInDays >= 0 && raw.reviewInDays <= 90) {
    reviewInDays = raw.reviewInDays;
  }
  const parsed = PlanAdvisorySchema.safeParse({ focusGameId: raw.gameId, focusConceptId, misconceptions: cleanMisconceptions, reviewInDays });
  return parsed.success ? parsed.data : null;
}

export function annotatePlan(plan: LearningPlan, advisory: PlanAdvisory | null): AnnotatedPlan {
  if (!advisory) return plan;
  return { ...plan, advisory, source: "ai-assisted" };
}

// Aggregate learner evidence for Tutor MCP: one record per game with history.
// Counts only — no names, no raw clicks, no PII.
export function aggregateEvidence(learner: LearnerDoc, sessionId: string): LearningEvidenceInput[] {
  const out: LearningEvidenceInput[] = [];
  for (const [gameId, p] of Object.entries(learner.gameProgress ?? {})) {
    const attempts = p.completions * 5;
    if (attempts <= 0) continue;
    const correct = Math.max(0, Math.min(attempts, Math.round(attempts * (p.bestAccuracy ?? 0))));
    const conceptId = conceptsForGame(gameId, p.lastLevel || learner.level)[0] ?? "math.counting.objects";
    out.push({
      learnerId: learner.learnerId,
      ageBand: learner.ageBand,
      sessionId,
      gameId,
      conceptId,
      difficulty: Math.max(1, Math.min(5, p.lastLevel || learner.level)),
      attempts,
      correct,
    });
  }
  return out.slice(0, 20);
}
