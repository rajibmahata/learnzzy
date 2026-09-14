import { getDb, newId } from "@/db/mongodb";

// Audit trail for consequential admin actions (BR-165). No secrets, no prompts.
export async function audit(args: {
  actorType: string;
  actorId: string;
  action: string;
  target?: Record<string, unknown>;
  result?: string;
  requestId?: string;
}): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("auditLogs")
    .insertOne({
      auditId: newId("audit"),
      actor: { type: args.actorType, id: args.actorId },
      action: args.action,
      target: args.target ?? {},
      requestId: args.requestId,
      result: args.result ?? "success",
      createdAt: new Date(),
    })
    .catch(() => null);
}
