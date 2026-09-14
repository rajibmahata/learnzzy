import { NextResponse } from "next/server";
import { computeGameStats } from "@/agents/analytics";
import { requireAdmin } from "@/server/admin";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const stats = await computeGameStats();
  return NextResponse.json({ success: true, data: stats });
}
