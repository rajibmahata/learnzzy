import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { recordMissionStepEvidence, saveMissionDefinition } from "@/repositories/missions";
import { missionFromId, validateMissionResponse } from "@/lib/missionEngine";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const ResultSchema = z.object({
  learnerId: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(160),
  response: z.union([z.string().max(200), z.array(z.string().max(100)).max(30)]).optional(),
  attempts: z.number().int().min(1).max(20).default(1),
  responseTimeMs: z.number().int().min(0).max(3600000).default(0),
  hintsUsed: z.number().int().min(0).max(20).default(0),
  completed: z.boolean().default(true),
  strategyUsed: z.string().max(80).optional(),
  interactionEvidence: z.record(z.unknown()).optional(),
});

export async function POST(req: Request, { params }: { params: { missionId: string; stepId: string } }) {
  const rl = await takeAsync(`missions:step:${clientIp(req)}`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const mission = missionFromId(params.missionId, 1);
  const step = mission?.steps.find((item) => item.stepId === params.stepId);
  if (!mission || !step) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Mission step not found." } }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON." } }, { status: 400 }); }
  const parsed = ResultSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid step result." } }, { status: 422 });
  const learner = parsed.data.learnerId === "guest" ? null : await getLearner(parsed.data.learnerId);
  if (!learner && parsed.data.learnerId !== "guest") return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const resolvedLearnerId = learner?.learnerId ?? "guest";
  await saveMissionDefinition(mission);
  const correct = validateMissionResponse(step, parsed.data.response);
  const evidence = {
    learnerId: resolvedLearnerId, missionId: mission.missionId, stepId: step.stepId,
    skill: step.metadata.skill, difficulty: step.difficulty, correct,
    attempts: parsed.data.attempts, responseTimeMs: parsed.data.responseTimeMs,
    hintsUsed: parsed.data.hintsUsed, completed: parsed.data.completed,
    contentId: step.content.contentId, timestamp: new Date().toISOString(),
    ...(parsed.data.strategyUsed ? { strategyUsed: parsed.data.strategyUsed } : {}),
    ...(parsed.data.interactionEvidence ? { interactionEvidence: parsed.data.interactionEvidence } : {}),
  } as const;
  const saved = await recordMissionStepEvidence(parsed.data.attemptId, evidence, mission.steps.length);
  if (!saved.progress && process.env.MONGODB_URI) return NextResponse.json({ success: false, error: { code: "ATTEMPT_NOT_FOUND", message: "Mission attempt not found." } }, { status: 404 });
  return NextResponse.json({ success: true, data: { correct, stepId: step.stepId, duplicate: saved.duplicate, progress: saved.progress } });
}
