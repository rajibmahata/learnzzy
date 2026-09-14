import { setTaskStatus, recordRun, logEvent, getTask } from "@/server/agent-store";

// Job queue abstraction (DEC-091/151). BullMQ + Redis when REDIS_URL is set;
// same handler registry runs in-process otherwise, so background agent work
// functions identically in local dev. Gameplay never touches this path.

type Handler = (data: { taskId: string }) => Promise<Record<string, unknown>>;

const handlers = new Map<string, Handler>();
let bullQueues = new Map<string, unknown>();
let bullReady: Promise<void> | null = null;

export function registerHandler(queue: string, fn: Handler): void {
  handlers.set(queue, fn);
}

async function bullAvailable(): Promise<boolean> {
  if (!process.env.REDIS_URL) return false;
  if (!bullReady) {
    bullReady = (async () => {
      const [{ Queue, Worker }, { default: IORedis }] = await Promise.all([
        import("bullmq"),
        import("ioredis"),
      ]);
      const connection = new IORedis(process.env.REDIS_URL as string, { maxRetriesPerRequest: null });
      for (const [queue, fn] of handlers) {
        const q = new Queue(queue, { connection });
        bullQueues.set(queue, q);
        new Worker(
          queue,
          async (job) => {
            const data = job.data as { taskId: string };
            return runWithRetry(queue, fn, data);
          },
          { connection, concurrency: 2 }
        );
      }
    })().catch(() => {
      bullQueues = new Map();
    });
  }
  await bullReady;
  return bullQueues.size > 0;
}

async function runWithRetry(queue: string, fn: Handler, data: { taskId: string }): Promise<Record<string, unknown>> {
  const task = await getTask(data.taskId).catch(() => null);
  const agentId = task?.agentId ?? "unknown";
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await setTaskStatus(data.taskId, "running", { attempts: attempt, startedAt: new Date() });
    const runId = await recordRun({ taskId: data.taskId, agentId, attempt, status: "running" });
    try {
      const result = await fn(data);
      await recordRun({ taskId: data.taskId, agentId, attempt, status: "completed", result });
      await setTaskStatus(data.taskId, "completed", { result, completedAt: new Date() });
      await logEvent(runId, agentId, "task_completed", `Completed after ${attempt} attempt(s).`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await recordRun({ taskId: data.taskId, agentId, attempt, status: "failed", error: message });
      await logEvent(runId, agentId, "task_failed", `Attempt ${attempt} failed: ${message}`, "error");
      if (attempt === maxAttempts) {
        await setTaskStatus(data.taskId, "failed", { error: message, completedAt: new Date() });
        throw err;
      }
      // Exponential backoff before retry (agent failure rules).
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

export async function enqueue(queue: string, data: { taskId: string }): Promise<{ queued: boolean; durable: boolean }> {
  const fn = handlers.get(queue);
  if (!fn) throw new Error(`No handler registered for queue ${queue}`);
  if (await bullAvailable().catch(() => false)) {
    const q = bullQueues.get(queue) as { add: (n: string, d: unknown, o?: unknown) => Promise<unknown> };
    await q.add("job", data, { attempts: 3, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 100 });
    return { queued: true, durable: true };
  }
  // In-process execution: same retry/audit semantics, no Redis required.
  void runWithRetry(queue, fn, data).catch(() => null);
  return { queued: true, durable: false };
}
