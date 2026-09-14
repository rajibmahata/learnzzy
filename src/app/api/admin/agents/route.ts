import { NextResponse } from "next/server";
import { getDb } from "@/db/mongodb";
import { AGENTS, ensureAgents } from "@/server/agent-store";
import { requireAdmin } from "@/server/admin";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  if (!db) return NextResponse.json({ success: true, data: AGENTS.map((agent) => ({ ...agent, status: "unavailable" })) });
  await ensureAgents();
  const docs = await db.collection("agents").find({}, { projection: { _id: 0 } }).toArray();
  const byId = new Map(docs.map((doc) => [String(doc.agentId), doc]));
  return NextResponse.json({ success: true, data: AGENTS.map((agent) => ({ ...agent, ...(byId.get(agent.agentId) ?? {}) })) });
}
