import type {
  ActivityRecommendation,
  LearnerState,
  LearnerStateInput,
  LearningEvidenceInput,
  NextActivityInput,
} from "../types";
import { ActivityRecommendationSchema, LearnerStateSchema } from "../types";
import { EducationGatewayError } from "../errors";
import type { LearningIntelligenceProvider } from "../provider";
import type { ProviderConfig } from "../config";
import { providerFetch } from "../http";
import { registerLiveProvider, registerMockProvider } from "../registry";
import { conceptsForGame } from "@/lib/concepts";

// Live adapter contract (REST shim over a deployed tutor-mcp):
//   POST {baseUrl}/learner-state       { learnerId, ageBand, conceptIds } -> LearnerState
//   POST {baseUrl}/learning-evidence   { ...aggregated evidence }         -> { recorded: true }
//   POST {baseUrl}/next-activity       { learnerId, ageBand, ... }        -> ActivityRecommendation
// All responses are Zod-validated; anything else => MCP_INVALID_RESPONSE.
// The real tutor-mcp speaks MCP+OAuth natively; point TUTOR_MCP_URL at a
// thin REST shim (or future native MCP client) exposing the above.

// ---------- Live HTTP adapter ----------
export class TutorHttpProvider implements LearningIntelligenceProvider {
  readonly name = "tutor-mcp" as const;
  constructor(private readonly config: ProviderConfig) {}

  async getLearnerState(input: LearnerStateInput): Promise<LearnerState> {
    const res = await providerFetch("tutor-mcp", this.config, "/learner-state", { method: "POST", body: input });
    const parsed = LearnerStateSchema.safeParse(res.json);
    if (!parsed.success) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "tutor-mcp", "Tutor learner-state failed schema validation.");
    if (parsed.data.learnerId !== input.learnerId) {
      throw new EducationGatewayError("MCP_INVALID_RESPONSE", "tutor-mcp", "Tutor returned state for the wrong learner.");
    }
    return parsed.data;
  }

  async recordLearningEvidence(input: LearningEvidenceInput): Promise<void> {
    await providerFetch("tutor-mcp", this.config, "/learning-evidence", { method: "POST", body: input });
  }

  async recommendNextActivity(input: NextActivityInput): Promise<ActivityRecommendation> {
    const res = await providerFetch("tutor-mcp", this.config, "/next-activity", { method: "POST", body: input });
    const parsed = ActivityRecommendationSchema.safeParse(res.json);
    if (!parsed.success) throw new EducationGatewayError("MCP_INVALID_RESPONSE", "tutor-mcp", "Tutor recommendation failed schema validation.");
    return parsed.data;
  }
}

// ---------- Deterministic mock (dev/test/disabled) ----------
// Derives everything from Learnzzy's own learner doc — no network, no cost,
// same interface. Used whenever TUTOR_MCP_ENABLED is false/unset.
export class TutorMockProvider implements LearningIntelligenceProvider {
  readonly name = "tutor-mcp" as const;

  async getLearnerState(input: LearnerStateInput): Promise<LearnerState> {
    const { getLearner } = await import("@/repositories/learners");
    const learner = await getLearner(input.learnerId).catch(() => null);
    // Aggregate accuracy only across games that teach this concept (all levels).
    const gamesFor = (conceptId: string): string[] => {
      const out = new Set<string>();
      for (const gameId of ["addition", "subtraction", "clean-up", "puzzle", "sketch"]) {
        for (let lvl = 1; lvl <= 5; lvl++) {
          if (conceptsForGame(gameId, lvl).includes(conceptId)) out.add(gameId);
        }
      }
      return [...out];
    };
    const concepts = input.conceptIds.map((conceptId) => {
      const prog = learner?.gameProgress;
      let attempts = 0;
      let correct = 0;
      if (prog) {
        for (const gameId of gamesFor(conceptId)) {
          const p = prog[gameId];
          if (!p) continue;
          attempts += p.completions * 5;
          correct += Math.round(p.completions * 5 * (p.bestAccuracy ?? 0));
        }
      }
      return {
        conceptId,
        mastery: attempts === 0 ? 0 : Math.max(0, Math.min(1, correct / attempts)),
        attempts,
        correct,
      };
    });
    const overall = concepts.length === 0 ? 0 : concepts.reduce((s, c) => s + c.mastery, 0) / concepts.length;
    const misconceptions = concepts.filter((c) => c.attempts >= 10 && c.mastery < 0.5).map((c) => c.conceptId);
    return LearnerStateSchema.parse({ learnerId: input.learnerId, concepts, misconceptions, overallMastery: overall });
  }

  async recordLearningEvidence(_input: LearningEvidenceInput): Promise<void> {
    // Mock records nothing externally; Learnzzy's own learningSignals remain
    // the durable store. No-op by design.
  }

  async recommendNextActivity(input: NextActivityInput): Promise<ActivityRecommendation> {
    const { getLearner } = await import("@/repositories/learners");
    const { GAMES } = await import("@/games/registry");
    const learner = await getLearner(input.learnerId).catch(() => null);
    const valid = new Set(GAMES.map((g) => g.id));
    // Highest-need game: lowest bestAccuracy among played, else least-played.
    let best: { gameId: string; reason: ActivityRecommendation["reason"] } = { gameId: "addition", reason: "variety" };
    let bestScore = Infinity;
    for (const g of GAMES) {
      if (input.recentGameIds.includes(g.id)) continue;
      const p = learner?.gameProgress?.[g.id];
      const score = p ? (p.bestAccuracy ?? 0) * 10 + p.completions : -1;
      if (score < bestScore) {
        bestScore = score;
        best = { gameId: g.id, reason: !p ? "variety" : (p.bestAccuracy ?? 0) < 0.7 ? "need-practice" : "review" };
      }
    }
    if (!valid.has(best.gameId)) best = { gameId: "addition", reason: "variety" };
    return ActivityRecommendationSchema.parse({ ...best, confidence: 0.6 });
  }
}

registerMockProvider("tutor-mcp", new TutorMockProvider());

export function registerLiveTutor(config: ProviderConfig): void {
  registerLiveProvider("tutor-mcp", new TutorHttpProvider(config));
}
