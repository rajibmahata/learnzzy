import { NextRequest, NextResponse } from "next/server";
import { activityFor } from "@/lib/activityRegistry";
import { normalizeAgeBand, resolveComplexity } from "@/lib/complexity";
import { generateActivityContent } from "@/lib/activityContent";
import { getDb } from "@/db/mongodb";
import { evaluateSkill } from "@/lib/skillLevels";

// GET /api/activities/[activityId]/content?learnerId=&ageBand=&seed=&limit=&recentIds=
// Deterministic generators (no LLM, no arithmetic-by-AI). Learner lookup is
// best-effort: without Mongo the API still serves age-appropriate content.
export async function GET(req: NextRequest, { params }: { params: { activityId: string } }) {
  const activity = activityFor(params.activityId);
  if (!activity) return NextResponse.json({ error: "UNKNOWN_ACTIVITY" }, { status: 404 });
  if (!activity.generator) {
    return NextResponse.json({ error: "USE_GAME_ROUTE", href: activity.href }, { status: 409 });
  }
  const url = new URL(req.url);
  const ageBand = normalizeAgeBand(url.searchParams.get("ageBand") ?? "6-7");
  const learnerId = url.searchParams.get("learnerId");
  const seedBase = url.searchParams.get("seed") ?? `${Date.now()}`;
  const limit = Math.max(1, Math.min(8, Number(url.searchParams.get("limit") ?? "3") || 3));
  const recentIds = new Set((url.searchParams.get("recentIds") ?? "").split(",").filter(Boolean));

  // Global level is the journey; skill mastery adjusts complexity within age band.
  let globalLevel = Math.max(1, Math.min(10, Number(url.searchParams.get("skillLevel") ?? url.searchParams.get("globalLevel") ?? "1") || 1));
  let mastery = 0.5;
  if (learnerId) {
    try {
      const db = await getDb();
      const learner = db ? await db.collection("learners").findOne({ learnerId } as never) : null;
      if (learner) {
        const doc = learner as unknown as { level?: number; gameProgress?: Record<string, { completions: number; recentAccuracy?: number[] }> };
        globalLevel = Math.max(1, Math.min(10, doc.level ?? globalLevel));
        // Compute mastery for this activity's primary skill from recent accuracy
        const skillKey = activity.skills[0] ?? activity.id;
        // Aggregate progress for this skill across related keys
        const prog = (doc.gameProgress as Record<string, { completions: number; recentAccuracy?: number[] } | undefined> | undefined)?.[activity.id] ??
          (doc.gameProgress as Record<string, { completions: number; recentAccuracy?: number[] } | undefined> | undefined)?.[skillKey] ??
          (doc.gameProgress as Record<string, { completions: number; recentAccuracy?: number[] } | undefined> | undefined)?.[activity.skills[0]];
        if (prog && Array.isArray(prog.recentAccuracy) && prog.recentAccuracy.length) {
          const evaled = evaluateSkill({ completions: prog.completions ?? prog.recentAccuracy.length, recentAccuracy: prog.recentAccuracy.slice(-5) });
          mastery = evaled.avgAccuracy;
        } else if (prog) {
          mastery = 0.5;
        }
      }
    } catch {
      // best-effort: fall back to query level
    }
  }
  // Mastery adjusts effective level within global level: strong → +1, needs practice → -1, clamped
  const masteryAdj = mastery >= 0.85 ? 1 : mastery < 0.5 ? -1 : 0;
  const effectiveLevel = Math.max(1, Math.min(5, globalLevel + masteryAdj));

  const skill = activity.skills[0] ?? activity.id;
  const complexity = resolveComplexity(skill, ageBand, effectiveLevel);
  const items = [];
  let guard = 0;
  let i = 0;
  while (items.length < limit && guard < limit * 10 + 10) {
    guard++;
    const content = generateActivityContent(activity.generator, `${seedBase}:${i}`, complexity);
    i++;
    if (!content) continue;
    if (recentIds.has(content.contentId)) continue;
    items.push(content);
  }
  return NextResponse.json({
    activityId: activity.id,
    category: activity.category,
    skill,
    ageBand,
    skillLevel: effectiveLevel,
    globalLevel,
    mastery: Math.round(mastery * 100) / 100,
    complexity,
    items,
  });
}
