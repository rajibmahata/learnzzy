import { z } from "zod";
import type { Db } from "mongodb";
import { getDb, newId } from "@/db/mongodb";
import { getTask, assertWrite, logEvent } from "@/server/agent-store";
import { generateStructured } from "@/server/ai";
import { mulberry32 } from "@/games/framework";
import { hashSeed, createCleanupScene, CLEANUP_THEMES } from "@/games/cleanup";
import { createPuzzleDef } from "@/games/puzzle";
import { createSketchActivity } from "@/games/sketch";
import { validateCandidate } from "@/agents/quality";

const THEMES = ["jungle", "ocean", "garden", "farm", "space"];
// Dynamic visual themes (§11): the emoji/object varies per round while the
// Difficulty Engine owns the numbers — theme changes never alter the answer.
const OBJECTS = ["teddy", "apple", "mango", "star", "car", "fish", "balloon", "butterfly", "puppy", "rocket"];

// Deterministic candidate generator — the reliable MVP engine. AI output (when
// available) is validated identically; both paths converge on proven-safe items.
function deterministicBatch(gameId: string, difficulty: string, quantity: number, salt: string) {
  const items: { contentType: string; payload: Record<string, unknown>; tags: string[] }[] = [];
  for (let i = 0; i < quantity; i++) {
    const s = `${salt}-${gameId}-${difficulty}-${i}`;
    if (gameId === "addition") {
      const rand = mulberry32(hashSeed(s));
      const max = difficulty === "hard" ? 20 : difficulty === "medium" ? 10 : 5;
      const a = 1 + Math.floor(rand() * max);
      const b = 1 + Math.floor(rand() * max);
      const correctAnswer = a + b;
      const set = new Set<number>([correctAnswer]);
      for (const c of [correctAnswer + 1, correctAnswer - 1, correctAnswer + 2, Math.max(0, correctAnswer - 2)]) {
        if (set.size >= 4) break;
        if (c >= 0 && c <= 40 && !set.has(c)) set.add(c);
      }
      const theme = THEMES[Math.floor(rand() * THEMES.length)];
      items.push({
        contentType: "addition_question",
        payload: { theme, question: { a, b }, objects: { type: OBJECTS[Math.floor(rand() * OBJECTS.length)], countA: a, countB: b }, answerOptions: [...set], correctAnswer },
        tags: ["counting", theme],
      });
    } else if (gameId === "subtraction") {
      const rand = mulberry32(hashSeed(s));
      const max = difficulty === "hard" ? 20 : difficulty === "medium" ? 10 : 5;
      const startCount = 1 + Math.floor(rand() * max);
      const removedCount = Math.floor(rand() * (startCount + 1));
      const correctAnswer = startCount - removedCount;
      const set = new Set<number>([correctAnswer]);
      for (const c of [correctAnswer + 1, correctAnswer - 1, correctAnswer + 2, Math.max(0, correctAnswer - 2)]) {
        if (set.size >= 4) break;
        if (c >= 0 && c <= 20 && !set.has(c)) set.add(c);
      }
      const theme = THEMES[Math.floor(rand() * THEMES.length)];
      items.push({
        contentType: "subtraction_question",
        payload: { theme, question: { start: startCount, removed: removedCount }, objects: { type: "bird", startCount, removedCount }, answerOptions: [...set], correctAnswer },
        tags: ["subtraction", theme],
      });
    } else if (gameId === "clean-up") {
      const rand = mulberry32(hashSeed(s));
      const theme = CLEANUP_THEMES[Math.floor(rand() * CLEANUP_THEMES.length)];
      const def = createCleanupScene(s, theme, 3);
      items.push({ contentType: "clean_up_scene", payload: def as unknown as Record<string, unknown>, tags: ["cleanup", theme] });
    } else if (gameId === "puzzle") {
      const level = difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
      const def = createPuzzleDef(s, level as 1 | 2 | 3);
      items.push({ contentType: "picture_puzzle", payload: def as unknown as Record<string, unknown>, tags: ["puzzle", "spatial"] });
    } else if (gameId === "sketch") {
      // Activity levels spread across the band so batches vary meaningfully.
      const band = difficulty === "hard" ? [4, 5] : difficulty === "medium" ? [2, 3, 4] : [1, 2];
      const def = createSketchActivity(s, band[Number(hashSeed(s)) % band.length]);
      items.push({ contentType: "shadow_sketch", payload: def as unknown as Record<string, unknown>, tags: ["sketch", def.taskType ?? "tracing", def.shape] });
    }
  }
  return items;
}

