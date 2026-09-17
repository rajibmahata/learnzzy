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
    // 25 valid level-one combinations repeated across visual themes. The
    // previous b formula was always 3 (`i * 5 % 5 === 0`), leaving only five
    // unique questions in a 100-record pool.
    const level = Math.floor(i / 20) + 1;
    const max = [5, 10, 15, 25, 40][level - 1];
    const slot = i % 20;
    const a = 1 + ((slot * 3 + 1) % max);
    const b = 1 + ((Math.floor(slot / 5) * 2 + slot) % max);
    const correctAnswer = a + b; // authoritative
    const answerOptions = distractors(correctAnswer, 40);
    const theme = THEMES[i % THEMES.length];
    const objectType = OBJECTS[i % OBJECTS.length];
    if (answerOptions.filter((x) => x === correctAnswer).length !== 1) throw new Error("seed math violated");
    docs.push({
      contentId: `seed-add-easy-${String(i).padStart(3, "0")}`,
      gameId: "addition",
      difficulty: "easy",
      level,
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
    const level = Math.floor(i / 20) + 1;
    const max = [5, 10, 15, 25, 40][level - 1];
    const startCount = 1 + ((i % 20) * 3) % max;
    const removedCount = (Math.floor(i / 20) + i) % (startCount + 1); // <= start → non-negative (BR-040)
    const correctAnswer = startCount - removedCount;
    const answerOptions = distractors(correctAnswer, 20, [startCount, removedCount]);
    const theme = THEMES[(i + 2) % THEMES.length];
    if (answerOptions.filter((x) => x === correctAnswer).length !== 1) throw new Error("seed math violated");
    docs.push({
      contentId: `seed-sub-easy-${String(i).padStart(3, "0")}`,
      gameId: "subtraction",
      difficulty: "easy",
      level,
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

// Sketch guide builders (plain-JS mirrors of src/games/sketch.ts so the seed
// stays dependency-free; keep the two in sync when shapes change).
function sktCircle(cx, cy, r, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}

function sktLine(ax, ay, bx, by, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: ax + ((bx - ax) * i) / Math.max(1, n - 1), y: ay + ((by - ay) * i) / Math.max(1, n - 1) });
  }
  return pts;
}

function sktPoly(verts, per) {
  const pts = [];
  for (let v = 0; v < verts.length; v++) {
    const a = verts[v];
    const b = verts[(v + 1) % verts.length];
    for (let i = 0; i < per; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / per, y: a.y + ((b.y - a.y) * i) / per });
  }
  return pts;
}

function sktStarPts(per) {
  const verts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 34 : 14;
    const t = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    verts.push({ x: 50 + r * Math.cos(t), y: 50 + r * Math.sin(t) });
  }
  return sktPoly(verts, per);
}

