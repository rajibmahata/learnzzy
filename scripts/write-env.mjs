// Rebuilds local gitignored .env with correct values (utf8, LF).
// Usage: node scripts/write-env.mjs <admin-password-min-12-chars>
// Overwrites .env entirely. Docker picks it up on next `compose up`.
import { randomBytes, scryptSync } from "crypto";
import { writeFileSync } from "fs";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/write-env.mjs <password-min-12-chars>");
  process.exit(1);
}
const salt = "learnzzy-admin-v1";
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const lines = [
  "# Local Docker secrets - gitignored. Managed by scripts/write-env.mjs.",
  "ADMIN_EMAIL=admin@learnzzy.local",
  "ADMIN_PASSWORD_HASH=" + hash,
  "ADMIN_AUTH_SECRET=" + randomBytes(32).toString("hex"),
  "PARENT_AUTH_SECRET=" + randomBytes(32).toString("hex"),
  "",
];
writeFileSync(".env", lines.join("\n"), "utf8");
console.log("OK .env rebuilt (utf8)");
