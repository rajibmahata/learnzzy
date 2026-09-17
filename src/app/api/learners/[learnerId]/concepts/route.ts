import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner, saveConceptMastery, type ConceptMasteryDoc } from "@/repositories/learners";
import { flattenMasteryMap, getConcept, nextMastery, type ConceptMastery } from "@/lib/knowledge";
import { clientIp, takeAsync } from "@/lib/rate-limit";

const flatMastery = flattenMasteryMap;

const ConceptSignalSchema = z.object({
  conceptId: z.string().min(1).max(80),
  signal: z.enum(["exposed", "recognized", "recalled"]),
  correct: z.boolean().optional(),
});

// Server-authoritative concept mastery: the client reports what the child
// did (saw / answered), the server runs the mastery machine and persists it.
export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:concepts:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  const parsed = ConceptSignalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "conceptId and signal required." } }, { status: 422 });
  }
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const concept = getConcept(parsed.data.conceptId);
  if (!concept) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Unknown concept." } }, { status: 404 });
  const flat = flatMastery(learner.conceptMastery);
  const next = nextMastery(flat[concept.id], parsed.data.signal, parsed.data.correct ?? true);
  const merged: Record<string, ConceptMasteryDoc> = {};
  for (const [k, v] of Object.entries({ ...flat, [concept.id]: next })) {
    merged[k] = {
      exposures: v.exposures ?? 0,
      attempts: v.attempts ?? 0,
      correct: v.correct ?? 0,
      status: v.status,
      ...(v.firstSeenAt ? { firstSeenAt: v.firstSeenAt } : {}),
      ...(v.lastSeenAt ? { lastSeenAt: v.lastSeenAt } : {}),
      ...(v.nextReviewAt ? { nextReviewAt: v.nextReviewAt } : {}),
    };
  }
  await saveConceptMastery(params.learnerId, merged);
  return NextResponse.json({ success: true, data: { conceptId: concept.id, mastery: next } });
}
