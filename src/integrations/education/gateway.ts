import { newId } from "@/db/mongodb";
import { z } from "zod";
import type {
  ActivityRecommendation,
  ConceptInput,
  CurriculumResult,
  CurriculumSearchInput,
  EducationalSearchInput,
  KnowledgeConcept,
  KnowledgeResult,
  LearnerState,
  LearnerStateInput,
  LearningEvidenceInput,
  NextActivityInput,
  Prerequisite,
  PrerequisiteInput,
  ProviderHealth,
} from "./types";
import { KnowledgeResultSchema, KnowledgeConceptSchema, CurriculumResultSchema, PrerequisiteSchema } from "./types";
import { getKnowledgeCache, saveKnowledgeCache } from "@/repositories/educationKnowledge";
import { EducationGatewayError } from "./errors";
import { isNcertProvider, isOerProvider, isTutorProvider } from "./provider";
import { providerConfig, registeredProviders } from "./registry";
import { resolveProvider } from "./registry";
import { cacheGet, cacheSet, cacheKey } from "./cache";
import { recordProviderEvent, providerHealth } from "./health";

// EducationGateway — the single server-side entry point for Tutor/OER/NCERT.
// Agents call the gateway; the gateway selects the allowlisted provider,
// applies caching, validation happens in adapters, failures are classified
// and callers fall back to deterministic Learnzzy services. Never callable
// from the browser (no route exposes it directly to children).
function correlationId(): string {
  try {
    return newId("edu");
  } catch {
    return `edu_${Date.now().toString(36)}`;
  }
}

async function withObservation<T>(args: {
  provider: "tutor-mcp" | "oer-mcp" | "ncert-mcp";
  operation: string;
  cacheLookup?: () => Promise<{ hit: boolean; value: string | null }>;
  run: () => Promise<{ value: T; cacheable?: string; ttlSeconds?: number }>;
}): Promise<{ value: T; mocked: boolean; cacheHit: boolean }> {
  const started = Date.now();
  const cid = correlationId();
  const cfg = providerConfig(args.provider);
  const resolved = resolveProvider(args.provider);
  if (args.cacheLookup) {
    try {
      const cached = await args.cacheLookup();
      if (cached.hit && cached.value) {
        await recordProviderEvent({ provider: args.provider, operation: args.operation, durationMs: Date.now() - started, success: true, cacheHit: true, correlationId: cid });
        return { value: JSON.parse(cached.value) as T, mocked: resolved.mocked, cacheHit: true };
      }
    } catch { /* treat as miss */ }
  }
  try {
    const out = await args.run();
    if (out.cacheable !== undefined) {
      await cacheSet(out.cacheable, JSON.stringify(out.value), out.ttlSeconds ?? cfg.cacheTtlSeconds).catch(() => null);
    }
    await recordProviderEvent({ provider: args.provider, operation: args.operation, durationMs: Date.now() - started, success: true, cacheHit: false, correlationId: cid });
    return { value: out.value, mocked: resolved.mocked, cacheHit: false };
  } catch (err) {
    const code = err instanceof EducationGatewayError ? err.code : "MCP_UNAVAILABLE";
    await recordProviderEvent({ provider: args.provider, operation: args.operation, durationMs: Date.now() - started, success: false, errorCode: code, correlationId: cid });
    throw err;
  }
}

