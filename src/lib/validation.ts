import { z } from "zod";

// Public event ingestion validation (BR-144). Server re-derives correctness;
// client score is never trusted (BR-022 / DEC-052).
export const GameEventSchema = z.object({
  clientEventId: z.string().min(1).max(100).optional(),
  event: z.enum([
    "session_started",
    "learner_started",
    "profile_created",
    "age_band_selected",
    "game_recommended",
    "game_started",
    "question_shown",
    "answer_submitted",
    "answer_correct",
    "answer_incorrect",
    "hint_used",
    "retry_started",
    "activity_completed",
    "game_completed",
    "level_completed",
    "level_unlocked",
    "star_awarded",
    "sticker_awarded",
    "badge_awarded",
    "interest_signal_recorded",
    "learning_plan_created",
    "learning_plan_updated",
    "session_completed",
    "puzzle_piece_placed",
    "puzzle_completed",
    "drawing_started",
    "drawing_completed",
  ]),
  gameId: z.string().min(1).max(50).optional(),
  contentId: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
  clientTimestamp: z.string().datetime().optional(),
});

export const BatchEventsSchema = z.object({
  sessionId: z.string().min(1).max(120),
  events: z.array(GameEventSchema).min(1).max(100),
});
