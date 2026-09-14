import { AI_CONFIG, routeModel, type AITaskComplexity } from "./config";
import { recordUsage, todayTotals } from "@/repositories/ai-usage";

// AIService — the ONLY gateway to AI providers (DEC-062/064). Gameplay code,
// agents and admin all go through here. Keys never leave the server.
// Output is ALWAYS untrusted: callers must validate (DEC-071).

export interface StructuredResult {
  data: unknown;
  model: string;
  modelClass: "nano" | "mini";
  inputTokens: number;
  outputTokens: number;
  mocked: boolean;
}

interface Provider {
  name: string;
  generate(args: { model: string; system: string; prompt: string }): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
  }>;
}

function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

// Deterministic dev provider: template-based structured content, no network,
// no cost. Used when AI_API_KEY is unset. NEVER used for authoritative answers
// — outputs still flow through the full validation pipeline.
const mockProvider: Provider = {
  name: "mock",
  async generate({ prompt }) {
    return { text: JSON.stringify({ mock: true, echo: prompt.slice(0, 200) }), inputTokens: 10, outputTokens: 10 };
  },
};

const httpProvider: Provider = {
  name: "http",
  async generate({ model, system, prompt }) {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not configured");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), AI_CONFIG.timeoutMs);
    try {
      const res = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`AI provider responded ${res.status}`);
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = body.choices?.[0]?.message?.content ?? "{}";
      return {
        text,
        inputTokens: body.usage?.prompt_tokens ?? estimateTokens(system + prompt),
        outputTokens: body.usage?.completion_tokens ?? estimateTokens(text),
      };
    } finally {
      clearTimeout(timer);
    }
  },
};

function estimateCost(cls: "nano" | "mini", inputTokens: number, outputTokens: number): number {
  const r = AI_CONFIG.rates[cls];
  return (inputTokens / 1000) * r.in + (outputTokens / 1000) * r.out;
}

export async function generateStructured(args: {
  taskType: string;
  complexity: AITaskComplexity;
  system: string;
  prompt: string;
  agentId?: string;
  taskId?: string;
  runId?: string;
}): Promise<StructuredResult> {
  const { cls, model } = routeModel(args.complexity);
  // Cost controls (BR-107): pause generation when budgets are exhausted.
  const totals = await todayTotals().catch(() => ({ requests: 0, costUsd: 0 }));
  if (totals.requests >= AI_CONFIG.maxDailyRequests || totals.costUsd >= AI_CONFIG.maxDailyCostUsd) {
    throw new Error("AI daily budget exhausted — generation paused, existing content unaffected");
  }
  const provider = process.env.AI_API_KEY ? httpProvider : mockProvider;
  try {
    const out = await provider.generate({ model, system: args.system, prompt: args.prompt });
    let data: unknown = {};
    try {
      data = JSON.parse(out.text);
    } catch {
      throw new Error("AI provider returned non-JSON output");
    }
    await recordUsage({
      agentId: args.agentId,
      taskId: args.taskId,
      runId: args.runId,
      provider: provider.name,
      model,
      taskType: args.taskType,
      inputTokens: out.inputTokens,
      outputTokens: out.outputTokens,
      estimatedCostUsd: provider.name === "mock" ? 0 : estimateCost(cls, out.inputTokens, out.outputTokens),
      status: provider.name === "mock" ? "mock" : "success",
    }).catch(() => null);
    return { data, model, modelClass: cls, inputTokens: out.inputTokens, outputTokens: out.outputTokens, mocked: provider.name === "mock" };
  } catch (err) {
    await recordUsage({
      agentId: args.agentId,
      taskId: args.taskId,
      runId: args.runId,
      provider: provider.name,
      model,
      taskType: args.taskType,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      status: "error",
    }).catch(() => null);
    throw err;
  }
}

export async function classify(args: { text: string; labels: string[]; agentId?: string }): Promise<string> {
  // Simple task → nano routing. Heuristic fallback keeps the pipeline working offline.
  if (!process.env.AI_API_KEY) {
    const t = args.text.toLowerCase();
    return args.labels.find((l) => t.includes(l.toLowerCase())) ?? args.labels[0] ?? "other";
  }
  const res = await generateStructured({
    taskType: "classify",
    complexity: "simple",
    system: `Classify into exactly one of: ${args.labels.join(", ")}. Reply {"label": "..."}.`,
    prompt: args.text,
    agentId: args.agentId,
  });
  const label = (res.data as { label?: unknown })?.label;
  return typeof label === "string" && args.labels.includes(label) ? label : (args.labels[0] ?? "other");
}

export async function summarize(args: { text: string; agentId?: string }): Promise<string> {
  if (!process.env.AI_API_KEY) return args.text.slice(0, 160);
  const res = await generateStructured({
    taskType: "summarize",
    complexity: "simple",
    system: "Summarize in one short operational sentence. Reply {\"summary\": \"...\"}.",
    prompt: args.text,
    agentId: args.agentId,
  });
  const s = (res.data as { summary?: unknown })?.summary;
  return typeof s === "string" ? s.slice(0, 300) : args.text.slice(0, 160);
}
