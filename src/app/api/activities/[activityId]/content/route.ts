import { NextRequest, NextResponse } from "next/server";
import { activityFor } from "@/lib/activityRegistry";
import { normalizeAgeBand, resolveComplexity } from "@/lib/complexity";
import { generateActivityContent } from "@/lib/activityContent";
import { getDb } from "@/db/mongodb";
import { evaluateSkill } from "@/lib/skillLevels";
import { educationGateway } from "@/integrations/education/gateway";

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
  let masteryAdj = mastery >= 0.85 ? 1 : mastery < 0.5 ? -1 : 0;

  // MCP advisory for complexity (optional, validated, never blocks)
  let mcpAdj = 0;
  let mcpSource: string | null = null;
  if (learnerId) {
    try {
      const mcpPromise = educationGateway.recommendNextActivity({
        learnerId,
        ageBand: ageBand as "4-5" | "6-7" | "8-9",
        currentLevel: globalLevel,
        recentGameIds: [activity.id],
        focusConceptIds: [activity.skills[0] ?? activity.id],
      });
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 800));
      const mcpResult = (await Promise.race([mcpPromise, timeout])) as { recommendation: { gameId: string; confidence?: number; reason?: string } | null; mocked: boolean } | null;
      if (mcpResult?.recommendation) {
        const rec = mcpResult.recommendation;
        // Validation: schema, age-band, global-level, skill, max/min, game capability, safety
        const validGame = typeof rec.gameId === "string" && rec.gameId.length >= 1 && rec.gameId.length <= 50;
        const validConfidence = typeof rec.confidence !== "number" || (rec.confidence >= 0 && rec.confidence <= 1);
        const withinBounds = globalLevel >= 1 && globalLevel <= 6;
        const sameSkillFamily = rec.gameId === activity.id || (activity.skills[0] && rec.gameId.includes(activity.skills[0].split("-")[0]));
        const safeReason = !rec.reason || !/kill|harm|unsafe/i.test(rec.reason);
        if (validGame && validConfidence && withinBounds && safeReason) {
          // MCP suggests slightly higher complexity for strong confidence, lower for low
          if ((rec.confidence ?? 0.5) >= 0.85 && mastery < 0.7) mcpAdj = 0; // don't push struggling learner
          else if ((rec.confidence ?? 0.5) >= 0.8) mcpAdj = 1;
          else if ((rec.confidence ?? 0.5) < 0.4) mcpAdj = -1;
          // Clamp total adj to [-1, +1] within age-band safety
          mcpAdj = Math.max(-1, Math.min(1, mcpAdj));
          if (mcpAdj !== 0) mcpSource = mcpResult.mocked ? "mcp-mock" : "mcp-live";
        }
      }
    } catch {
      // MCP failure never blocks child — fallback to deterministic
    }
  }

  const effectiveLevel = Math.max(1, Math.min(5, globalLevel + masteryAdj + mcpAdj));

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