// Leveled activity catalog: every entry is a meaningfully different activity
// (different shape/task/instruction/objective) — never ID-only variation.
const SKETCH_LIB = [
  { shape: "circle", level: 1, task: "trace", inst: "Trace the circle.", hint: "Follow the dots all the way around." },
  { shape: "square", level: 1, task: "trace", inst: "Trace the square.", hint: "Go slowly around the four corners." },
  { shape: "triangle", level: 1, task: "trace", inst: "Trace the triangle.", hint: "Three sides — start at the top." },
  { shape: "rectangle", level: 1, task: "trace", inst: "Trace the rectangle.", hint: "Long side, short side, long side, short side." },
  { shape: "dots-star", level: 1, task: "dots", inst: "Connect the dots to make a star.", hint: "Start at the top dot, then go to the next one." },
  { shape: "sun", level: 2, task: "trace", inst: "Trace the sunny sun.", hint: "Circle first, then the little rays." },
  { shape: "tree", level: 2, task: "trace", inst: "Trace the tree.", hint: "Trunk first, then the leaves on top." },
  { shape: "flower", level: 2, task: "trace", inst: "Trace the flower.", hint: "Middle first, then each petal." },
  { shape: "balloon", level: 2, task: "trace", inst: "Trace the balloon.", hint: "Round and round, then draw the string." },
  { shape: "cloud", level: 2, task: "trace", inst: "Trace the fluffy cloud.", hint: "Bump over bump, nice and slow." },
  { shape: "fish", level: 2, task: "trace", inst: "Trace the fish.", hint: "Body first, then the tail." },
  { shape: "car", level: 2, task: "trace", inst: "Trace the car.", hint: "Body first, then the two round wheels." },
  { shape: "house", level: 3, task: "trace", inst: "Draw a house like the example.", hint: "Start with the square body." },
  { shape: "rocket", level: 3, task: "trace", inst: "Trace the rocket.", hint: "Nose at the top, fire at the bottom." },
  { shape: "boat", level: 3, task: "trace", inst: "Trace the boat.", hint: "Hull first, then the tall sail." },
  { shape: "butterfly", level: 3, task: "trace", inst: "Trace both wings to match.", hint: "Left side, then right side — make them match." },
  { shape: "kite", level: 3, task: "trace", inst: "Trace the kite.", hint: "Diamond first, then the long tail." },
  { shape: "robot", level: 3, task: "trace", inst: "Trace the robot.", hint: "Head first, then the big body." },
  { shape: "pattern-triangles", level: 4, task: "pattern", inst: "Continue the pattern.", hint: "Look at the first two shapes. What comes next?" },
  { shape: "dots-house", level: 4, task: "dots", inst: "Connect the dots to build the house.", hint: "One dot to the next, all the way around." },
  { shape: "star", level: 4, task: "trace", inst: "Trace the big star.", hint: "Five points — take your time." },
  { shape: "landscape", level: 5, task: "trace", inst: "Trace the mountains.", hint: "Up one mountain, down, then up the next." },
  { shape: "cat", level: 5, task: "trace", inst: "Trace the cat.", hint: "Round head first, then the pointy ears." },
];

