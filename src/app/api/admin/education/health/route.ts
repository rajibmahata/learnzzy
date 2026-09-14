import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { educationGateway } from "@/integrations/education/gateway";
import { ensureEducationProviders } from "@/integrations/education/init";
import { cacheStats } from "@/integrations/education/cache";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  ensureEducationProviders();
  const { providers } = await educationGateway.health();
  return NextResponse.json({ success: true, data: { providers, cache: cacheStats(), checkedAt: new Date().toISOString() } });
}
