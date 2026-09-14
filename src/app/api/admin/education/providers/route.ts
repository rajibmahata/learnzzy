import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { allProviderConfigs } from "@/integrations/education/config";
import { ensureEducationProviders } from "@/integrations/education/init";

// Provider inventory: flags + configuration presence. Never returns secrets,
// keys, or URLs.
export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  ensureEducationProviders();
  const providers = allProviderConfigs().map((c) => ({
    provider: c.name,
    enabled: c.enabled,
    configured: c.baseUrl !== null,
    timeoutMs: c.timeoutMs,
    maxRetries: c.maxRetries,
    cacheTtlSeconds: c.cacheTtlSeconds,
  }));
  return NextResponse.json({ success: true, data: { providers } });
}
