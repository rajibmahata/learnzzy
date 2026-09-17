import type { CurriculumResult, CurriculumSearchInput, Prerequisite, PrerequisiteInput } from "../types";
import { CurriculumResultSchema, PrerequisiteSchema } from "../types";
import { EducationGatewayError } from "../errors";
import type { CurriculumProvider } from "../provider";
import type { ProviderConfig } from "../config";
import { providerFetch } from "../http";
import { registerLiveProvider, registerMockProvider } from "../registry";
import { getConceptDef } from "@/lib/concepts";

// Live adapter contract (REST shim over a deployed ncert-mcp FastAPI):
//   POST {baseUrl}/search-curriculum { query, grade?, subject?, limit } -> CurriculumResult[]
//   POST {baseUrl}/prerequisites     { topic?, conceptId?, ... }        -> Prerequisite[]
// Disabled by default (NCERT_MCP_ENABLED=false); the MVP never depends on
// curriculum data. Maps to the real ncert-mcp REST surface (/search/content,
// /graph/prerequisites, /graph/learning-path) via the shim.

// ---------- Live HTTP adapter ----------
export class NcertHttpProvider implements CurriculumProvider {
  readonly name = "ncert-mcp" as const;
  constructor(private readonly config: ProviderConfig) {}

  async searchCurriculum(input: CurriculumSearchInput): Promise<CurriculumResult[]> {
    const res = await providerFetch("ncert-mcp", this.config, "/search-curriculum", { method: "POST", body: input });
    const arr = Array.isArray(res.json) ? res.json : [];
    const out: CurriculumResult[] = [];
    for (const item of arr.slice(0, input.limit)) {
      const parsed = CurriculumResultSchema.safeParse(item);
      if (!parsed.success) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "ncert-mcp", "NCERT curriculum result failed schema validation.");
      out.push(parsed.data);
    }
    return out;
  }

  async getPrerequisites(input: PrerequisiteInput): Promise<Prerequisite[]> {
    const res = await providerFetch("ncert-mcp", this.config, "/prerequisites", { method: "POST", body: input });
    const arr = Array.isArray(res.json) ? res.json : [];
    const out: Prerequisite[] = [];
    for (const item of arr.slice(0, 20)) {
      const parsed = PrerequisiteSchema.safeParse(item);
      if (!parsed.success) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "ncert-mcp", "NCERT prerequisite failed schema validation.");
      out.push(parsed.data);
    }
    return out;
  }
}

// ---------- Curriculum mock (dev/test/disabled) ----------
// Foundational-stage mapping (NEP 2020 Balvatika / Grades 1–2 scope only):
// counting, shapes, and first words. Explicitly NOT a full CBSE mapping —
// the young-learner MVP never implies grade-level certification.
const FOUNDATIONAL_MAP: { match: string[]; grade: number; subject: string; topic: string; chapter?: string; conceptId: string; bloomLevel: string }[] = [
  { match: ["count", "number", "addition", "gin", "jod"], grade: 1, subject: "Mathematics", topic: "Counting and addition within 10", chapter: "Numbers", conceptId: "math.addition.within10", bloomLevel: "remember" },
  { match: ["subtract", "take away", "ghata"], grade: 1, subject: "Mathematics", topic: "Subtraction within 10", chapter: "Numbers", conceptId: "math.subtraction.within10", bloomLevel: "understand" },
  { match: ["shape", "circle", "square", "triangle", "aakar"], grade: 1, subject: "Mathematics", topic: "Shape recognition", chapter: "Shapes", conceptId: "geometry.shapes", bloomLevel: "remember" },
  { match: ["sort", "tidy", "color", "rang"], grade: 1, subject: "EVS", topic: "Sorting familiar objects", chapter: "My World", conceptId: "cognition.sorting", bloomLevel: "apply" },
  { match: ["bird", "animal", "parrot", "tota", "pakshi"], grade: 1, subject: "EVS", topic: "Bird recognition", chapter: "Animals Around Us", conceptId: "knowledge.world-discovery", bloomLevel: "remember" },
  { match: ["word", "first word", "shabd"], grade: 1, subject: "English", topic: "First words", chapter: "Sounds", conceptId: "language.first-words", bloomLevel: "remember" },
];

export class NcertMockProvider implements CurriculumProvider {
  readonly name = "ncert-mcp" as const;

  async searchCurriculum(input: CurriculumSearchInput): Promise<CurriculumResult[]> {
    const q = input.query.toLowerCase();
    const { buildProvenance } = await import("../provenance");
    return FOUNDATIONAL_MAP.filter(
      (m) =>
        (input.grade === undefined || m.grade === input.grade) &&
        (!input.subject || m.subject.toLowerCase().includes(input.subject.toLowerCase())) &&
        m.match.some((k) => q.includes(k))
    )
      .slice(0, input.limit)
      .map((m) =>
        CurriculumResultSchema.parse({
          grade: m.grade,
          subject: m.subject,
          topic: m.topic,
          chapter: m.chapter,
          conceptId: m.conceptId,
          bloomLevel: m.bloomLevel,
          provenance: buildProvenance({
            provider: "learnzzy-native",
            sourceId: `foundational:${m.conceptId}`,
            license: "CC0",
            attribution: "Learnzzy foundational mapping (dev/test only, not official CBSE alignment)",
          }),
        })
      );
  }

  async getPrerequisites(input: PrerequisiteInput): Promise<Prerequisite[]> {
    const conceptId = input.conceptId;
    const chain: Prerequisite[] = [];
    if (conceptId) {
      const def = getConceptDef(conceptId);
      if (def) {
        for (const pre of def.prerequisites.slice(0, 20)) {
          const preDef = getConceptDef(pre);
          chain.push(
            PrerequisiteSchema.parse({
              topic: preDef?.name ?? pre,
              conceptId: pre,
              relation: "prerequisite",
            })
          );
        }
      }
    }
    return chain;
  }
}

registerMockProvider("ncert-mcp", new NcertMockProvider());

export function registerLiveNcert(config: ProviderConfig): void {
  registerLiveProvider("ncert-mcp", new NcertHttpProvider(config));
}
