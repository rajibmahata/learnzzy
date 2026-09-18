import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Unified MCP server — runs as tutor-mcp | oer-mcp | ncert-mcp
// based on env PROVIDER (or legacy TUTOR/OER/NCERT detection).
// Implements the exact REST shim contracts used by Learnzzy's
// adapters (src/integrations/education/*-provider.ts):
//   tutor:  POST /learner-state, /learning-evidence, /next-activity
//   oer:    POST /search, /concept
//   ncert:  POST /search-curriculum, /prerequisites
// Plus common: GET /health, /readiness, /capabilities, /metrics
// Auth: if PROVIDER_API_KEY / <PROV>_API_KEY is set, require
//        Authorization: Bearer <key>. Never logs the key.
// Persistence: JSON files under /data/<provider>/ (Docker volume).
// Transport: plain HTTP JSON (Docker-private). No stdio needed;
// the real tutor-mcp speaks MCP+OAuth; this is the documented
// REST shim mentioned in provider files.

const PROVIDER = normalizeProvider(process.env.PROVIDER || process.env.MCP_PROVIDER || inferProvider());
const PORT = Number(process.env.PORT || { "tutor-mcp": 3001, "oer-mcp": 3002, "ncert-mcp": 3003 }[PROVIDER] || 3001);
const API_KEY = process.env.PROVIDER_API_KEY || process.env[`${PROVIDER.toUpperCase().replace(/-/g, "_")}_API_KEY`] || process.env.TUTOR_MCP_API_KEY || process.env.OER_MCP_API_KEY || process.env.NCERT_MCP_API_KEY || null;
const DATA_DIR = process.env.DATA_DIR || `/data/${PROVIDER}`;
const QDRANT_URL = process.env.QDRANT_URL || null;

function normalizeProvider(p) {
  const v = String(p || "").toLowerCase().trim();
  if (["tutor", "tutor-mcp", "tutor_mcp"].includes(v)) return "tutor-mcp";
  if (["oer", "oer-mcp", "oer_mcp"].includes(v)) return "oer-mcp";
  if (["ncert", "ncert-mcp", "ncert_mcp"].includes(v)) return "ncert-mcp";
  return "tutor-mcp";
}
function inferProvider() {
  if (process.env.TUTOR_MCP_ENABLED === "true") return "tutor-mcp";
  if (process.env.OER_MCP_ENABLED === "true") return "oer-mcp";
  if (process.env.NCERT_MCP_ENABLED === "true") return "ncert-mcp";
  return "tutor-mcp";
}

let startedAt = new Date().toISOString();
let requestCount = 0;
let errorCount = 0;

async function ensureDataDir() {
  try { await mkdir(DATA_DIR, { recursive: true }); } catch {}
}
function dataFile(name) { return path.join(DATA_DIR, name); }
async function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    const txt = await readFile(file, "utf8");
    return JSON.parse(txt);
  } catch { return fallback; }
}
async function writeJson(file, data) {
  try { await ensureDataDir(); await writeFile(file, JSON.stringify(data, null, 2), "utf8"); } catch (e) { console.error("persist failed", file, e.message); }
}
function provenance(provider, sourceId, license = "CC0", attribution = "Learnzzy MCP shim (Docker)") {
  return {
    provider,
    sourceId,
    license,
    attribution,
    retrievedAt: new Date().toISOString(),
    reference: `docker://${provider}/${sourceId}`,
  };
}
function sendJson(res, status, body) {
  const txt = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(txt),
    "cache-control": "no-store",
  });
  res.end(txt);
}
function requireAuth(req, res) {
  if (!API_KEY) return true;
  const hdr = req.headers.authorization || req.headers["x-api-key"] || "";
  const token = String(hdr).replace(/^Bearer\s+/i, "").trim();
  if (token !== API_KEY) {
    sendJson(res, 401, { success: false, error: { code: "MCP_AUTH_ERROR", message: "Invalid API key" } });
    errorCount++;
    return false;
  }
  return true;
}
async function parseBody(req, limit = 256 * 1024) {
  const chunks = [];
  let len = 0;
  for await (const chunk of req) {
    len += chunk.length;
    if (len > limit) throw new Error("payload too large");
    chunks.push(chunk);
  }
  const txt = Buffer.concat(chunks).toString("utf8");
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { throw new Error("invalid json"); }
}

