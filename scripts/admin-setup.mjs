// Prints ADMIN_* env lines for .env.local. The password never touches the repo.
import { randomBytes, scryptSync } from "crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/admin-setup.mjs <password-min-12-chars>");
  process.exit(1);
}
const salt = "learnzzy-admin-v1";
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
console.log("Add these lines to .env.local (never commit):");
console.log("ADMIN_EMAIL=admin@learnzzy.local");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_AUTH_SECRET=${randomBytes(32).toString("hex")}`);
