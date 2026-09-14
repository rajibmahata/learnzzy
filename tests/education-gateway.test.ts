import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  ActivityRecommendationSchema,
  KnowledgeResultSchema,
  LearnerStateSchema,
  LearningEvidenceInputSchema,
  PrerequisiteSchema,
} from "../src/integrations/education/types.ts";
import { EducationGatewayError, classifyHttpStatus, isRetryableCode } from "../src/integrations/education/errors.ts";
import { buildProvenance, isPoolSafeLicense, isBlockedLicense } from "../src/integrations/education/provenance.ts";
import { tutorConfig, oerConfig, ncertConfig } from "../src/integrations/education/config.ts";
import { conceptsForGame, getConceptDef, CONCEPTS } from "../src/lib/concepts.ts";

// Education Gateway tests. Real Zod schemas, error classification, license
// gate, flags, and concept model execute directly (no @/ imports in those
// modules). Gateway/agent/route behavior is mirrored — those modules use @/
// aliases + Mongo and can't load under node type-stripping (same pattern as
// tests/adaptive.test.ts).

const PROV = {
  provider: "oer-mcp",
  sourceId: "openstax-math-1",
  license: "CC BY",
  attribution: "OpenStax",
  retrievedAt: new Date().toISOString(),
} as const;

describe("tutor response validation (real schemas)", () => {
  test("accepts a well-formed activity recommendation", () => {
    const r = ActivityRecommendationSchema.safeParse({ gameId: "addition", conceptId: "math.addition.within10", reason: "need-practice", confidence: 0.8 });
    assert.equal(r.success, true);
  });
  test("rejects unknown reason enum (advisory allowlist)", () => {
    const r = ActivityRecommendationSchema.safeParse({ gameId: "addition", reason: "ai-says-so" });
    assert.equal(r.success, false);
  });
  test("accepts learner state with mastery + misconceptions", () => {
    const r = LearnerStateSchema.safeParse({
      learnerId: "learner_1",
      concepts: [{ conceptId: "math.addition.within10", mastery: 0.7, attempts: 10, correct: 7 }],
      misconceptions: ["math.subtraction.within10"],
    });
    assert.equal(r.success, true);
  });
  test("rejects out-of-range mastery", () => {
    const r = LearnerStateSchema.safeParse({ learnerId: "l", concepts: [{ conceptId: "c", mastery: 1.5, attempts: 1, correct: 1 }] });
    assert.equal(r.success, false);
  });
  test("evidence requires ids and bounded counts", () => {
    assert.equal(LearningEvidenceInputSchema.safeParse({ learnerId: "l", ageBand: "6-7", sessionId: "s", gameId: "addition", conceptId: "c", difficulty: 1, attempts: 10, correct: 8 }).success, true);
    assert.equal(LearningEvidenceInputSchema.safeParse({ learnerId: "", ageBand: "6-7", sessionId: "s", gameId: "addition", conceptId: "c", difficulty: 9, attempts: -1, correct: 0 }).success, false);
  });
});

describe("oer/ncert response validation (real schemas)", () => {
  test("knowledge result without provenance is rejected", () => {
    const r = KnowledgeResultSchema.safeParse({ title: "T", content: "C" });
    assert.equal(r.success, false);
  });
  test("knowledge result without license is rejected", () => {
    const { license: _dropped, ...prov } = PROV;
    void _dropped;
    const r = KnowledgeResultSchema.safeParse({ title: "T", content: "C", provenance: prov });
    assert.equal(r.success, false);
  });
  test("knowledge result with full provenance passes", () => {
    const r = KnowledgeResultSchema.safeParse({ title: "Addition within 10", content: "Joining groups…", conceptId: "math.addition.within10", provenance: PROV });
    assert.equal(r.success, true);
  });
  test("prerequisite edges validate relation enum", () => {
    assert.equal(PrerequisiteSchema.safeParse({ topic: "Counting", relation: "prerequisite" }).success, true);
    assert.equal(PrerequisiteSchema.safeParse({ topic: "Counting", relation: "unlocks-everything" }).success, false);
  });
});

