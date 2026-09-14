// Anonymous session + offline event queue helpers. BR-001, BR-140, BR-210..213.
// No PII. Events are append-only, validated, batched, idempotent via clientEventId.
export interface QueuedEvent {
  clientEventId: string;
  event: string;
  gameId?: string;
  contentId?: string;
  metadata?: Record<string, unknown>;
  clientTimestamp: string;
}

const SESSION_KEY = "learnzzy.sessionId";
const QUEUE_KEY = "learnzzy.eventQueue";

export function getSessionId(): string {
  if (typeof window === "undefined") return "sess_server";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function queueEvent(e: Omit<QueuedEvent, "clientEventId" | "clientTimestamp">) {
  if (typeof window === "undefined") return;
  const full: QueuedEvent = {
    ...e,
    clientEventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    clientTimestamp: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr: QueuedEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(full);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(arr.slice(-200)));
  } catch {
    /* storage full/blocked — gameplay continues, analytics degrades gracefully */
  }
  // Fire-and-forget sync; never blocks gameplay (BR-200).
  void syncEvents().catch(() => {});
}

export async function syncEvents(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return;
  const arr: QueuedEvent[] = JSON.parse(raw);
  if (arr.length === 0) return;
  const sessionId = getSessionId();
  const res = await fetch("/api/game-events/batch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, events: arr }),
  }).catch(() => null);
  if (res && res.ok) localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}
