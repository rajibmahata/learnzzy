import { getDb } from "@/db/mongodb";
import type { ProviderHealth, ProviderHealthStatus, ProviderName } from "./types";
import { cacheStats } from "./cache";

// Provider health tracking: in-memory rolling state + durable event log in
// `educationProviderEvents`. Never exposes secrets; messages are truncated.
interface Rolling {
  status: ProviderHealthStatus;
  latencyMs: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCode: string | null;
  errors: { at: number }[];
}

const rolling = new Map<ProviderName, Rolling>();

function get(provider: ProviderName): Rolling {
  let r = rolling.get(provider);
  if (!r) {
    r = { status: "disabled", latencyMs: null, lastSuccessAt: null, lastFailureAt: null, lastErrorCode: null, errors: [] };
    rolling.set(provider, r);
  }
  return r;
}

export function markDisabled(provider: ProviderName): void {
  get(provider).status = "disabled";
}

export async function recordProviderEvent(args: {
  provider: ProviderName;
  operation: string;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
  cacheHit?: boolean;
  retryCount?: number;
  responseBytes?: number;
  correlationId?: string;
}): Promise<void> {
  const r = get(args.provider);
  const now = new Date().toISOString();
  if (args.success) {
    r.status = "healthy";
    r.latencyMs = args.durationMs;
    r.lastSuccessAt = now;
  } else {
    r.lastFailureAt = now;
    r.lastErrorCode = args.errorCode ?? "MCP_UNAVAILABLE";
    r.errors.push({ at: Date.now() });
    // Keep last 100 error timestamps for 24h counting.
    if (r.errors.length > 100) r.errors.splice(0, r.errors.length - 100);
    const recent = r.errors.filter((e) => Date.now() - e.at < 60 * 60 * 1000).length;
    r.status = recent >= 5 ? "degraded" : "unreachable";
  }
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db
    .collection("educationProviderEvents")
    .insertOne({
      provider: args.provider,
      operation: args.operation.slice(0, 80),
      durationMs: args.durationMs,
      success: args.success,
      errorCode: args.errorCode ?? null,
      cacheHit: args.cacheHit ?? false,
      retryCount: args.retryCount ?? 0,
      responseBytes: args.responseBytes ?? 0,
      correlationId: args.correlationId ?? null,
      createdAt: new Date(),
    })
    .catch(() => null);
}

export async function providerHealth(provider: ProviderName, enabled: boolean): Promise<ProviderHealth> {
  const r = get(provider);
  const db = await getDb().catch(() => null);
  let errorCount24h = 0;
  if (db) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    errorCount24h = await db
      .collection("educationProviderEvents")
      .countDocuments({ provider, success: false, createdAt: { $gte: since } })
      .catch(() => r.errors.filter((e) => Date.now() - e.at < 24 * 60 * 60 * 1000).length);
  } else {
    errorCount24h = r.errors.filter((e) => Date.now() - e.at < 24 * 60 * 60 * 1000).length;
  }
  return {
    provider,
    enabled,
    status: enabled ? r.status === "disabled" ? "unreachable" : r.status : "disabled",
    latencyMs: r.latencyMs,
    lastSuccessAt: r.lastSuccessAt,
    lastFailureAt: r.lastFailureAt,
    lastErrorCode: r.lastErrorCode,
    errorCount24h,
    cacheHitRate: cacheStats().hitRate,
  };
}
