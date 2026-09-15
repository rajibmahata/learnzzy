// Creates a local-only `.env` for `docker compose` interpolation.
// Syncs ADMIN_*/AI_*/NEXT_PUBLIC_APP_URL from `.env.local` when present,
// fills missing auth secrets with random values. Idempotent: never
// overwrites an existing `.env`. The file is gitignored — local only.
import { randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  console.log("[INFO] .env already present for Docker Compose.");
  process.exit(0);
}

const SYNC_KEYS = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_AUTH_SECRET",
  "AI_API_KEY",
  "AI_BASE_URL",
  "NEXT_PUBLIC_APP_URL",
];
const SECRET_KEYS = ["ADMIN_AUTH_SECRET", "PARENT_AUTH_SECRET"];

const values = new Map();
try {
  const local = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of local.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && SYNC_KEYS.includes(m[1]) && m[2]) values.set(m[1], m[2]);
  }
} catch {
  /* no .env.local — all secrets generated */
}
for (const k of SECRET_KEYS) {
  if (!values.has(k)) values.set(k, randomBytes(32).toString("hex"));
}

const out = [
  "# Local Docker secrets - gitignored, generated " + new Date().toISOString(),
  ...[...values.entries()].map(([k, v]) => `${k}=${v}`),
  "",
].join("\n");
writeFileSync(envPath, out);
console.log("[INFO] .env created with local-only secrets (ADMIN_* synced from .env.local where present).");
