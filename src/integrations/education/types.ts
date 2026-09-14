import { z } from "zod";

// Shared Education Gateway contracts. Every external provider response is
// validated against these Zod schemas before use (DEC-071/141). Learnzzy
// gameIds stay internal; conceptIds are the cross-provider bridge.

// ---------- Learner intelligence (Tutor) ----------
export const LearnerStateInputSchema = z.object({
  learnerId: z.string().min(1).max(100),
  ageBand: z.enum(["4-5", "6-7", "8-9"]),
  conceptIds: z.array(z.string().min(1).max(80)).max(20).default([]),
});
export type LearnerStateInput = z.infer<typeof LearnerStateInputSchema>;

export const ConceptMasterySchema = z.object({
  conceptId: z.string().min(1).max(80),
  mastery: z.number().min(0).max(1),
  attempts: z.number().int().min(0),
  correct: z.number().int().min(0),
  reviewInDays: z.number().int().min(0).max(365).optional(),
});
export type ConceptMastery = z.infer<typeof ConceptMasterySchema>;

export const LearnerStateSchema = z.object({
  learnerId: z.string().min(1).max(100),
  concepts: z.array(ConceptMasterySchema).max(50).default([]),
  misconceptions: z.array(z.string().min(1).max(120)).max(20).default([]),
  overallMastery: z.number().min(0).max(1).optional(),
});
export type LearnerState = z.infer<typeof LearnerStateSchema>;

export const LearningEvidenceInputSchema = z.object({
  learnerId: z.string().min(1).max(100),
  ageBand: z.enum(["4-5", "6-7", "8-9"]),
  sessionId: z.string().min(1).max(120),
  gameId: z.string().min(1).max(50),
  conceptId: z.string().min(1).max(80),
  difficulty: z.number().int().min(1).max(5),
  attempts: z.number().int().min(0).max(1000),
  correct: z.number().int().min(0).max(1000),
  responseTimeMs: z.number().int().min(0).max(600000).optional(),
  retryCount: z.number().int().min(0).max(100).optional(),
  timestamp: z.string().datetime().optional(),
});
export type LearningEvidenceInput = z.infer<typeof LearningEvidenceInputSchema>;

export const NextActivityInputSchema = z.object({
  learnerId: z.string().min(1).max(100),
  ageBand: z.enum(["4-5", "6-7", "8-9"]),
  currentLevel: z.number().int().min(1).max(5),
  recentGameIds: z.array(z.string().min(1).max(50)).max(10).default([]),
  focusConceptIds: z.array(z.string().min(1).max(80)).max(10).default([]),
});
export type NextActivityInput = z.infer<typeof NextActivityInputSchema>;

export const ActivityRecommendationSchema = z.object({
  gameId: z.string().min(1).max(50),
  conceptId: z.string().min(1).max(80).optional(),
  reason: z.enum(["interest", "need-practice", "variety", "review", "prerequisite"]),
  confidence: z.number().min(0).max(1).optional(),
});
export type ActivityRecommendation = z.infer<typeof ActivityRecommendationSchema>;

// ---------- Educational knowledge (OER) ----------
export const EducationalSearchInputSchema = z.object({
  query: z.string().min(2).max(200),
  ageBand: z.enum(["4-5", "6-7", "8-9"]).optional(),
  conceptId: z.string().min(1).max(80).optional(),
  limit: z.number().int().min(1).max(10).default(5),
});
export type EducationalSearchInput = z.infer<typeof EducationalSearchInputSchema>;

export const ProvenanceSchema = z.object({
  provider: z.enum(["tutor-mcp", "oer-mcp", "ncert-mcp", "learnzzy-native"]),
  sourceId: z.string().min(1).max(200),
  reference: z.string().max(500).optional(),
  license: z.string().max(120),
  attribution: z.string().max(500),
  retrievedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const KnowledgeResultSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(4000),
  conceptId: z.string().min(1).max(80).optional(),
  provenance: ProvenanceSchema,
});
export type KnowledgeResult = z.infer<typeof KnowledgeResultSchema>;

export const ConceptInputSchema = z.object({
  conceptId: z.string().min(1).max(80),
});
export type ConceptInput = z.infer<typeof ConceptInputSchema>;

export const KnowledgeConceptSchema = z.object({
  conceptId: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  domain: z.string().min(1).max(60),
  summary: z.string().max(2000).optional(),
  prerequisites: z.array(z.string().min(1).max(80)).max(20).default([]),
  provenance: ProvenanceSchema,
});
export type KnowledgeConcept = z.infer<typeof KnowledgeConceptSchema>;

// ---------- Curriculum (NCERT) ----------
export const CurriculumSearchInputSchema = z.object({
  query: z.string().min(2).max(200),
  grade: z.number().int().min(1).max(12).optional(),
  subject: z.string().min(1).max(60).optional(),
  limit: z.number().int().min(1).max(10).default(5),
});
export type CurriculumSearchInput = z.infer<typeof CurriculumSearchInputSchema>;

export const CurriculumResultSchema = z.object({
  grade: z.number().int().min(1).max(12),
  subject: z.string().min(1).max(60),
  topic: z.string().min(1).max(200),
  chapter: z.string().max(200).optional(),
  conceptId: z.string().min(1).max(80).optional(),
  bloomLevel: z.string().max(40).optional(),
  provenance: ProvenanceSchema,
});
export type CurriculumResult = z.infer<typeof CurriculumResultSchema>;

export const PrerequisiteInputSchema = z.object({
  topic: z.string().min(1).max(200).optional(),
  conceptId: z.string().min(1).max(80).optional(),
  grade: z.number().int().min(1).max(12).optional(),
  subject: z.string().min(1).max(60).optional(),
});
export type PrerequisiteInput = z.infer<typeof PrerequisiteInputSchema>;

export const PrerequisiteSchema = z.object({
  topic: z.string().min(1).max(200),
  conceptId: z.string().min(1).max(80).optional(),
  relation: z.enum(["prerequisite", "related"]).default("prerequisite"),
});
export type Prerequisite = z.infer<typeof PrerequisiteSchema>;

// ---------- Provider health / observability ----------
export const ProviderNameSchema = z.enum(["tutor-mcp", "oer-mcp", "ncert-mcp"]);
export type ProviderName = z.infer<typeof ProviderNameSchema>;

export type ProviderHealthStatus = "healthy" | "degraded" | "disabled" | "unreachable";

export interface ProviderHealth {
  provider: ProviderName;
  enabled: boolean;
  status: ProviderHealthStatus;
  latencyMs: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCode: string | null;
  errorCount24h: number;
  cacheHitRate: number | null;
}

export type { EducationErrorCode, EducationGatewayError } from "./errors";