export const educationGateway = {
  async getLearnerState(input: LearnerStateInput): Promise<{ state: LearnerState; mocked: boolean }> {
    const key = cacheKey("tutor", "learner-state", input.learnerId, input.conceptIds.join(","));
    const r = await withObservation({
      provider: "tutor-mcp",
      operation: "getLearnerState",
      cacheLookup: () => cacheGet(key),
      run: async () => {
        const { provider } = resolveProvider("tutor-mcp");
        if (!isTutorProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "Tutor provider misregistered.");
        const state = await provider.getLearnerState(input);
        return { value: state, cacheable: key, ttlSeconds: providerConfig("tutor-mcp").cacheTtlSeconds };
      },
    });
    return { state: r.value, mocked: r.mocked };
  },

  async recordLearningEvidence(input: LearningEvidenceInput): Promise<{ recorded: boolean; mocked: boolean }> {
    // Fire-and-forget friendly: failures are classified; callers ignore them.
    const started = Date.now();
    const cid = correlationId();
    try {
      const { provider, mocked } = resolveProvider("tutor-mcp");
      if (!isTutorProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "Tutor provider misregistered.");
      await provider.recordLearningEvidence(input);
      await recordProviderEvent({ provider: "tutor-mcp", operation: "recordLearningEvidence", durationMs: Date.now() - started, success: true, correlationId: cid });
      return { recorded: true, mocked };
    } catch (err) {
      const code = err instanceof EducationGatewayError ? err.code : "MCP_UNAVAILABLE";
      await recordProviderEvent({ provider: "tutor-mcp", operation: "recordLearningEvidence", durationMs: Date.now() - started, success: false, errorCode: code, correlationId: cid });
      return { recorded: false, mocked: true };
    }
  },

  async recommendNextActivity(input: NextActivityInput): Promise<{ recommendation: ActivityRecommendation | null; mocked: boolean }> {
    try {
      const r = await withObservation({
        provider: "tutor-mcp",
        operation: "recommendNextActivity",
        run: async () => {
          const { provider } = resolveProvider("tutor-mcp");
          if (!isTutorProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "Tutor provider misregistered.");
          const recommendation = await provider.recommendNextActivity(input);
          return { value: recommendation };
        },
      });
      return { recommendation: r.value, mocked: r.mocked };
    } catch {
      return { recommendation: null, mocked: true };
    }
  },

  async searchEducationalContent(input: EducationalSearchInput): Promise<{ results: KnowledgeResult[]; mocked: boolean }> {
    const key = cacheKey("oer", "search", input.query, input.conceptId ?? "", input.ageBand ?? "");
    try {
      const r = await withObservation({
        provider: "oer-mcp",
        operation: "searchContent",
        cacheLookup: () => cacheGet(key),
        run: async () => {
          const { provider } = resolveProvider("oer-mcp");
          if (!isOerProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "OER provider misregistered.");
          const results = await provider.searchContent(input);
          return { value: results, cacheable: key };
        },
      });
      // Durable tier: persist validated results with provenance for restarts.
      if (r.value.length > 0) {
        const first = r.value[0].provenance;
        void saveKnowledgeCache({
          cacheKey: key,
          provider: "oer-mcp",
          kind: "search",
          payload: r.value,
          provenance: { license: first.license, attribution: first.attribution },
          expiresAt: new Date(Date.now() + providerConfig("oer-mcp").cacheTtlSeconds * 1000),
        });
      }
      return { results: r.value, mocked: r.mocked };
    } catch {
      // Mongo fallback before giving up — validated again on load.
      const stored = await getKnowledgeCache(key).catch(() => null);
      const parsed = z.array(KnowledgeResultSchema).safeParse(stored);
      if (parsed.success && parsed.data.length > 0) return { results: parsed.data.slice(0, input.limit), mocked: true };
      return { results: [], mocked: true };
    }
  },

  async getConcept(input: ConceptInput): Promise<{ concept: KnowledgeConcept | null; mocked: boolean }> {
    const key = cacheKey("oer", "concept", input.conceptId);
    try {
      const r = await withObservation({
        provider: "oer-mcp",
        operation: "getConcept",
        cacheLookup: () => cacheGet(key),
        run: async () => {
          const { provider } = resolveProvider("oer-mcp");
          if (!isOerProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "OER provider misregistered.");
          const concept = await provider.getConcept(input);
          return { value: concept, cacheable: key };
        },
      });
      if (r.value) {
        void saveKnowledgeCache({
          cacheKey: key,
          provider: "oer-mcp",
          kind: "concept",
          conceptId: input.conceptId,
          payload: r.value,
          provenance: { license: r.value.provenance.license, attribution: r.value.provenance.attribution },
          expiresAt: new Date(Date.now() + providerConfig("oer-mcp").cacheTtlSeconds * 1000),
        });
      }
      return { concept: r.value, mocked: r.mocked };
    } catch {
      const stored = await getKnowledgeCache(key).catch(() => null);
      const parsed = KnowledgeConceptSchema.nullable().safeParse(stored);
      if (parsed.success) return { concept: parsed.data, mocked: true };
      return { concept: null, mocked: true };
    }
  },

  async searchCurriculum(input: CurriculumSearchInput): Promise<{ results: CurriculumResult[]; mocked: boolean }> {
    const key = cacheKey("ncert", "search", input.query, String(input.grade ?? ""), input.subject ?? "");
    try {
      const r = await withObservation({
        provider: "ncert-mcp",
        operation: "searchCurriculum",
        cacheLookup: () => cacheGet(key),
        run: async () => {
          const { provider } = resolveProvider("ncert-mcp");
          if (!isNcertProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "NCERT provider misregistered.");
          const results = await provider.searchCurriculum(input);
          return { value: results, cacheable: key };
        },
      });
      if (r.value.length > 0) {
        const first = r.value[0].provenance;
        void saveKnowledgeCache({
          cacheKey: key,
          provider: "ncert-mcp",
          kind: "curriculum",
          payload: r.value,
          provenance: { license: first.license, attribution: first.attribution },
          expiresAt: new Date(Date.now() + providerConfig("ncert-mcp").cacheTtlSeconds * 1000),
        });
      }
      return { results: r.value, mocked: r.mocked };
    } catch {
      const stored = await getKnowledgeCache(key).catch(() => null);
      const parsed = z.array(CurriculumResultSchema).safeParse(stored);
      if (parsed.success && parsed.data.length > 0) return { results: parsed.data.slice(0, input.limit), mocked: true };
      return { results: [], mocked: true };
    }
  },

  async getPrerequisites(input: PrerequisiteInput): Promise<{ prerequisites: Prerequisite[]; mocked: boolean }> {
    const key = cacheKey("ncert", "prereqs", input.conceptId ?? "", input.topic ?? "");
    try {
      const r = await withObservation({
        provider: "ncert-mcp",
        operation: "getPrerequisites",
        cacheLookup: () => cacheGet(key),
        run: async () => {
          const { provider } = resolveProvider("ncert-mcp");
          if (!isNcertProvider(provider)) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "gateway", "NCERT provider misregistered.");
          const prerequisites = await provider.getPrerequisites(input);
          return { value: prerequisites, cacheable: key };
        },
      });
      if (r.value.length > 0) {
        void saveKnowledgeCache({
          cacheKey: key,
          provider: "ncert-mcp",
          kind: "prerequisites",
          conceptId: input.conceptId,
          payload: r.value,
          provenance: null,
          expiresAt: new Date(Date.now() + providerConfig("ncert-mcp").cacheTtlSeconds * 1000),
        });
      }
      return { prerequisites: r.value, mocked: r.mocked };
    } catch {
      const stored = await getKnowledgeCache(key).catch(() => null);
      const parsed = z.array(PrerequisiteSchema).safeParse(stored);
      if (parsed.success && parsed.data.length > 0) return { prerequisites: parsed.data, mocked: true };
      return { prerequisites: [], mocked: true };
    }
  },

  async health(): Promise<{ providers: ProviderHealth[] }> {
    const providers: ProviderHealth[] = [];
    for (const name of registeredProviders()) {
      providers.push(await providerHealth(name, providerConfig(name).enabled));
    }
    return { providers };
  },
};
