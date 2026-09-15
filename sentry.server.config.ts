import * as Sentry from "@sentry/nextjs";

// Server-side Sentry (API routes, agents, workers). Inert without SENTRY_DSN.
const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn: dsn || undefined,
  enabled: !!dsn,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
});