// --- Tutor handlers (mock-backed, persisted) ---
const TUTOR_MOCK = {
  concepts: {
    "math.addition.within10": { name: "Addition within 10", domain: "mathematics" },
    "math.subtraction.within10": { name: "Subtraction within 10", domain: "mathematics" },
    "cognition.sorting": { name: "Sorting and tidying", domain: "cognition" },
  }
};
async function tutorLearnerState(body) {
  const learnerId = String(body.learnerId || "learner_1");
  const conceptIds = Array.isArray(body.conceptIds) ? body.conceptIds.slice(0, 20) : [];
  const store = await readJson(dataFile("tutor-evidence.json"), {});
  const learner = store[learnerId] || { evidences: [] };
  const byConcept = {};
  for (const ev of learner.evidences) {
    const cid = ev.conceptId;
    if (!byConcept[cid]) byConcept[cid] = { attempts: 0, correct: 0 };
    byConcept[cid].attempts += ev.attempts || 0;
    byConcept[cid].correct += ev.correct || 0;
  }
  const concepts = conceptIds.map((cid) => {
    const agg = byConcept[cid] || { attempts: 0, correct: 0 };
    const mastery = agg.attempts === 0 ? 0 : Math.max(0, Math.min(1, agg.correct / agg.attempts));
    return { conceptId: cid, mastery, attempts: agg.attempts, correct: agg.correct };
  });
  const overall = concepts.length ? concepts.reduce((s, c) => s + c.mastery, 0) / concepts.length : 0;
  const misconceptions = concepts.filter((c) => c.attempts >= 10 && c.mastery < 0.5).map((c) => c.conceptId);
  return { learnerId, concepts, misconceptions, overallMastery: overall };
}
async function tutorRecordEvidence(body) {
  const learnerId = String(body.learnerId || "");
  if (!learnerId) throw new Error("learnerId required");
  const store = await readJson(dataFile("tutor-evidence.json"), {});
  if (!store[learnerId]) store[learnerId] = { evidences: [] };
  store[learnerId].evidences.push({
    conceptId: body.conceptId,
    gameId: body.gameId,
    difficulty: body.difficulty,
    attempts: body.attempts,
    correct: body.correct,
    at: new Date().toISOString(),
  });
  // keep last 200 per learner
  if (store[learnerId].evidences.length > 200) store[learnerId].evidences = store[learnerId].evidences.slice(-200);
  await writeJson(dataFile("tutor-evidence.json"), store);
  return { recorded: true };
}
async function tutorNextActivity(body) {
  const learnerId = String(body.learnerId || "learner_1");
  const recent = new Set(body.recentGameIds || []);
  const games = ["addition", "subtraction", "clean-up", "puzzle", "sketch", "discover"];
  const store = await readJson(dataFile("tutor-evidence.json"), {});
  const learner = store[learnerId];
  let best = { gameId: "addition", reason: "variety", confidence: 0.6 };
  let bestScore = Infinity;
  for (const g of games) {
    if (recent.has(g)) continue;
    const evs = (learner?.evidences || []).filter((e) => e.gameId === g);
    const attempts = evs.reduce((s, e) => s + (e.attempts || 0), 0);
    const correct = evs.reduce((s, e) => s + (e.correct || 0), 0);
    const acc = attempts ? correct / attempts : 0;
    const score = attempts ? acc * 10 + evs.length : -1;
    if (score < bestScore) {
      bestScore = score;
      best = { gameId: g, reason: !attempts ? "variety" : acc < 0.7 ? "need-practice" : "review", confidence: 0.6 };
    }
  }
  return best;
}

