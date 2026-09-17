import { registerHandler } from "@/queue/queue";
import { AGENTS } from "@/server/agent-store";
import { handleContentTask } from "@/agents/content";
import { handleQualityTask } from "@/agents/quality";
import { handleAssetTask } from "@/agents/asset";
import { handleAnalyticsTask } from "@/agents/analytics";
import { handleDifficultyTask } from "@/agents/difficulty";
import { handlePersonalizationTask } from "@/agents/personalization";
import { handleAcademicTask } from "@/agents/academic";
import { handleQaTask } from "@/agents/qa";

// Worker wiring: agent queue → handler. Imported (for side effects) by every
// API route that enqueues agent work, so handlers exist in-process as well as
// on BullMQ workers (DEC-091).
let registered = false;

export function ensureWorkers(): void {
  if (registered) return;
  registered = true;
  const byId = Object.fromEntries(AGENTS.map((a) => [a.agentId, a.queue]));
  registerHandler(byId["content-agent"], handleContentTask);
  registerHandler(byId["quality-safety-agent"], handleQualityTask);
  registerHandler(byId["asset-agent"], handleAssetTask);
  registerHandler(byId["analytics-agent"], handleAnalyticsTask);
  registerHandler(byId["difficulty-agent"], handleDifficultyTask);
  registerHandler(byId["personalization-agent"], handlePersonalizationTask);
  registerHandler(byId["academic-agent"], handleAcademicTask);
  registerHandler(byId["qa-agent"], handleQaTask);
}
