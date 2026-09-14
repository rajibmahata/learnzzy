import type { ProviderName } from "./types";

// Structured error classification for every gateway/provider failure.
// Callers switch on `code`, never on message text.
export type EducationErrorCode =
  | "MCP_DISABLED"
  | "MCP_TIMEOUT"
  | "MCP_UNAVAILABLE"
  | "MCP_AUTH_ERROR"
  | "MCP_RATE_LIMITED"
  | "MCP_INVALID_RESPONSE"
  | "MCP_RESPONSE_TOO_LARGE";

export class EducationGatewayError extends Error {
  code: EducationErrorCode;
  provider: ProviderName | "gateway";
  retryable: boolean;
  constructor(code: EducationErrorCode, provider: ProviderName | "gateway", message: string, retryable = false) {
    super(message);
    this.name = "EducationGatewayError";
    this.code = code;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export function classifyHttpStatus(status: number): { code: EducationGatewayError["code"]; retryable: boolean } {
  if (status === 401 || status === 403) return { code: "MCP_AUTH_ERROR", retryable: false };
  if (status === 429) return { code: "MCP_RATE_LIMITED", retryable: true };
  if (status >= 500) return { code: "MCP_UNAVAILABLE", retryable: true };
  return { code: "MCP_INVALID_RESPONSE", retryable: false };
}

export function isRetryableCode(code: EducationGatewayError["code"]): boolean {
  return code === "MCP_TIMEOUT" || code === "MCP_UNAVAILABLE" || code === "MCP_RATE_LIMITED";
}