// --- OER handlers ---
const OER_SUMMARIES = {
  "math.addition.within10": { name: "Addition within 10", domain: "mathematics", summary: "Joining two small groups and counting how many altogether. Use fingers, objects, or pictures before symbols." },
  "math.subtraction.within10": { name: "Subtraction within 10", domain: "mathematics", summary: "Taking a small group away and counting what is left. Act out 'fly away' stories first." },
  "cognition.sorting": { name: "Sorting and tidying", domain: "cognition", summary: "Grouping objects by one attribute (color, shape, kind) and putting each group in its home." },
  "spatial.part-whole": { name: "Part–whole relationships", domain: "spatial", summary: "Seeing how small pieces fit into a bigger picture. Start with 4 large pieces, then 6, then 9." },
};
async function oerSearch(body) {
  const q = String(body.query || "").toLowerCase();
  const limit = Math.min(10, Math.max(1, Number(body.limit) || 5));
  const cid = body.conceptId;
  const hits = Object.entries(OER_SUMMARIES).filter(([id, s]) => {
    if (cid && id !== cid) return false;
    return s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q) || s.domain.includes(q) || id.includes(q.replace(/\s+/g, "."));
  }).slice(0, limit);
  return hits.map(([conceptId, s]) => ({
    title: s.name,
    content: s.summary,
    conceptId,
    provenance: provenance("oer-mcp", `mock:${conceptId}`, "CC0", "Learnzzy MCP shim OER (Docker)"),
  }));
}
async function oerConcept(body) {
  const id = String(body.conceptId || "");
  const s = OER_SUMMARIES[id];
  if (!s) return null;
  return {
    conceptId: id,
    name: s.name,
    domain: s.domain,
    summary: s.summary,
    prerequisites: [],
    provenance: provenance("oer-mcp", `mock:${id}`, "CC0", "Learnzzy MCP shim OER (Docker)"),
  };
}

// --- NCERT handlers ---
const NCERT_MAP = [
  { match: ["count", "number", "addition"], grade: 1, subject: "Mathematics", topic: "Counting and addition within 10", chapter: "Numbers", conceptId: "math.addition.within10", bloomLevel: "remember" },
  { match: ["subtract", "take away"], grade: 1, subject: "Mathematics", topic: "Subtraction within 10", chapter: "Numbers", conceptId: "math.subtraction.within10", bloomLevel: "understand" },
  { match: ["shape", "circle", "square"], grade: 1, subject: "Mathematics", topic: "Shape recognition", chapter: "Shapes", conceptId: "geometry.shapes", bloomLevel: "remember" },
];
async function ncertSearch(body) {
  const q = String(body.query || "").toLowerCase();
  const limit = Math.min(10, Math.max(1, Number(body.limit) || 5));
  const grade = body.grade;
  const subject = body.subject ? String(body.subject).toLowerCase() : null;
  const hits = NCERT_MAP.filter(m => {
    if (grade !== undefined && m.grade !== grade) return false;
    if (subject && !m.subject.toLowerCase().includes(subject)) return false;
    return m.match.some(k => q.includes(k));
  }).slice(0, limit);
  return hits.map(m => ({
    grade: m.grade, subject: m.subject, topic: m.topic, chapter: m.chapter, conceptId: m.conceptId, bloomLevel: m.bloomLevel,
    provenance: provenance("ncert-mcp", `foundational:${m.conceptId}`, "CC0", "Learnzzy MCP shim NCERT (Docker, not official CBSE)"),
  }));
}
async function ncertPrereqs(body) {
  const cid = body.conceptId;
  if (!cid) return [];
  const prereqMap = {
    "math.addition.within10": [{ topic: "Number recognition", conceptId: "math.number.recognition", relation: "prerequisite" }],
    "math.subtraction.within10": [{ topic: "Addition within 10", conceptId: "math.addition.within10", relation: "prerequisite" }],
  };
  return prereqMap[cid] || [];
}

