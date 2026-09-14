// Standalone BullMQ worker entrypoint. Run with: node --loader ts-node ... or via `npm run worker`
// In production Docker, the `worker` service runs `npm run worker` alongside `web`.

import { ensureWorkers } from "./ensure";

// Eagerly register handlers and keep process alive when REDIS_URL is configured.
ensureWorkers();

// Lazy BullMQ connection is established on first enqueue or if this process itself enqueues.
// For a dedicated worker process we want to eagerly connect even without HTTP traffic.
if (process.env.REDIS_URL) {
  // Trigger lazy initialization eagerly.
  import("@/queue/queue").then((m) => {
    // Access internal bullAvailable by enqueuing a no-op (handlers already registered).
    // Keep alive; workers are running via ensureWorkers → bullAvailable → Queue/Worker.
    console.log("[learnzzy] worker started, queues:", process.env.REDIS_URL ? "durable" : "in-process");
  }).catch((e) => console.error("[learnzzy] worker failed", e));
} else {
  console.log("[learnzzy] worker running in-process mode (REDIS_URL not set) — no durable queues, handlers ready if web enqueues in-process.");
}
