// AI provider configuration — model choice lives here, never in business logic (DEC-062/063).
export const AI_CONFIG = {
  nanoModel: process.env.AI_MODEL_NANO || "gpt-5-nano",
  miniModel: process.env.AI_MODEL_MINI || "gpt-5-mini",
  baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  timeoutMs: Number(process.env.AI_TIMEOUT_MS || "30000"),
  maxDailyRequests: Number(process.env.AI_MAX_DAILY_REQUESTS || "1000"),
  maxDailyCostUsd: Number(process.env.AI_MAX_DAILY_COST_USD || "10"),
  // Estimated USD per 1K tokens (configurable; refined from invoices later).
  rates: {
    nano: { in: Number(process.env.AI_RATE_NANO_IN || "0.0001"), out: Number(process.env.AI_RATE_NANO_OUT || "0.0002") },
    mini: { in: Number(process.env.AI_RATE_MINI_IN || "0.0005"), out: Number(process.env.AI_RATE_MINI_OUT || "0.001") },
  },
};

export type AIModelClass = "nano" | "mini";
export type AITaskComplexity = "simple" | "rich";

// Cost-aware routing (DEC-063): cheap model for simple tasks, stronger only when needed.
export function routeModel(complexity: AITaskComplexity): { cls: AIModelClass; model: string } {
  if (complexity === "rich") return { cls: "mini", model: AI_CONFIG.miniModel };
  return { cls: "nano", model: AI_CONFIG.nanoModel };
}