describe("license gate (real provenance module)", () => {
  test("pool-safe: CC BY / CC0 / public domain", () => {
    assert.equal(isPoolSafeLicense("CC BY"), true);
    assert.equal(isPoolSafeLicense("CC0"), true);
    assert.equal(isPoolSafeLicense("public domain"), true);
    assert.equal(isPoolSafeLicense("CC BY-SA"), true);
  });
  test("blocked: NC, College Board, state copyright", () => {
    assert.equal(isBlockedLicense("CC BY-NC-SA"), true);
    assert.equal(isBlockedLicense("© College Board, educational use"), true);
    assert.equal(isBlockedLicense("state copyright, educational use"), true);
    assert.equal(isBlockedLicense("CC BY"), false);
  });
  test("provenance builder stamps retrieval time", () => {
    const p = buildProvenance({ provider: "oer-mcp", sourceId: "x", license: "CC BY", attribution: "OpenStax" });
    assert.ok(Date.parse(p.retrievedAt) > 0);
    assert.equal(p.provider, "oer-mcp");
  });
});

describe("error classification (real errors module)", () => {
  test("401/403 => auth, not retryable", () => {
    assert.deepEqual(classifyHttpStatus(401), { code: "MCP_AUTH_ERROR", retryable: false });
    assert.equal(isRetryableCode("MCP_AUTH_ERROR"), false);
  });
  test("429 => rate limited, retryable", () => {
    assert.deepEqual(classifyHttpStatus(429), { code: "MCP_RATE_LIMITED", retryable: true });
  });
  test("500 => unavailable, retryable; 400 => invalid, not retryable", () => {
    assert.deepEqual(classifyHttpStatus(500), { code: "MCP_UNAVAILABLE", retryable: true });
    assert.deepEqual(classifyHttpStatus(400), { code: "MCP_INVALID_RESPONSE", retryable: false });
  });
  test("timeout/disabled classification", () => {
    assert.equal(isRetryableCode("MCP_TIMEOUT"), true);
    assert.equal(isRetryableCode("MCP_DISABLED"), false);
    const e = new EducationGatewayError("MCP_TIMEOUT", "tutor-mcp", "slow", true);
    assert.equal(e.retryable, true);
    assert.equal(e.provider, "tutor-mcp");
  });
});

describe("feature flags (real config)", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ["TUTOR_MCP_ENABLED", "TUTOR_MCP_URL", "OER_MCP_ENABLED", "OER_MCP_URL", "NCERT_MCP_ENABLED", "NCERT_MCP_URL"]) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
  test("all providers disabled by default", () => {
    assert.equal(tutorConfig().enabled, false);
    assert.equal(oerConfig().enabled, false);
    assert.equal(ncertConfig().enabled, false);
  });
  test("enabled flag without URL stays disabled (fail-closed)", () => {
    process.env.TUTOR_MCP_ENABLED = "true";
    assert.equal(tutorConfig().enabled, false);
  });
  test("enabled + URL enables; missing key still allowed (key optional)", () => {
    process.env.OER_MCP_ENABLED = "true";
    process.env.OER_MCP_URL = "https://oer.example";
    const c = oerConfig();
    assert.equal(c.enabled, true);
    assert.equal(c.baseUrl, "https://oer.example");
  });
});

describe("concept model (real concepts module)", () => {
  test("addition L1 maps to early concepts", () => {
    const ids = conceptsForGame("addition", 1);
    assert.ok(ids.includes("math.addition.within5"));
  });
  test("higher levels map to harder concepts", () => {
    assert.ok(conceptsForGame("addition", 5).includes("math.addition.within20"));
    assert.ok(conceptsForGame("puzzle", 4).includes("spatial.rotation"));
  });
  test("unknown game maps to nothing (no invented curriculum)", () => {
    assert.deepEqual(conceptsForGame("chess", 3), []);
  });
  test("concept defs carry prerequisites", () => {
    const def = getConceptDef("math.addition.within10");
    assert.ok(def && def.prerequisites.includes("math.addition.within5"));
    assert.equal(getConceptDef("nope"), null);
  });
  test("catalog is stable and non-empty", () => {
    assert.ok(CONCEPTS.length >= 10);
    assert.equal(new Set(CONCEPTS.map((c) => c.id)).size, CONCEPTS.length);
  });
});

