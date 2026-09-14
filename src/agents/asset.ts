import { createHash } from "crypto";
import { getDb, newId } from "@/db/mongodb";
import { getTask, assertWrite, logEvent } from "@/server/agent-store";

// Asset Agent (DEC-080, BR-110): reuse-first. Only registers metadata when no
// suitable approved asset exists; binary generation requires an image provider
// and is recorded as pending rather than faked.
export async function handleAssetTask(data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId);
  if (!task) throw new Error(`Task ${data.taskId} not found`);
  assertWrite(task.agentId, "assets");
  const input = task.input as { type?: string; theme?: string; games?: string[] };
  const type = String(input.type ?? "object").slice(0, 40);
  const theme = String(input.theme ?? "garden").slice(0, 30);
  const games = Array.isArray(input.games) ? input.games.map(String).slice(0, 5) : [];
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const existing = await db
    .collection("assets")
    .findOne({ type, theme, status: "active" })
    .catch(() => null);
  if (existing) {
    const e = existing as unknown as { assetId: string };
    await logEvent(task.taskId, task.agentId, "asset_reused", `Reused ${e.assetId} (${type}/${theme}).`);
    return { reused: true, assetId: e.assetId };
  }

  const hash = createHash("sha256").update(`${type}|${theme}`).digest("hex").slice(0, 16);
  const dupe = await db.collection("assets").findOne({ hash }).catch(() => null);
  if (dupe) {
    const d = dupe as unknown as { assetId: string };
    await logEvent(task.taskId, task.agentId, "asset_reused", `Deduplicated to ${d.assetId} by hash.`);
    return { reused: true, assetId: d.assetId, deduplicated: true };
  }

  const assetId = newId("asset");
  await db.collection("assets").insertOne({
    assetId,
    type,
    theme,
    games,
    status: "pending",
    hash,
    source: "agent",
    note: "Binary generation requires an image provider; metadata registered, reuse preferred.",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.collection("assetVersions").insertOne({ assetId, version: 1, changeReason: "registered", createdAt: new Date() }).catch(() => null);
  await logEvent(task.taskId, task.agentId, "asset_registered", `Registered ${assetId} (${type}/${theme}) as pending.`);
  return { reused: false, assetId, status: "pending" };
}
