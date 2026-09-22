"use client";

import * as React from "react";
import {
  createRoundTransition,
  type GameResult,
  type RoundInput,
  type RoundPhase,
} from "./gameFlow.ts";

// Shared round lifecycle for EVERY game: success feedback first, then exactly
// one advance — timer and manual Next race safely because the transition guard
// accepts only the first. `autoAdvanceMs: null` means manual-Next-only rounds
// (missions). Cleanup on unmount/reset; never throws into gameplay.
export function useRoundStatus(opts: {
  gameId: string;
  roundIndex: number;
  totalRounds: number;
  contentId?: string;
  roundId?: string;
  /** Auto-advance delay after feedback; null disables (manual Next only). */
  autoAdvanceMs: number | null;
  /** Whether an incorrect answer also auto-advances (default true). */
  advanceOnRetry?: boolean;
  onAdvance: () => void;
}): {
  phase: RoundPhase;
  /** Whole seconds left on the auto-advance timer (null when none armed). */
  countdown: number | null;
  /** Record an answer. Returns the contract result, or null if duplicate. */
  submit: (correct: boolean) => GameResult | null;
  /** Manual Next. Returns true only for the winning call. */
  advanceNow: () => boolean;
  reset: () => void;
} {
  const [phase, setPhase] = React.useState<RoundPhase>("idle");
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const transition = React.useMemo(
    () =>
      createRoundTransition({
        gameId: opts.gameId,
        roundIndex: opts.roundIndex,
        totalRounds: opts.totalRounds,
        contentId: opts.contentId,
        roundId: opts.roundId,
      } satisfies Omit<RoundInput, "correct">),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.gameId, opts.roundIndex, opts.totalRounds, opts.contentId, opts.roundId]
  );
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = React.useRef(opts.onAdvance);
  advanceRef.current = opts.onAdvance;
  const delayRef = React.useRef(opts.autoAdvanceMs);
  delayRef.current = opts.autoAdvanceMs;
  const retryRef = React.useRef(opts.advanceOnRetry ?? true);
  retryRef.current = opts.advanceOnRetry ?? true;

  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Fresh round (or unmount): drop pending timers, back to idle.
  React.useEffect(() => {
    transition.reset();
    setPhase("idle");
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setCountdown(null);
    };
  }, [transition]);

  const fireAdvance = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (transition.advance()) {
      setPhase("advancing");
      advanceRef.current();
      return true;
    }
    return false;
  }, [transition]);

  const submit = React.useCallback(
    (correct: boolean) => {
      const out = transition.begin(correct);
      if (!out.accepted || !out.result) return null;
      setPhase("feedback");
      const delay = delayRef.current;
      const retryOk = retryRef.current;
      if (delay !== null && (correct || retryOk)) {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (tickRef.current) clearInterval(tickRef.current);
        setCountdown(Math.ceil(delay / 1000));
        tickRef.current = setInterval(() => {
          setCountdown((c) => (c === null || c <= 1 ? 0 : c - 1));
        }, 1000);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }
          setCountdown(null);
          fireAdvance();
        }, Math.max(0, delay));
      }
      return out.result;
    },
    [transition, fireAdvance]
  );

  const reset = React.useCallback(() => {
    clearTimer();
    transition.reset();
    setPhase("idle");
  }, [transition, clearTimer]);

  return { phase, countdown, submit, advanceNow: fireAdvance, reset };
}