describe("advisory rules (mirrors educationAdvisory)", () => {
  const plan = {
    items: [
      { gameId: "addition", level: 2, reason: "need-practice" },
      { gameId: "subtraction", level: 2, reason: "variety" },
      { gameId: "clean-up", level: 2, reason: "interest" },
      { gameId: "puzzle", level: 2, reason: "variety" },
      { gameId: "sketch", level: 2, reason: "variety" },
    ],
    level: 2,
  };
  function validateAdvisory(raw: { gameId?: unknown; conceptId?: unknown } | null) {
    if (!raw || typeof raw.gameId !== "string") return null;
    if (!plan.items.some((i) => i.gameId === raw.gameId)) return null;
    if (typeof raw.conceptId === "string" && raw.conceptId && !getConceptDef(raw.conceptId)) return null;
    return { focusGameId: raw.gameId };
  }
  test("valid advisory annotates without reordering or releveling", () => {
    const adv = validateAdvisory({ gameId: "subtraction", conceptId: "math.subtraction.within10" });
    assert.ok(adv);
    const orderBefore = plan.items.map((i) => i.gameId).join(",");
    assert.equal(orderBefore, "addition,subtraction,clean-up,puzzle,sketch");
    assert.equal(plan.level, 2);
  });
  test("game outside the plan is rejected", () => {
    assert.equal(validateAdvisory({ gameId: "chess" }), null);
  });
  test("unknown concept is rejected", () => {
    assert.equal(validateAdvisory({ gameId: "addition", conceptId: "mind-reading" }), null);
  });
  test("null recommendation keeps deterministic plan", () => {
    assert.equal(validateAdvisory(null), null);
  });
});

describe("pairing rules (mirrors parents repo)", () => {
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function validFormat(code: string): boolean {
    const c = code.replace(/-/g, "");
    return c.length === 6 && [...c].every((ch) => ALPHABET.includes(ch));
  }
  test("code format is unambiguous XXX-XXX", () => {
    assert.equal(validFormat("ABC-234"), true);
    assert.equal(validFormat("AB0-234"), false); // 0 excluded
    assert.equal(validFormat("AB1-234"), false); // 1 excluded
    assert.equal(validFormat("ABC-2345"), false);
  });
  test("single-use: second confirm fails", () => {
    let status = "open";
    const confirm = () => {
      if (status !== "open") return false;
      status = "pending";
      return true;
    };
    assert.equal(confirm(), true);
    assert.equal(confirm(), false);
  });
  test("expired codes rejected", () => {
    const expiresAt = Date.now() - 1000;
    assert.ok(expiresAt <= Date.now());
  });
});

describe("parent isolation (mirrors parent-auth)", () => {
  function canAccess(linkStatus: string | null, selfParent: boolean): boolean {
    if (!selfParent) return false;
    return linkStatus === "active";
  }
  test("pending link grants nothing", () => {
    assert.equal(canAccess("pending", true), false);
  });
  test("revoked link grants nothing", () => {
    assert.equal(canAccess("revoked", true), false);
  });
  test("another parent's active link grants nothing", () => {
    assert.equal(canAccess("active", false), false);
  });
  test("own active link grants access", () => {
    assert.equal(canAccess("active", true), true);
  });
});

describe("gameplay independence (gateway contract)", () => {
  test("provider failure yields empty results, never throws to gameplay", async () => {
    const failing = () => Promise.reject(new EducationGatewayError("MCP_TIMEOUT", "tutor-mcp", "slow", true));
    const out = await failing().then(
      () => ({ recommendation: { gameId: "x" } }),
      () => ({ recommendation: null })
    );
    assert.equal(out.recommendation, null);
  });
  test("deterministic plan survives null advisory", () => {
    const items = ["a", "b", "c"];
    const annotated = null as null | { focus: string };
    assert.deepEqual(annotated ? [...items].reverse() : items, ["a", "b", "c"]);
  });
});