function sktGuide(shape) {
  if (shape === "square") return sktPoly([{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }], 16);
  if (shape === "triangle") return sktPoly([{ x: 50, y: 14 }, { x: 84, y: 78 }, { x: 16, y: 78 }], 16);
  if (shape === "star") return sktStarPts(7);
  if (shape === "rectangle") return sktPoly([{ x: 18, y: 32 }, { x: 82, y: 32 }, { x: 82, y: 68 }, { x: 18, y: 68 }], 14);
  if (shape === "house")
    return [...sktPoly([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 64, y: 84 }, { x: 22, y: 84 }], 16), ...sktPoly([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 43, y: 16 }], 16)];
  if (shape === "sun") {
    const pts = sktCircle(50, 44, 20, 48);
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * Math.PI * 2;
      pts.push(...sktLine(50 + 26 * Math.cos(t), 44 + 26 * Math.sin(t), 50 + 36 * Math.cos(t), 44 + 36 * Math.sin(t), 6));
    }
    return pts;
  }
  if (shape === "tree") return [...sktLine(50, 95, 50, 62, 12), ...sktPoly([{ x: 50, y: 12 }, { x: 80, y: 62 }, { x: 20, y: 62 }], 16)];
  if (shape === "flower") {
    const pts = sktCircle(50, 50, 8, 20);
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * Math.PI * 2;
      pts.push(...sktCircle(50 + 20 * Math.cos(t), 50 + 20 * Math.sin(t), 9, 12));
    }
    return pts;
  }
  if (shape === "balloon") return [...sktCircle(50, 38, 24, 48), ...sktLine(50, 62, 50, 95, 10)];
  if (shape === "cloud") return [...sktCircle(35, 56, 14, 24), ...sktCircle(52, 48, 17, 28), ...sktCircle(68, 56, 13, 22)];
  if (shape === "fish") return [...sktCircle(42, 50, 20, 48), ...sktPoly([{ x: 60, y: 50 }, { x: 82, y: 32 }, { x: 82, y: 68 }], 8)];
  if (shape === "car") return [...sktPoly([{ x: 14, y: 55 }, { x: 86, y: 55 }, { x: 86, y: 74 }, { x: 14, y: 74 }], 12), ...sktCircle(31, 78, 8, 14), ...sktCircle(69, 78, 8, 14)];
  if (shape === "boat") return [...sktPoly([{ x: 18, y: 62 }, { x: 82, y: 62 }, { x: 68, y: 82 }, { x: 32, y: 82 }], 12), ...sktLine(50, 62, 50, 24, 10), ...sktPoly([{ x: 50, y: 24 }, { x: 50, y: 58 }, { x: 74, y: 58 }], 8)];
  if (shape === "rocket") return [...sktPoly([{ x: 50, y: 6 }, { x: 62, y: 30 }, { x: 62, y: 64 }, { x: 38, y: 64 }, { x: 38, y: 30 }], 10), ...sktCircle(50, 40, 7, 14), ...sktLine(50, 64, 50, 86, 8)];
  if (shape === "butterfly") return [...sktCircle(31, 50, 20, 36), ...sktCircle(69, 50, 20, 36), ...sktLine(50, 24, 50, 78, 14)];
  if (shape === "kite") return [...sktPoly([{ x: 50, y: 10 }, { x: 78, y: 45 }, { x: 50, y: 78 }, { x: 22, y: 45 }], 12), ...sktLine(50, 78, 50, 97, 6)];
  if (shape === "robot") return [...sktPoly([{ x: 32, y: 12 }, { x: 68, y: 12 }, { x: 68, y: 42 }, { x: 32, y: 42 }], 10), ...sktPoly([{ x: 28, y: 48 }, { x: 72, y: 48 }, { x: 72, y: 88 }, { x: 28, y: 88 }], 12)];
  if (shape === "pattern-triangles") return [8, 38, 68].flatMap((x0) => sktPoly([{ x: x0, y: 68 }, { x: x0 + 24, y: 68 }, { x: x0 + 12, y: 40 }], 8));
  if (shape === "dots-star") return sktStarPts(3);
  if (shape === "dots-house") return [...sktPoly([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 64, y: 84 }, { x: 22, y: 84 }], 4), ...sktPoly([{ x: 22, y: 42 }, { x: 64, y: 42 }, { x: 43, y: 16 }], 4)];
  if (shape === "landscape") return [...sktLine(5, 80, 25, 40, 12), ...sktLine(25, 40, 45, 75, 12), ...sktLine(45, 75, 65, 35, 12), ...sktLine(65, 35, 85, 80, 12), ...sktCircle(80, 16, 8, 16)];
  if (shape === "cat") return [...sktCircle(50, 56, 22, 48), ...sktPoly([{ x: 32, y: 44 }, { x: 40, y: 22 }, { x: 47, y: 41 }], 6), ...sktPoly([{ x: 53, y: 41 }, { x: 60, y: 22 }, { x: 68, y: 44 }], 6)];
  const pts = [];
  for (let i = 0; i < 56; i++) {
    const t = (i / 56) * Math.PI * 2;
    pts.push({ x: 50 + 34 * Math.cos(t), y: 50 + 34 * Math.sin(t) });
  }
  return pts;
}

const SKETCH_TOLERANCE = { 1: 14, 2: 12, 3: 10, 4: 9, 5: 8 };

function sketchDocs() {
  const docs = [];
  for (const entry of SKETCH_LIB) {
    const guidePath = sktGuide(entry.shape);
    if (guidePath.length < 8 || guidePath.length > 200) throw new Error(`seed sketch guide out of range: ${entry.shape}`);
    for (const p of guidePath) {
      if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) throw new Error(`seed sketch guide out of bounds: ${entry.shape}`);
    }
    const id = `seed-skt-easy-${entry.shape}-${entry.level}`;
    const doc = baseDoc(
      id,
      "sketch",
      "shadow_sketch",
      {
        shape: entry.shape,
        guidePath,
        tolerance: SKETCH_TOLERANCE[entry.level] ?? 10,
        coverageThreshold: entry.level === 1 ? 0.5 : 0.6,
        taskType: entry.task,
        instruction: entry.inst,
        hint: entry.hint,
      },
      ["sketch", entry.task, entry.shape]
    );
    doc.level = entry.level;
    docs.push(doc);
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
  // Mirror every curriculum level into medium/hard so levels 4-5 do not fall
  // back to the legacy three-difficulty ceiling after a fresh seed.
  const mediumHard = [];
  for (const d of easy) {
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
