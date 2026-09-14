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
// Returns prerequisite chains from Learnzzy's own concept graph — the same
// data the planner already uses. No external curriculum implied.
export class NcertMockProvider implements CurriculumProvider {
  readonly name = "ncert-mcp" as const;

  async searchCurriculum(input: CurriculumSearchInput): Promise<CurriculumResult[]> {
    // The young-learner MVP has no CBSE mapping; the mock is explicit about
    // that instead of inventing curriculum alignment.
    void input;
    return [];
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
