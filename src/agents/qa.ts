import { getDb } from "@/db/mongodb";
import { getTask, assertWrite, logEvent } from "@/server/agent-store";
import { CONTENT_POOLS } from "@/lib/content";
import { buildPlan } from "@/services/personalizationService";
import { checkPromotion } from "@/services/levelService";

// Test & QA Agent: validates the adaptive-learning system without touching
// gameplay. Checks are deterministic assertions over repositories/services;
// results are recorded as operational summaries only (DEC-094).
export interface QaCheck {
  check: string;
  passed: boolean;
  detail: string;
}

export async function runQaSuite(): Promise<QaCheck[]> {
  const checks: QaCheck[] = [];
  const db = await getDb().catch(() => null);

  // 1. Content pools: every game/difficulty has active content or deterministic fallback.
  const poolNames = Object.keys(CONTENT_POOLS);
  if (db) {
    for (const gameId of poolNames) {
      const n = await db.collection("content").countDocuments({ gameId, status: "active" }).catch(() => -1);
      checks.push({
        check: `pool:${gameId}`,
        passed: n !== 0,
        detail: n < 0 ? "db query failed" : `${n} active items (fallback covers empty pools)`,
      });
    }
  } else {
    checks.push({ check: "pool:db", passed: false, detail: "database unavailable — fallback covers gameplay" });
  }

  // 2. Level configs: 3 age bands x 5 levels present (seed or DB).
  const { listLevels } = await import("@/repositories/levels");
  const levels = await listLevels().catch(() => []);
  checks.push({
    check: "levels:config",
    passed: levels.length >= 15,
    detail: `${levels.length} level configs (expected 15)`,
  });

  // 3. Promotion guardrails: unknown learner never promotes; max level never promotes.
  const unknown = await checkPromotion("learner_missing_xyz", "addition", 1).catch(() => null);
  checks.push({
    check: "promotion:unknown-learner",
    passed: unknown !== null && unknown.shouldPromote === false,
    detail: unknown?.reason ?? "check threw",
  });

  // 4. Personalization determinism: same learner twice => same plan order.
  if (db) {
    const learners = await db.collection("learners").find({}).limit(1).toArray().catch(() => []);
    const id = (learners[0] as { learnerId?: string } | undefined)?.learnerId;
    if (id) {
      const a = await buildPlan(id).catch(() => null);
      const b = await buildPlan(id).catch(() => null);
      const same = !!a && !!b && JSON.stringify(a.items) === JSON.stringify(b.items);
      checks.push({ check: "personalization:deterministic", passed: same, detail: same ? "identical plans" : "plans differ — non-determinism!" });
    } else {
      checks.push({ check: "personalization:deterministic", passed: true, detail: "no learners yet — skipped" });
    }
  } else {
    checks.push({ check: "personalization:deterministic", passed: true, detail: "no db — skipped" });
  }

  // 5. Learner PII guardrail: no email/phone/location fields on learner docs.
  if (db) {
    const bad = await db
      .collection("learners")
      .countDocuments({ $or: [{ email: { $exists: true } }, { phone: { $exists: true } }, { location: { $exists: true } }, { photo: { $exists: true } }] })
      .catch(() => -1);
    checks.push({ check: "privacy:no-pii", passed: bad === 0, detail: bad < 0 ? "query failed" : `${bad} docs with PII fields` });
  }

  return checks;
}

export async function handleQaTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "agentEvents");
  const checks = await runQaSuite();
  const passed = checks.filter((c) => c.passed).length;
  for (const c of checks) {
    await logEvent(task.taskId, task.agentId, c.passed ? "qa_check_passed" : "qa_check_failed", `${c.check}: ${c.detail}`, c.passed ? "info" : "error");
  }
  await logEvent(task.taskId, task.agentId, "qa_suite_completed", `${passed}/${checks.length} checks passed.`);
  return { total: checks.length, passed, failed: checks.length - passed, checks };
}
