import * as Sentry from "@sentry/nextjs";

// Client-side Sentry. Inert unless SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN)
// is set — local dev and DSN-less deploys report nothing anywhere.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn || undefined,
  enabled: !!dsn,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
});
