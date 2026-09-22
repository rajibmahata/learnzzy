// Shared game completion contract — deterministic, dependency-free, testable.
// ONE flow for every game: idle → feedback → advancing → done. Re-entrant
// calls (double taps, timer + manual Next racing) are rejected, never
// double-applied, so success can neither fire twice nor skip its state.

export type GameResultStatus =
  | "CORRECT"
  | "INCORRECT"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface GameResult {
  gameId: string;
  roundId?: string;
  contentId?: string;
  status: GameResultStatus;

  score?: number;
  accuracy?: number;
  responseTimeMs?: number;
  attempts?: number;
  theme?: string;
  character?: string;

  isCorrect?: boolean;
  isRoundComplete: boolean;
  isGameComplete: boolean;

  feedbackEvent?: string;
  completedAt: string;
}

export type RoundPhase = "idle" | "feedback" | "advancing" | "done";

export interface RoundInput {
  gameId: string;
  roundId?: string;
  contentId?: string;
  correct: boolean;
  score?: number;
  accuracy?: number;
  responseTimeMs?: number;
  attempts?: number;
  theme?: string;
  character?: string;
  roundIndex: number;
  totalRounds: number;
}

/** Build the contract result for one answered round. Pure. */
export function buildResult(input: RoundInput, now: Date = new Date()): GameResult {
  const last = input.roundIndex + 1 >= input.totalRounds;
  const correct = input.correct;
  return {
    gameId: input.gameId,
    roundId: input.roundId,
    contentId: input.contentId,
    status: correct ? (last ? "COMPLETED" : "CORRECT") : "INCORRECT",
    score: input.score,
    accuracy: input.accuracy,
    responseTimeMs: input.responseTimeMs,
    attempts: input.attempts,
    theme: input.theme,
    character: input.character,
    isCorrect: correct,
    isRoundComplete: true,
    isGameComplete: correct && last,
    feedbackEvent: correct ? "answer_correct" : "answer_incorrect",
    completedAt: now.toISOString(),
  };
}

/**
 * Transition guard: exactly one owner per round. `begin` moves idle →
 * feedback (second callers get `accepted: false`); `advance` moves feedback →
 * advancing (timer and manual Next race safely — only the first wins);
 * `finish` moves advancing → done; `reset` returns to idle for the next round.
 */
export interface RoundTransition {
  readonly phase: RoundPhase;
  begin(correct: boolean): { accepted: boolean; result: GameResult | null };
  advance(): boolean;
  finish(): boolean;
  reset(): void;
}

export function createRoundTransition(input: Omit<RoundInput, "correct">): RoundTransition {
  let phase: RoundPhase = "idle";
  let feedback: { accepted: boolean; result: GameResult | null } = { accepted: false, result: null };
  return {
    get phase() {
      return phase;
    },
    begin(correct: boolean) {
      if (phase !== "idle") return { accepted: false, result: null };
      phase = "feedback";
      feedback = { accepted: true, result: buildResult({ ...input, correct }) };
      return feedback;
    },
    advance() {
      if (phase !== "feedback") return false;
      phase = "advancing";
      return true;
    },
    finish() {
      if (phase !== "advancing") return false;
      phase = "done";
      return true;
    },
    reset() {
      phase = "idle";
      feedback = { accepted: false, result: null };
    },
  };
}
