import type { ConceptInput, EducationalSearchInput, KnowledgeConcept, KnowledgeResult } from "../types";
import { KnowledgeConceptSchema, KnowledgeResultSchema } from "../types";
import { EducationGatewayError } from "../errors";
import type { EducationalKnowledgeProvider } from "../provider";
import type { ProviderConfig } from "../config";
import { providerFetch } from "../http";
import { registerLiveProvider, registerMockProvider } from "../registry";
import { buildProvenance } from "../provenance";
import { getConceptDef } from "@/lib/concepts";

// Live adapter contract (REST shim over a deployed oer-mcp):
//   POST {baseUrl}/search  { query, conceptId?, ageBand?, limit } -> KnowledgeResult[]
//   POST {baseUrl}/concept { conceptId }                          -> KnowledgeConcept | null
// Every result must carry provenance incl. license + attribution; results
// without them are rejected (MCP_INVALID_RESPONSE). OER output grounds
// generation — it NEVER enters the pool without the full validation
// pipeline + license gate (isPoolSafeLicense).

// ---------- Live HTTP adapter ----------
export class OerHttpProvider implements EducationalKnowledgeProvider {
  readonly name = "oer-mcp" as const;
  constructor(private readonly config: ProviderConfig) {}

  async searchContent(input: EducationalSearchInput): Promise<KnowledgeResult[]> {
    const res = await providerFetch("oer-mcp", this.config, "/search", { method: "POST", body: input });
    const arr = Array.isArray(res.json) ? res.json : [];
    const out: KnowledgeResult[] = [];
    for (const item of arr.slice(0, input.limit)) {
      const parsed = KnowledgeResultSchema.safeParse(item);
      if (!parsed.success) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "oer-mcp", "OER search result failed schema validation.");
      out.push(parsed.data);
    }
    return out;
  }

  async getConcept(input: ConceptInput): Promise<KnowledgeConcept | null> {
    const res = await providerFetch("oer-mcp", this.config, "/concept", { method: "POST", body: input });
    if (res.json === null) return null;
    const parsed = KnowledgeConceptSchema.safeParse(res.json);
    if (!parsed.success) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "oer-mcp", "OER concept failed schema validation.");
    return parsed.data;
  }
}

// ---------- Curated mock (dev/test/disabled) ----------
// Grounding explanations for Learnzzy's own concept catalog. Provenance is
// learnzzy-native + CC0 so pool rules stay simple; external licenses never
// appear from the mock.
const MOCK_SUMMARIES: Record<string, { name: string; domain: string; summary: string }> = {
  "math.addition.within10": { name: "Addition within 10", domain: "mathematics", summary: "Joining two small groups and counting how many altogether. Use fingers, objects, or pictures before symbols." },
  "math.subtraction.within10": { name: "Subtraction within 10", domain: "mathematics", summary: "Taking a small group away and counting what is left. Act out 'fly away' or 'eat' stories first." },
  "cognition.sorting": { name: "Sorting and tidying", domain: "cognition", summary: "Grouping objects by one attribute (color, shape, kind) and putting each group in its home." },
  "spatial.part-whole": { name: "Part–whole relationships", domain: "spatial", summary: "Seeing how small pieces fit into a bigger picture. Start with 4 large pieces, then 6, then 9." },
  "geometry.shapes": { name: "Shape recognition", domain: "mathematics", summary: "Naming circles, squares, triangles, and stars by their sides and corners. Trace before drawing freehand." },
  "motor.tracing": { name: "Tracing and control", domain: "fine-motor", summary: "Following a dotted path slowly with a finger or stylus. Big shapes first, then smaller." },
  "knowledge.world-discovery": { name: "World discovery", domain: "knowledge", summary: "Meeting animals, birds, fruits, and colors through show-then-find play. Name first, then recognize, then recall." },
  "language.first-words": { name: "First words", domain: "language", summary: "Hearing and saying first words with pictures and voice. Repeat, echo, and celebrate every try." },
  "birds.parrot": { name: "Parrot", domain: "knowledge", summary: "Parrots are colorful birds. Show the parrot, say hello, then find the parrot, then find all birds." },
  "math.counting.objects": { name: "Counting objects", domain: "mathematics", summary: "Touching and counting up to 5 objects one by one. Count dogs, apples, or stars — the number stays the same." },
};

export class OerMockProvider implements EducationalKnowledgeProvider {
  readonly name = "oer-mcp" as const;

  async searchContent(input: EducationalSearchInput): Promise<KnowledgeResult[]> {
    const q = input.query.toLowerCase();
    const hits = Object.entries(MOCK_SUMMARIES)
      .filter(([id, s]) => {
        if (input.conceptId && id !== input.conceptId) return false;
        return s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q) || s.domain.includes(q) || id.includes(q.replace(/\s+/g, "."));
      })
      .slice(0, input.limit);
    return hits.map(([conceptId, s]) =>
      KnowledgeResultSchema.parse({
        title: s.name,
        content: s.summary,
        conceptId,
        provenance: buildProvenance({ provider: "learnzzy-native", sourceId: `mock:${conceptId}`, license: "CC0", attribution: "Learnzzy curated mock (dev/test only)" }),
      })
    );
  }

  async getConcept(input: ConceptInput): Promise<KnowledgeConcept | null> {
    const def = getConceptDef(input.conceptId);
    if (!def) return null;
    const mock = MOCK_SUMMARIES[input.conceptId];
    return KnowledgeConceptSchema.parse({
      conceptId: def.id,
      name: mock?.name ?? def.name,
      domain: def.domain,
      summary: mock?.summary,
      prerequisites: def.prerequisites,
      provenance: buildProvenance({ provider: "learnzzy-native", sourceId: `mock:${def.id}`, license: "CC0", attribution: "Learnzzy curated mock (dev/test only)" }),
    });
  }
}

registerMockProvider("oer-mcp", new OerMockProvider());

export function registerLiveOer(config: ProviderConfig): void {
  registerLiveProvider("oer-mcp", new OerHttpProvider(config));
}
