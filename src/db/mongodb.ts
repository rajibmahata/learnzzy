import { MongoClient, Db } from "mongodb";

// Repository boundary: UI/Game → API → Service → Repository → MongoDB (DEC-042).
// Connection is lazy + cached. If MONGODB_URI is unset (local dev without DB),
// getDb() returns null and routes degrade gracefully (BR-221): gameplay continues
// on deterministic local content, events stay in the client offline queue.

let client: MongoClient | null = null;
let db: Db | null = null;
let connected = false;
let indexesEnsured = false;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (db) return db;
  const name = process.env.MONGODB_DB_NAME || "learnzzy_dev";
  client ??= new MongoClient(uri, { maxPoolSize: 10 });
  if (!connected) {
    await client.connect();
    connected = true;
  }
  db = client.db(name);
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  // DATABASE.md §25 — index strategy for gameplay + admin query patterns.
  await Promise.all([
    db.collection("games").createIndex({ gameId: 1 }, { unique: true }),
    db.collection("games").createIndex({ status: 1 }),
    db.collection("gameConfigs").createIndex(
      { gameId: 1, difficulty: 1, status: 1 },
      { unique: true }
    ),
    db.collection("content").createIndex({ contentId: 1 }, { unique: true }),
    db.collection("content").createIndex({ gameId: 1, difficulty: 1, status: 1, createdAt: 1 }),
    db.collection("content").createIndex({ gameId: 1, status: 1, createdAt: 1 }),
    db.collection("contentVersions").createIndex(
      { contentId: 1, version: 1 },
      { unique: true }
    ),
    db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ status: 1, lastActivityAt: 1 }),
    db.collection("gameEvents").createIndex({ eventId: 1 }, { unique: true }),
    db.collection("gameEvents").createIndex({ sessionId: 1, serverTimestamp: 1 }),
    db.collection("gameEvents").createIndex({ gameId: 1, event: 1, serverTimestamp: 1 }),
    db.collection("agentTasks").createIndex({ taskId: 1 }, { unique: true }),
    db.collection("agentTasks").createIndex({ status: 1, createdAt: 1 }),
    db.collection("agents").createIndex({ agentId: 1 }, { unique: true }),
    db.collection("agentRuns").createIndex({ runId: 1 }, { unique: true }),
    db.collection("agentRuns").createIndex({ agentId: 1, startedAt: -1 }),
    db.collection("agentEvents").createIndex({ runId: 1, createdAt: 1 }),
    db.collection("assets").createIndex({ assetId: 1 }, { unique: true }),
    db.collection("difficultyRecommendations").createIndex({ recommendationId: 1 }, { unique: true }),
    db.collection("auditLogs").createIndex({ createdAt: -1 }),
    db.collection("aiUsage").createIndex({ createdAt: -1 }),
    db.collection("learners").createIndex({ learnerId: 1 }, { unique: true }),
    db.collection("learners").createIndex({ sessionId: 1 }),
    db.collection("learners").createIndex({ ageBand: 1, level: 1 }),
    db.collection("levels").createIndex({ level: 1, ageBand: 1 }, { unique: true }),
    db.collection("learningPlans").createIndex({ planId: 1 }, { unique: true }),
    db.collection("learningPlans").createIndex({ learnerId: 1, createdAt: -1 }),
    db.collection("learningSignals").createIndex({ learnerId: 1, createdAt: -1 }),
    db.collection("learningSignals").createIndex({ learnerId: 1, signal: 1 }),
    db.collection("educationProviderEvents").createIndex({ provider: 1, createdAt: -1 }),
    db.collection("educationProviderEvents").createIndex({ createdAt: -1 }),
    db.collection("educationKnowledgeCache").createIndex({ cacheKey: 1 }, { unique: true }),
    db.collection("educationKnowledgeCache").createIndex({ provider: 1, expiresAt: 1 }),
    db.collection("parents").createIndex({ parentId: 1 }, { unique: true }),
    db.collection("parents").createIndex({ email: 1 }, { unique: true }),
    db.collection("parentChildLinks").createIndex({ parentId: 1, learnerId: 1 }, { unique: true }),
    db.collection("parentChildLinks").createIndex({ learnerId: 1 }),
    db.collection("pairingCodes").createIndex({ codeHash: 1 }, { unique: true }),
    db.collection("pairingCodes").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).catch(() => {
    // Index creation must never break gameplay; log and continue.
    console.error("[learnzzy] ensureIndexes failed (continuing without fresh indexes)");
  });
  indexesEnsured = true;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
