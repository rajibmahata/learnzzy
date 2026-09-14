import type { ProviderName } from "./types";

// Server-side provider configuration. All flags default to disabled; a
// missing URL or key keeps the provider disabled (fail-closed, never
// fail-open into an unconfigured external call).
export interface ProviderConfig {
  name: ProviderName;
  enabled: boolean;
  baseUrl: string | null;
  apiKey: string | null;
  timeoutMs: number;
  maxRetries: number;
  maxResponseBytes: number;
  cacheTtlSeconds: number;
}

function boolEnv(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "true" || v === "1" || v.toLowerCase() === "yes";
}

function numEnv(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function strEnv(key: string): string | null {
  const v = process.env[key]?.trim();
  return v ? v : null;
}

export const GATEWAY_DEFAULTS = {
  timeoutMs: numEnv("EDUCATION_GATEWAY_TIMEOUT_MS", 5000),
  maxRetries: 2,
  maxResponseBytes: 256 * 1024, // 256 KiB — responses are metadata, never bulk content
  cacheTtlSeconds: 6 * 60 * 60, // 6h for knowledge/curriculum; learner state uses shorter TTL below
  learnerStateTtlSeconds: 15 * 60, // 15m — mastery data goes stale fast
} as const;

export function tutorConfig(): ProviderConfig {
  const baseUrl = strEnv("TUTOR_MCP_URL");
  const apiKey = strEnv("TUTOR_MCP_API_KEY");
  const enabled = boolEnv("TUTOR_MCP_ENABLED", false) && !!baseUrl;
  return { name: "tutor-mcp", enabled, baseUrl, apiKey, timeoutMs: GATEWAY_DEFAULTS.timeoutMs, maxRetries: GATEWAY_DEFAULTS.maxRetries, maxResponseBytes: GATEWAY_DEFAULTS.maxResponseBytes, cacheTtlSeconds: GATEWAY_DEFAULTS.learnerStateTtlSeconds };
}

export function oerConfig(): ProviderConfig {
  const baseUrl = strEnv("OER_MCP_URL");
  const apiKey = strEnv("OER_MCP_API_KEY");
  const enabled = boolEnv("OER_MCP_ENABLED", false) && !!baseUrl;
  return { name: "oer-mcp", enabled, baseUrl, apiKey, timeoutMs: GATEWAY_DEFAULTS.timeoutMs, maxRetries: GATEWAY_DEFAULTS.maxRetries, maxResponseBytes: GATEWAY_DEFAULTS.maxResponseBytes, cacheTtlSeconds: GATEWAY_DEFAULTS.cacheTtlSeconds };
}

export function ncertConfig(): ProviderConfig {
  const baseUrl = strEnv("NCERT_MCP_URL");
  const apiKey = strEnv("NCERT_MCP_API_KEY");
  const enabled = boolEnv("NCERT_MCP_ENABLED", false) && !!baseUrl;
  return { name: "ncert-mcp", enabled, baseUrl, apiKey, timeoutMs: GATEWAY_DEFAULTS.timeoutMs, maxRetries: GATEWAY_DEFAULTS.maxRetries, maxResponseBytes: GATEWAY_DEFAULTS.maxResponseBytes, cacheTtlSeconds: GATEWAY_DEFAULTS.cacheTtlSeconds };
}

export function allProviderConfigs(): ProviderConfig[] {
  return [tutorConfig(), oerConfig(), ncertConfig()];
}
