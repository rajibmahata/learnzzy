// Sentry placeholder — real DSN wires via SENTRY_DSN env. No secrets in repo.
// Replace with `import * as Sentry from "@sentry/nextjs"` when enabling.
export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (process.env.SENTRY_DSN) {
    console.error("[sentry] capture", err, context);
  } else {
    console.error("[learnzzy] error", err, context);
  }
}
export function captureMessage(msg: string, level: "info" | "warning" | "error" = "info") {
  if (process.env.SENTRY_DSN) console.log(`[sentry:${level}]`, msg);
}
