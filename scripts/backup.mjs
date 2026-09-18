// Driver-based MongoDB backup: dumps key collections to timestamped JSON.
// Needs no mongodump binary. Usage:
//   MONGODB_URI=mongodb://127.0.0.1:27018 MONGODB_DB_NAME=learnzzy node scripts/backup.mjs [outDir]
// Restores are manual (mongoimport or scripts/seed.mjs for content/levels).
// Never commits backups (gitignored via *.log? no — keep backups OUT of repo by default outDir).
import { MongoClient } from "mongodb";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const COLLECTIONS = [
  "games",
  "gameConfigs",
  "content",
  "contentVersions",
  "assets",
  "assetVersions",
  "sessions",
  "gameEvents",
  "agents",
  "agentTasks",
  "agentRuns",
  "agentEvents",
  "difficultyRules",
  "difficultyRecommendations",
  "systemSettings",
  "aiUsage",
  "auditLogs",
  "learners",
  "levels",
  "learningPlans",
  "learningSignals",
  "parents",
  "parentChildLinks",
  "pairingCodes",
  "educationProviderEvents",
  "educationKnowledgeCache",
  "academicPlans",
  "voiceAssets",
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Refusing to back up.");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB_NAME || "learnzzy_dev";
const outDir = join(process.argv[2] || "./backups", `${dbName}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
mkdirSync(outDir, { recursive: true });

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const manifest = { db: dbName, at: new Date().toISOString(), collections: {} };
for (const name of COLLECTIONS) {
  try {
    const docs = await db.collection(name).find({}).toArray();
    writeFileSync(join(outDir, `${name}.json`), JSON.stringify(docs));
    manifest.collections[name] = docs.length;
    console.log(`${name}: ${docs.length}`);
  } catch (err) {
    manifest.collections[name] = `error: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`${name}: FAILED`);
  }
}
writeFileSync(join(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2));
await client.close();
console.log(`backup complete: ${outDir}`);
