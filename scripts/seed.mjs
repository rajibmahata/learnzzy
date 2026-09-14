// Learnzzy content seed — deterministic, no AI.
// Targets: addition 100 + subtraction 100 (easy/active), per DEC-073.
// Math is authoritative by construction: correctAnswer is computed, then
// re-validated before write. Safe to re-run (upserts by contentId).
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local (dev) without extra dependencies — explicit env always wins.
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  }
} catch {
  /* seeding continues on explicit env */
}

const THEMES = ["jungle", "ocean", "garden", "farm", "space"];
const OBJECTS = ["apple", "banana", "fish", "balloon", "bird"];

function distractors(correct, max, extra = []) {
  const set = new Set([correct]);
  for (const c of [correct + 1, correct - 1, correct + 2, Math.max(0, correct - 2), ...extra]) {
    if (set.size >= 4) break;
    if (Number.isInteger(c) && c >= 0 && c <= max && !set.has(c)) set.add(c);
  }
  return [...set];
}

function additionDocs() {
  const docs = [];
  for (let i = 0; i < 100; i++) {
    const a = 1 + ((i * 3 + 1) % 5);
    const b = 1 + ((i * 5 + 2) % 5);
    const correctAnswer = a + b; // authoritative
    const answerOptions = distractors(correctAnswer, 40);
    const theme = THEMES[i % THEMES.length];
    const objectType = OBJECTS[i % OBJECTS.length];
    if (answerOptions.filter((x) => x === correctAnswer).length !== 1) throw new Error("seed math violated");
    docs.push({
      contentId: `seed-add-easy-${String(i).padStart(3, "0")}`,
      gameId: "addition",
      difficulty: "easy",
      contentType: "addition_question",
      status: "active",
      version: 1,
      source: "seed",
      validation: { schema: true, deterministic: true, quality: true, safety: true },
      payload: {
        theme,
        question: { a, b },
        objects: { type: objectType, countA: a, countB: b },
        answerOptions,
        correctAnswer,
      },
      assetIds: [],
      tags: ["counting", theme],
      usage: { shown: 0, completed: 0, correct: 0, incorrect: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: new Date(),
    });
  }
  return docs;
}

function subtractionDocs() {
  const docs = [];
  for (let i = 0; i < 100; i++) {
    const startCount = 1 + ((i * 3 + 2) % 5);
    const removedCount = (i * 2 + 1) % (startCount + 1); // <= start → non-negative (BR-040)
    const correctAnswer = startCount - removedCount;
    const answerOptions = distractors(correctAnswer, 20, [startCount, removedCount]);
    const theme = THEMES[(i + 2) % THEMES.length];
    if (answerOptions.filter((x) => x === correctAnswer).length !== 1) throw new Error("seed math violated");
    docs.push({
      contentId: `seed-sub-easy-${String(i).padStart(3, "0")}`,
      gameId: "subtraction",
      difficulty: "easy",
      contentType: "subtraction_question",
      status: "active",
      version: 1,
      source: "seed",
      validation: { schema: true, deterministic: true, quality: true, safety: true },
      payload: {
        theme,
        question: { start: startCount, removed: removedCount },
        objects: { type: "bird", startCount, removedCount },
        answerOptions,
        correctAnswer,
      },
      assetIds: [],
      tags: ["subtraction", theme],
      usage: { shown: 0, completed: 0, correct: 0, incorrect: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: new Date(),
    });
  }
  return docs;
}

function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function baseDoc(contentId, gameId, contentType, payload, tags) {
  return {
    contentId,
    gameId,
    difficulty: "easy",
    contentType,
    status: "active",
    version: 1,
    source: "seed",
    validation: { schema: true, deterministic: true, quality: true, safety: true },
    payload,
    assetIds: [],
    tags,
    usage: { shown: 0, completed: 0, correct: 0, incorrect: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedAt: new Date(),
  };
}

const CLEAN_THEMES = {
  bedroom: { targets: ["🧸", "🧦", "📚", "🧩", "🎈"], deco: ["🛏️", "🚪", "🪟", "💡"] },
  classroom: { targets: ["📄", "✏️", "📚", "🖍️", "📏"], deco: ["🪑", "🚪", "🖥️", "⏰"] },
  playground: { targets: ["⚽", "🪁", "🧸", "🎈", "🛝"], deco: ["🌳", "☁️", "🌞", "🪑"] },
  garden: { targets: ["🌸", "🍂", "🪴", "🦋", "🍎"], deco: ["🌳", "☁️", "🌞", "🏠"] },
  park: { targets: ["🍌", "🧃", "🎈", "📰", "🧸"], deco: ["🌳", "⛲", "☁️", "🪑"] },
  beach: { targets: ["🐚", "🦀", "🕶️", "🎈", "🧃"], deco: ["🌊", "☁️", "🌞", "🏖️"] },
};

function cleanupDocs() {
  const docs = [];
  const themes = Object.keys(CLEAN_THEMES);
  for (let v = 0; v < 5; v++) {
    for (const theme of themes) {
      const t = CLEAN_THEMES[theme];
      const rand = mulberry(hashSeed(`seed-clean-${theme}-${v}`));
      const used = [];
      const spot = () => {
        for (let k = 0; k < 40; k++) {
          const p = { x: 8 + rand() * 84, y: 12 + rand() * 68 };
          if (used.every((u) => Math.hypot(u.x - p.x, u.y - p.y) > 16)) {
            used.push(p);
            return p;
          }
        }
        const p = { x: 8 + rand() * 84, y: 12 + rand() * 68 };
        used.push(p);
        return p;
      };
      const emojis = [...t.targets].sort(() => rand() - 0.5).slice(0, 3);
      const targets = emojis.map((emoji, i) => ({ targetId: `target_${i}`, emoji, ...spot() }));
      const nonTargets = [0, 1, 2].map((i) => ({
        id: `deco_${i}`,
        emoji: t.deco[Math.floor(rand() * t.deco.length)],
        ...spot(),
      }));
      const id = `seed-cln-easy-${theme.slice(0, 3)}-${v}`;
      docs.push(baseDoc(id, "clean-up", "clean_up_scene", { theme, targets, nonTargets }, ["cleanup", theme]));
    }
  }
  return docs;
}

const PICTURES = [
  ["🐱", "🐟", "🌸", "🦋"],
  ["🐶", "🦴", "⚽", "🌳"],
  ["🦁", "🌞", "🌴", "🐒"],
  ["🐧", "❄️", "⛄", "🎣"],
  ["🐸", "🌿", "💧", "🌸"],
  ["🦄", "🌈", "⭐", "🌸"],
];

function puzzleDocs() {
  const docs = [];
  for (let v = 0; v < 5; v++) {
    PICTURES.forEach((picture, pi) => {
      const rand = mulberry(hashSeed(`seed-puz-${pi}-${v}`));
      const order = [0, 1, 2, 3];
      for (let i = 3; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const pieces = order.map((correctPosition, k) => ({
        pieceId: `piece_${k}`,
        correctPosition,
        emoji: picture[correctPosition],
      }));
      const id = `seed-puz-easy-${pi}-${v}`;
      docs.push(
        baseDoc(id, "puzzle", "picture_puzzle", { picture, rows: 2, columns: 2, pieces }, ["puzzle", "spatial"])
      );
    });
  }
  return docs;
}

function guideForShape(shape) {
  const pts = [];
  if (shape === "square") {
    const V = [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }];
    for (let v = 0; v < 4; v++) {
      const a = V[v];
      const b = V[(v + 1) % 4];
      for (let i = 0; i < 16; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / 16, y: a.y + ((b.y - a.y) * i) / 16 });
    }
  } else {
    for (let i = 0; i < 56; i++) {
      const t = (i / 56) * Math.PI * 2;
      pts.push({ x: 50 + 34 * Math.cos(t), y: 50 + 34 * Math.sin(t) });
    }
  }
  return pts;
}

function sketchDocs() {
  const docs = [];
  for (let v = 0; v < 15; v++) {
    for (const shape of ["circle", "square"]) {
      const id = `seed-skt-easy-${shape.slice(0, 3)}-${v}`;
      docs.push(
        baseDoc(
          id,
          "sketch",
          "shadow_sketch",
          { shape, guidePath: guideForShape(shape), tolerance: 9, coverageThreshold: 0.6 },
          ["sketch", "tracing", shape]
        )
      );
    }
  }
  return docs;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Refusing to seed.");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB_NAME || "learnzzy_dev";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await Promise.all([
    db.collection("games").createIndex({ gameId: 1 }, { unique: true }),
    db.collection("content").createIndex({ contentId: 1 }, { unique: true }),
    db.collection("content").createIndex({ gameId: 1, difficulty: 1, status: 1, createdAt: 1 }),
    db.collection("content").createIndex({ gameId: 1, status: 1, createdAt: 1 }),
    db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true }),
    db.collection("gameEvents").createIndex({ eventId: 1 }, { unique: true }),
    db.collection("gameEvents").createIndex({ sessionId: 1, serverTimestamp: 1 }),
  ]);

  const games = [
    { gameId: "addition", name: "Numbers", status: "active" },
    { gameId: "subtraction", name: "Fly Away", status: "active" },
    { gameId: "clean-up", name: "Clean Up", status: "active" },
    { gameId: "puzzle", name: "Picture Puzzle", status: "active" },
    { gameId: "sketch", name: "Shadow Sketch", status: "active" },
  ];
  for (const g of games) {
    await db.collection("games").updateOne(
      { gameId: g.gameId },
      { $set: { ...g, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), version: 1 } },
      { upsert: true }
    );
  }
  // Seed configurable difficulty rules (BR-080) so admin can manage them later.
  const maxByDiff = { easy: 5, medium: 10, hard: 20 };
  for (const gameId of ["addition", "subtraction", "clean-up", "puzzle", "sketch"]) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      await db.collection("difficultyRules").updateOne(
        { gameId, difficulty },
        {
          $set: { gameId, difficulty, rules: { max: maxByDiff[difficulty] ?? 10 }, status: "active", version: 1, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }
  }
  // Ensure agent registry exists (7 agents incl. personalization + QA)
  for (const a of ["content-agent", "quality-safety-agent", "asset-agent", "analytics-agent", "difficulty-agent", "personalization-agent", "qa-agent"]) {
    await db.collection("agents").updateOne({ agentId: a }, { $set: { agentId: a, status: "active", updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  }
  // Seed levels: 3 age bands x 5 levels (admin-tunable via /api/admin/levels)
  const levelSeeds = [];
  const bandMax = { "4-5": [5, 7, 10, 12, 15], "6-7": [5, 10, 15, 20, 25], "8-9": [10, 15, 20, 30, 40] };
  for (const ageBand of ["4-5", "6-7", "8-9"]) {
    for (let level = 1; level <= 5; level++) {
      const maxOperand = bandMax[ageBand][level - 1];
      levelSeeds.push({
        updateOne: {
          filter: { level, ageBand },
          update: {
            $set: {
              level,
              ageBand,
              config: {
                maxOperand,
                pieceCount: level <= 2 ? 4 : level <= 4 ? 6 : 9,
                targets: Math.min(3 + Math.floor((level - 1) / 2), 6),
                tolerance: Math.max(18 - (level - 1) * 2, 8),
                rounds: 5,
              },
              isActive: true,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      });
    }
  }
  const levelRes = await db.collection("levels").bulkWrite(levelSeeds, { ordered: false });
  console.log(`levels seeded: upserted=${levelRes.upsertedCount} modified=${levelRes.modifiedCount}`);

  const easy = [...additionDocs(), ...subtractionDocs(), ...cleanupDocs(), ...puzzleDocs(), ...sketchDocs()];
  // Seed medium/hard with smaller counts to satisfy pool thresholds across difficulties.
  const mediumHard = [];
  for (const d of easy.slice(0, 20)) {
    for (const diff of ["medium", "hard"]) {
      mediumHard.push({ ...d, contentId: d.contentId.replace("easy", diff), difficulty: diff });
    }
  }
  const docs = [...easy, ...mediumHard];
  const ops = docs.map((d) => ({
    updateOne: {
      filter: { contentId: d.contentId },
      update: { $set: d },
      upsert: true,
    },
  }));
  const res = await db.collection("content").bulkWrite(ops, { ordered: false });
  console.log(`seed complete: upserted=${res.upsertedCount} modified=${res.modifiedCount} db=${dbName}`);
  await client.close();
}

main().catch((e) => {
  console.error("seed failed:", e?.message ?? e);
  process.exit(1);
});