const TaskInputSchema = z.object({
  gameId: z.enum(["addition", "subtraction", "clean-up", "puzzle", "sketch"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  quantity: z.number().int().min(1).max(100).default(10),
  theme: z.string().max(30).optional(),
  groundingTopic: z.string().min(2).max(200).optional(),
});

interface Grounding {
  text: string;
  provenance: { provider: string; sourceId: string; license: string; attribution: string; retrievedAt: string }[];
}

// OER grounding (advisory): fetch educational context for the generation
// prompt and stamp provenance on produced docs. Generation + validation are
// unchanged; unlicensed results never enter the pool (license gate in
// validateCandidate/insertActive path via provenance check).
async function fetchGrounding(topic: string | undefined): Promise<Grounding | null> {
  if (!topic) return null;
  try {
    const { ensureEducationProviders } = await import("@/integrations/education/init");
    const { educationGateway } = await import("@/integrations/education/gateway");
    ensureEducationProviders();
    const { results } = await educationGateway.searchEducationalContent({ query: topic, limit: 3 });
    if (results.length === 0) return null;
    const text = results.map((r) => `${r.title}: ${r.content.slice(0, 300)}`).join("\n");
    return { text, provenance: results.map((r) => ({ ...r.provenance })) };
  } catch {
    return null;
  }
}

export async function handleContentTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "content");
  const parsed = TaskInputSchema.safeParse(task.input);
  if (!parsed.success) throw new Error("Invalid content task input");
  const { gameId, difficulty, quantity, groundingTopic } = parsed.data;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  let generated = 0;
  let validated = 0;
  let rejected = 0;

  const grounding = await fetchGrounding(groundingTopic);
  if (grounding) {
    await logEvent(task.taskId, task.agentId, "grounding_attached", `OER grounding for "${groundingTopic}": ${grounding.provenance.length} source(s).`);
  }

  // 1. Attempt AI-assisted generation (rich task → mini routing); strict validation decides.
  try {
    const ai = await generateStructured({
      taskType: "content_generation",
      complexity: "rich",
      system: `Generate ${quantity} "${gameId}" learning items as JSON {"items":[{...}]}. Child-safe, simple, no violence. Math must be exact.${grounding ? `\nGround your explanations in this educational context (do not copy verbatim):\n${grounding.text.slice(0, 900)}` : ""}`,
      prompt: `game=${gameId} difficulty=${difficulty} quantity=${quantity}`,
      agentId: task.agentId,
      taskId: task.taskId,
    });
    const candidates = ((ai.data as { items?: unknown[] })?.items ?? []).slice(0, quantity);
    for (const [index, c] of candidates.entries()) {
      generated++;
      const payload = (c ?? {}) as Record<string, unknown>;
      const check = await validateCandidate(gameId, payload, db);
      if (!check.ok) {
        rejected++;
        continue;
      }
      await insertActive(db, task.agentId, gameId, difficulty, payload, "agent", undefined, [], `${task.taskId}-ai-${index}`, grounding?.provenance);
      validated++;
    }
  } catch {
    // AI failure never blocks the pool (BR-221): deterministic path below fills in.
  }

  // 2. Deterministic fill for the remainder — always safe by construction.
  const salt = `${task.taskId}`;
  for (const [index, item] of deterministicBatch(gameId, difficulty, quantity, salt).entries()) {
    if (validated >= quantity) break;
    generated++;
    const check = await validateCandidate(gameId, item.payload, db);
    if (!check.ok) {
      rejected++;
      continue;
    }
    await insertActive(db, task.agentId, gameId, difficulty, item.payload, "agent", item.contentType, item.tags, `${task.taskId}-det-${index}`);
    validated++;
  }

  await logEvent(task.taskId, task.agentId, "generation_completed", `${validated} approved, ${rejected} rejected for ${gameId}/${difficulty}.`);
  return { generated, validated, rejected, gameId, difficulty };
}

async function insertActive(
  db: Db,
  _agentId: string,
  gameId: string,
  difficulty: string,
  payload: Record<string, unknown>,
  source: string,
  contentType?: string,
  tags: string[] = [],
  contentId = newId("cnt"),
  provenance?: Grounding["provenance"]
): Promise<void> {
  await db.collection("content").updateOne(
    { contentId },
    {
      $setOnInsert: {
        contentId,
        gameId,
        difficulty,
        contentType: contentType ?? "generated",
        status: "active",
        version: 1,
        source,
        validation: { schema: true, deterministic: true, quality: true, safety: true },
        payload,
        assetIds: [],
        tags,
        usage: { shown: 0, completed: 0, correct: 0, incorrect: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        ...(provenance && provenance.length > 0 ? { sourceProvenance: provenance } : {}),
      },
    },
    { upsert: true }
  );
}
