import * as Sentry from "@sentry/nextjs";

// Single reporting surface for the app. Without SENTRY_DSN everything
// degrades to console output — no network calls, no errors thrown.
// Never pass secrets, tokens, pairing codes, or child PII as context.
function enabled(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (!enabled()) {
    console.error("[learnzzy] error", err, context ?? "");
    return;
  }
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    console.error("[learnzzy] error", err, context ?? "");
  }
}

export function captureMessage(msg: string, level: "info" | "warning" | "error" = "info") {
  if (!enabled()) return;
  try {
    Sentry.captureMessage(msg, level);
  } catch {
    /* reporting must never break the app */
  }
}
