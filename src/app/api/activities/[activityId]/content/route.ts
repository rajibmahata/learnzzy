import { NextRequest, NextResponse } from "next/server";
import { activityFor } from "@/lib/activityRegistry";
import { normalizeAgeBand, resolveComplexity } from "@/lib/complexity";
import { generateActivityContent } from "@/lib/activityContent";
import { getDb } from "@/db/mongodb";
import { skillLevelFor } from "@/lib/skillLevels";

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

  let skillLevel = Math.max(1, Math.min(5, Number(url.searchParams.get("skillLevel") ?? "1") || 1));
  if (learnerId) {
    try {
      const db = await getDb();
      const learner = db ? await db.collection("learners").findOne({ learnerId }) : null;
      if (learner) skillLevel = skillLevelFor(learner as never, activity.id);
    } catch {
      // best-effort: fall back to query skillLevel
    }
  }

  const skill = activity.skills[0] ?? activity.id;
  const complexity = resolveComplexity(skill, ageBand, skillLevel);
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
    skillLevel,
    complexity,
    items,
  });
}
