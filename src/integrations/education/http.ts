import { EducationGatewayError, classifyHttpStatus, isRetryableCode } from "./errors";
import type { ProviderName } from "./types";
import type { ProviderConfig } from "./config";

// Shared HTTP transport for provider adapters: timeout, bounded retry with
// exponential backoff, response-size limits, error classification. No
// arbitrary URL fetching — callers pass paths appended to the configured
// allowlisted base URL only.
export interface HttpResult {
  status: number;
  json: unknown;
  bytes: number;
  attempts: number;
  durationMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function providerFetch(
  provider: ProviderName,
  config: ProviderConfig,
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; headers?: Record<string, string> } = {}
): Promise<HttpResult> {
  if (!config.enabled || !config.baseUrl) {
    throw new EducationGatewayError("MCP_DISABLED", provider, `${provider} is disabled or unconfigured.`);
  }
  if (!path.startsWith("/") || path.includes("..")) {
    throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "Refusing non-allowlisted provider path.");
  }
  const url = `${config.baseUrl.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    ...(init.headers ?? {}),
  };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;

  const maxAttempts = 1 + Math.max(0, Math.min(3, config.maxRetries));
  let lastError: EducationGatewayError | null = null;
  const started = Date.now();
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.timeoutMs);
    try {
      const res = await fetch(url, {
        method: init.method ?? "GET",
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: ctrl.signal,
      });
      const text = await res.text();
      const bytes = Buffer.byteLength(text, "utf8");
      if (bytes > config.maxResponseBytes) {
        throw new EducationGatewayError("MCP_RESPONSE_TOO_LARGE", provider, `${provider} response exceeded ${config.maxResponseBytes} bytes.`);
      }
      if (!res.ok) {
        const { code, retryable } = classifyHttpStatus(res.status);
        throw new EducationGatewayError(code, provider, `${provider} responded HTTP ${res.status}.`, retryable);
      }
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        throw new EducationGatewayError("MCP_INVALID_RESPONSE", provider, `${provider} returned non-JSON.`);
      }
      return { status: res.status, json, bytes, attempts: attempt, durationMs: Date.now() - started };
    } catch (err) {
      if (err instanceof EducationGatewayError) {
        lastError = err;
        if (!isRetryableCode(err.code) || attempt === maxAttempts) throw err;
      } else if (err instanceof Error && err.name === "AbortError") {
        lastError = new EducationGatewayError("MCP_TIMEOUT", provider, `${provider} timed out after ${config.timeoutMs}ms.`, true);
        if (attempt === maxAttempts) throw lastError;
      } else {
        lastError = new EducationGatewayError("MCP_UNAVAILABLE", provider, `${provider} unreachable: ${err instanceof Error ? err.message : String(err)}`, true);
        if (attempt === maxAttempts) throw lastError;
      }
      // Exponential backoff: 250ms, 500ms, 1000ms.
      await sleep(250 * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new EducationGatewayError("MCP_UNAVAILABLE", provider, `${provider} request failed.`, true);
}
