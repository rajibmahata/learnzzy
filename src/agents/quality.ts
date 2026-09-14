import type { Db } from "mongodb";
import { AdditionContentSchema } from "@/games/addition";
import { SubtractionContentSchema } from "@/games/subtraction";
import { validateAdditionPayload, validateSubtractionPayload } from "@/lib/content";

// Quality & Safety gate (DEC-071, BR-102/103). Every candidate — AI or
// deterministic — passes schema + deterministic + safety checks before the
// active pool. Returns reasons instead of throwing so callers can count rejects.

const BANNED = ["kill", "gun", "blood", "scary", "monster", "war", "http", "www.", "<script"];

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
}

function safetySweep(payload: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const text = JSON.stringify(payload).toLowerCase();
  for (const w of BANNED) {
    if (text.includes(w)) reasons.push(`unsafe term: ${w}`);
  }
  if (text.length > 4000) reasons.push("payload too large");
  return reasons;
}

function mathPayload(gameId: string, payload: Record<string, unknown>): ValidationResult {
  const reasons = safetySweep(payload);
  if (gameId === "addition") {
    const p = payload as { a?: unknown; b?: unknown; correctAnswer?: unknown; answerOptions?: unknown };
    const question = (payload.question ?? {}) as { a?: unknown; b?: unknown };
    const a = p.a ?? question.a;
    const b = p.b ?? question.b;
    const parsed = AdditionContentSchema.safeParse({
      a,
      b,
      answers: p.answerOptions,
      correctAnswer: p.correctAnswer,
    });
    if (!parsed.success) {
      reasons.push("schema invalid");
    } else if (
      !validateAdditionPayload({ a: parsed.data.a, b: parsed.data.b, correctAnswer: parsed.data.correctAnswer, answerOptions: parsed.data.answers })
    ) {
      reasons.push("deterministic validation failed");
    }
  } else {
    const p = payload as { startCount?: unknown; removedCount?: unknown; correctAnswer?: unknown; answerOptions?: unknown };
    const question = (payload.question ?? {}) as { start?: unknown; removed?: unknown };
    // Accept both seed shapes: {start,removed} and {startCount,removedCount}.
    const start = (p.startCount ?? (payload as Record<string, unknown>).start ?? question.start) as number;
    const removed = (p.removedCount ?? (payload as Record<string, unknown>).removed ?? question.removed) as number;
    const parsed = SubtractionContentSchema.safeParse({
      start,
      removed,
      answers: p.answerOptions,
      correctAnswer: p.correctAnswer,
    });
    if (!parsed.success) {
      reasons.push("schema invalid");
    } else if (
      !validateSubtractionPayload({
        startCount: parsed.data.start,
        removedCount: parsed.data.removed,
        correctAnswer: parsed.data.correctAnswer,
        answerOptions: parsed.data.answers,
      })
    ) {
      reasons.push("deterministic validation failed");
    }
  }
  return { ok: reasons.length === 0, reasons };
}

export async function validateCandidate(
  gameId: string,
  payload: Record<string, unknown>,
  db?: Db | null
): Promise<ValidationResult> {
  if (gameId === "addition" || gameId === "subtraction") {
    const r = mathPayload(gameId, payload);
    if (!r.ok) return r;
  } else {
    // Scene games: structural validation mirrors pool-client validators.
    const reasons = safetySweep(payload);
    if (gameId === "clean-up") {
      const t = (payload.targets ?? []) as unknown[];
      const ids = new Set(
        ((payload.targets ?? []) as Array<{ targetId?: string }>).map((target) => target.targetId)
      );
      if (t.length < 2 || t.length > 8) reasons.push("target count out of range");
      if (ids.size !== t.length) reasons.push("duplicate target ids");
    } else if (gameId === "puzzle") {
      const rows = payload.rows as number;
      const columns = payload.columns as number;
      const pieces = (payload.pieces ?? []) as Array<{ pieceId?: string; correctPosition?: number }>;
      const n = rows * columns;
      if (!Number.isInteger(n) || pieces.length !== n) reasons.push("piece/grid mismatch");
      else {
        const pos = [...pieces.map((p) => p.correctPosition as number)].sort((a, b) => a - b);
        if (!pos.every((v, i) => v === i)) reasons.push("positions must permute 0..n-1");
        if (new Set(pieces.map((p) => p.pieceId)).size !== n) reasons.push("duplicate piece ids");
      }
    } else if (gameId === "sketch") {
      const path = (payload.guidePath ?? []) as unknown[];
      if (path.length < 8 || path.length > 200) reasons.push("guide path length invalid");
    } else {
      reasons.push(`unknown game ${gameId}`);
    }
    if (reasons.length > 0) return { ok: false, reasons };
  }

  // Duplicate prevention (BR-094): reject exact payload duplicates in the active pool.
  if (db) {
    const dupe = await db
      .collection("content")
      .findOne({ gameId, status: "active", payload })
      .catch(() => null);
    if (dupe) return { ok: false, reasons: ["exact duplicate of active content"] };
  }
  return { ok: true, reasons: [] };
}

// Standalone sweep: re-check docs stuck in `validating` (e.g. after restarts).
export async function handleQualityTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const { getDb } = await import("@/db/mongodb");
  const { getTask, logEvent } = await import("@/server/agent-store");
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const pending = await db.collection("content").find({ status: "validating" }).limit(100).toArray().catch(() => []);
  let approved = 0;
  let rejected = 0;
  for (const doc of pending) {
    const d = doc as unknown as { contentId: string; gameId: string; payload: Record<string, unknown> };
    const check = await validateCandidate(d.gameId, d.payload, db);
    if (check.ok) {
      await db.collection("content").updateOne({ contentId: d.contentId }, { $set: { status: "approved", approvedAt: new Date(), updatedAt: new Date() } });
      approved++;
    } else {
      await db.collection("content").updateOne({ contentId: d.contentId }, { $set: { status: "rejected", updatedAt: new Date() } });
      rejected++;
    }
  }
  await logEvent(task.taskId, task.agentId, "sweep_completed", `${approved} approved, ${rejected} rejected.`);
  return { approved, rejected };
}
