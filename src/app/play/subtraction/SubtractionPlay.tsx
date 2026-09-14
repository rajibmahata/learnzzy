"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { SubtractionStage } from "@/components/child/SubtractionStage";
import { AnswerButton } from "@/components/child/AnswerButton";
import { Celebration } from "@/components/child/Celebration";
import { subtractionGame, type SubtractionContent } from "@/games/subtraction";
import { GAME_ROUNDS } from "@/games/framework";
import { toSubtractionContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";

export default function SubtractionPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  // Pool-first per-window shuffled — open windows never see identical subtraction sets.
  const { rounds, reload } = useGameRounds<SubtractionContent>({
    gameId: "subtraction",
    difficulty: 1,
    total: GAME_ROUNDS,
    mapItem: toSubtractionContent,
    makeLocal: (r) => subtractionGame.createRound({ difficulty: 1, round: r }),
  });
  const entry = rounds?.[round];
  const content = entry?.content;
  const contentId = entry?.contentId;
  const [picked, setPicked] = React.useState<number | null>(null);
  const [feedback, setFeedback] = React.useState<"idle" | "correct" | "retry">("idle");
  const [successTick, setSuccessTick] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const mistakeRounds = React.useRef<Set<number>>(new Set());

  const remaining = content ? content.start - content.removed : 0;

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "subtraction", metadata: { sessionId: getSessionId() } });
  }, []);

  React.useEffect(() => {
    if (rounds && !done) {
      queueEvent({ event: "question_shown", gameId: "subtraction", contentId, metadata: { round: round + 1 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, round, done]);

  function pick(v: number) {
    if (!content || feedback === "correct" || done) return;
    const ok = subtractionGame.validate(content, v);
    setPicked(v);
    queueEvent({ event: "answer_submitted", gameId: "subtraction", contentId, metadata: { answer: v, correct: ok } });
    if (ok) {
      setFeedback("correct");
      setSuccessTick((t) => t + 1);
      queueEvent({ event: "answer_correct", gameId: "subtraction", contentId });
      setTimeout(() => {
        if (round + 1 >= GAME_ROUNDS) {
          const r = award("subtraction", 3);
          setReward(r);
          setDone(true);
          queueEvent({ event: "game_completed", gameId: "subtraction", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
          const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - mistakeRounds.current.size) / GAME_ROUNDS));
          reportGameCompletion({ gameId: "subtraction", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji });
        } else {
          setRound(round + 1);
          setPicked(null);
          setFeedback("idle");
        }
      }, 900);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "subtraction", contentId });
      setTimeout(() => {
        setPicked(null);
        setFeedback("idle");
      }, 900);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="AWESOME!" stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} onReplay={() => { setRound(0); setPicked(null); setFeedback("idle"); setDone(false); setReward(null); reload(); }} />
      </div>
    );
  }

  if (!content) {
    return (
      <GameShell title="Fly Away" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">
            🌈
          </p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Fly Away" stars={totalStars}>
      <div className="mt-2 flex items-center justify-between rounded-full bg-surface-low px-3 py-1.5 text-xs font-bold uppercase">
        <span>Lesson {round + 1} • Subtraction</span>
        <span aria-label={`${content.removed} flew away`} className="rounded-full bg-error-container px-2 py-0.5 text-on-error-container">
          ↗ -{content.removed} Flew Away
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-gradient-to-b from-primary-fixed via-surface-low to-surface-container p-4 shadow-card">
        <p className="text-center text-headline-md font-extrabold">WATCH THEM FLY!</p>
        <p className="text-center text-sm text-on-surface-variant">Subtract by counting what stays</p>
        <div className="mt-2" aria-label={`${remaining} birds remaining out of ${content.start}`}>
          <SubtractionStage
            start={content.start}
            removed={content.removed}
            successTick={successTick}
          />
          {remaining === 0 ? (
            <p className="mt-2 text-center font-bold">All flew away! How many left?</p>
          ) : null}
        </div>
        <p className="mt-2 text-center text-sm font-bold">
          Started with {content.start} • {content.removed} flew away
        </p>
      </div>

      <p className="mt-3 text-center text-instruction">How many left?</p>

      <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Answer choices">
        {content.answers.map((a) => (
          <AnswerButton
            key={a}
            value={a}
            onPick={pick}
            state={picked === a ? (subtractionGame.validate(content, a) ? "correct" : "incorrect") : "idle"}
          />
        ))}
      </div>

      <p aria-live="polite" className="mt-3 min-h-[1.75rem] text-center text-lg font-bold">
        {feedback === "correct" ? "✨ Great job!" : feedback === "retry" ? "Try again!" : ""}
      </p>
    </GameShell>
  );
}
