import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { poolStatuses } from "@/server/pools";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ success: true, data: await poolStatuses() });
}