const server = http.createServer(async (req, res) => {
  requestCount++;
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  // CORS for gateway (internal only, but allow localhost dev)
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization,x-api-key");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // Public health endpoints — never require auth
  if (path === "/health" || path === "/readiness" || path === "/livez" || path === "/readyz") {
    return sendJson(res, 200, { status: "healthy", provider: PROVIDER, uptime: Date.now() - Date.parse(startedAt), requestCount, errorCount, dataDir: DATA_DIR, qdrant: QDRANT_URL ? "configured" : "not-configured", time: new Date().toISOString() });
  }
  if (path === "/capabilities" || path === "/.well-known/mcp-capabilities") {
    const caps = {
      tutor: ["/learner-state", "/learning-evidence", "/next-activity"],
      oer: ["/search", "/concept"],
      ncert: ["/search-curriculum", "/prerequisites"],
    };
    return sendJson(res, 200, { provider: PROVIDER, capabilities: caps[PROVIDER.split("-")[0]] || [], health: "/health", readiness: "/readiness" });
  }
  if (path === "/metrics") {
    return sendJson(res, 200, { provider: PROVIDER, requestCount, errorCount, startedAt, uptimeMs: Date.now() - Date.parse(startedAt) });
  }

  // Auth gate for API routes
  if (!requireAuth(req, res)) return;

  try {
    let body = null;
    if (req.method === "POST") body = await parseBody(req);
    // Route
    if (PROVIDER === "tutor-mcp") {
      if (path === "/learner-state" && req.method === "POST") return sendJson(res, 200, await tutorLearnerState(body || {}));
      if (path === "/learning-evidence" && req.method === "POST") { await tutorRecordEvidence(body || {}); return sendJson(res, 200, { recorded: true }); }
      if (path === "/next-activity" && req.method === "POST") return sendJson(res, 200, await tutorNextActivity(body || {}));
    } else if (PROVIDER === "oer-mcp") {
      if (path === "/search" && req.method === "POST") return sendJson(res, 200, await oerSearch(body || {}));
      if (path === "/concept" && req.method === "POST") {
        const c = await oerConcept(body || {});
        if (c === null) return sendJson(res, 200, null);
        return sendJson(res, 200, c);
      }
    } else if (PROVIDER === "ncert-mcp") {
      if (path === "/search-curriculum" && req.method === "POST") return sendJson(res, 200, await ncertSearch(body || {}));
      if (path === "/prerequisites" && req.method === "POST") return sendJson(res, 200, await ncertPrereqs(body || {}));
      // Shim aliases for real ncert-mcp paths (/search/content etc.) for forward compat
      if (path === "/search/content" && req.method === "POST") return sendJson(res, 200, await ncertSearch(body || {}));
      if (path === "/graph/prerequisites" && req.method === "POST") return sendJson(res, 200, await ncertPrereqs(body || {}));
    }
    sendJson(res, 404, { success: false, error: { code: "MCP_INVALID_RESPONSE", message: `Unknown route ${path} for ${PROVIDER}` } });
  } catch (e) {
    errorCount++;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("payload too large")) return sendJson(res, 413, { success: false, error: { code: "MCP_RESPONSE_TOO_LARGE", message: msg } });
    if (msg.includes("invalid json")) return sendJson(res, 400, { success: false, error: { code: "MCP_INVALID_RESPONSE", message: msg } });
    // Validation errors map to 422
    if (msg.includes("required") || msg.includes("learnerId")) return sendJson(res, 422, { success: false, error: { code: "MCP_INVALID_RESPONSE", message: msg } });
    sendJson(res, 500, { success: false, error: { code: "MCP_UNAVAILABLE", message: msg } });
  }
});

server.listen(PORT, "0.0.0.0", async () => {
  await ensureDataDir();
  console.log(`[mcp:${PROVIDER}] listening on :${PORT} data=${DATA_DIR} auth=${API_KEY ? "enabled" : "disabled"} qdrant=${QDRANT_URL || "none"}`);
});

function shutdown(sig) {
  console.log(`[mcp:${PROVIDER}] ${sig} shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
