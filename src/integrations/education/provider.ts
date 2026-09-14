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
  ProviderName,
} from "./types";

// Learnzzy-owned capability contracts. Adapters implement these; application
// code depends on the interfaces, never on Tutor/OER/NCERT implementations.
export interface LearningIntelligenceProvider {
  readonly name: Extract<ProviderName, "tutor-mcp">;
  getLearnerState(input: LearnerStateInput): Promise<LearnerState>;
  recordLearningEvidence(input: LearningEvidenceInput): Promise<void>;
  recommendNextActivity(input: NextActivityInput): Promise<ActivityRecommendation>;
}

export interface EducationalKnowledgeProvider {
  readonly name: Extract<ProviderName, "oer-mcp">;
  searchContent(input: EducationalSearchInput): Promise<KnowledgeResult[]>;
  getConcept(input: ConceptInput): Promise<KnowledgeConcept | null>;
}

export interface CurriculumProvider {
  readonly name: Extract<ProviderName, "ncert-mcp">;
  searchCurriculum(input: CurriculumSearchInput): Promise<CurriculumResult[]>;
  getPrerequisites(input: PrerequisiteInput): Promise<Prerequisite[]>;
}

export type AnyEducationProvider =
  | LearningIntelligenceProvider
  | EducationalKnowledgeProvider
  | CurriculumProvider;

export function isTutorProvider(p: AnyEducationProvider): p is LearningIntelligenceProvider {
  return p.name === "tutor-mcp";
}

export function isOerProvider(p: AnyEducationProvider): p is EducationalKnowledgeProvider {
  return p.name === "oer-mcp";
}

export function isNcertProvider(p: AnyEducationProvider): p is CurriculumProvider {
  return p.name === "ncert-mcp";
}
