import { z } from "zod";

// Unified curriculum abstraction — additive, validated, provenance-aware.
// No LLM in validation; sourceUrl/version/provenance preserved.

export const curriculumFrameworkSchema = z.object({
  id: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  code: z.string().min(2).max(20),
  name: z.string().min(3),
  country: z.string().min(2),
  region: z.string().optional(),
  organization: z.string().min(2),
  educationStage: z.string().min(2),
  sourceUrl: z.string().url(),
  version: z.string().min(1),
  sourceDate: z.string().datetime().optional(),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});
export type CurriculumFramework = z.infer<typeof curriculumFrameworkSchema>;

export const curriculumStageSchema = z.object({
  id: z.string().min(2),
  frameworkId: z.string().min(2),
  code: z.string().min(1),
  name: z.string().min(2),
  ageRange: z.string().min(3),
  gradeRange: z.string().min(1),
  sequence: z.number().int().min(1),
});
export type CurriculumStage = z.infer<typeof curriculumStageSchema>;

export const curriculumSubjectSchema = z.object({
  id: z.string().min(2),
  frameworkId: z.string().min(2),
  stageId: z.string().min(2),
  code: z.string().min(1),
  name: z.string().min(2),
});
export type CurriculumSubject = z.infer<typeof curriculumSubjectSchema>;

export const curriculumOutcomeSchema = z.object({
  id: z.string().min(2),
  frameworkId: z.string().min(2),
  stageId: z.string().min(2),
  subjectId: z.string().min(2),
  strand: z.string().min(2),
  code: z.string().min(1),
  description: z.string().min(10),
  sourceReference: z.string().min(5),
  provenance: z.object({ sourceUrl: z.string().url(), retrievedAt: z.string().datetime(), license: z.string() }).optional(),
  status: z.enum(["active", "draft"]).default("active"),
});
export type CurriculumOutcome = z.infer<typeof curriculumOutcomeSchema>;

export const curriculumMappingSchema = z.object({
  activityId: z.string().min(2),
  frameworkId: z.string().min(2),
  stageId: z.string().min(2),
  subjectId: z.string().min(2),
  outcomeIds: z.array(z.string().min(2)).min(1),
  skills: z.array(z.string()).min(1),
  mappingType: z.enum(["direct", "supporting", "assessment"]),
  confidence: z.number().min(0).max(1),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  sourceReference: z.string().min(5),
});
export type CurriculumMapping = z.infer<typeof curriculumMappingSchema>;
