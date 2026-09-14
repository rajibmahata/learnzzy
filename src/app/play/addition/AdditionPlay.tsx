"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { AdditionStage } from "@/components/child/AdditionStage";
import { AnswerButton } from "@/components/child/AnswerButton";
import { Celebration } from "@/components/child/Celebration";
import { additionGame, type AdditionContent } from "@/games/addition";
import { GAME_ROUNDS } from "@/games/framework";
import { toAdditionContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";

const COPY = {
  prompt: "COUNT THEM!",
  question: "How many altogether?",
  correct: "Great job!",
  retry: "Try again!",
} as const;

export default function AdditionPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  // Pool-first (BR-201): 5 validated rounds prefetched; deterministic local
  // top-up/fallback keeps gameplay instant and offline-capable (BR-200/222).
  // Rounds are shuffled per window (sessionStorage) so open windows never see identical games.
  const { rounds, reload } = useGameRounds<AdditionContent>({
    gameId: "addition",
    difficulty: 1,
    total: GAME_ROUNDS,
    mapItem: toAdditionContent,
    makeLocal: (r) => additionGame.createRound({ difficulty: 1, round: r }),
  });
  const entry = rounds?.[round];
  const content = entry?.content;
  const contentId = entry?.contentId;
  const [picked, setPicked] = React.useState<number | null>(null);
  const [feedback, setFeedback] = React.useState<"idle" | "correct" | "retry">("idle");
  const [successTick, setSuccessTick] = React.useState(0);
  const [done, setDone] = React.useState(false);
  // Rounds with at least one wrong pick — for first-try accuracy reporting.
  const mistakeRounds = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "addition", metadata: { sessionId: getSessionId() } });
  }, []);

  React.useEffect(() => {
    if (rounds && !done) {
      queueEvent({ event: "question_shown", gameId: "addition", contentId, metadata: { round: round + 1 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, round, done]);

  function pick(v: number) {
    if (!content || feedback === "correct" || done) return;
    const ok = additionGame.validate(content, v);
    setPicked(v);
    queueEvent({ event: "answer_submitted", gameId: "addition", contentId, metadata: { answer: v, correct: ok } });
    if (ok) {
      setFeedback("correct");
      setSuccessTick((t) => t + 1);
      queueEvent({ event: "answer_correct", gameId: "addition", contentId });
      setTimeout(() => {
        if (round + 1 >= GAME_ROUNDS) {
          const r = award("addition", 3);
          setReward(r);
          setDone(true);
          queueEvent({ event: "game_completed", gameId: "addition", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
          const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - mistakeRounds.current.size) / GAME_ROUNDS));
          reportGameCompletion({ gameId: "addition", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji });
        } else {
          setRound(round + 1);
          setPicked(null);
          setFeedback("idle");
        }
      }, 900);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "addition", contentId });
      setTimeout(() => {
        setPicked(null);
        setFeedback("idle");
      }, 900);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration
          title="AWESOME!"
          stars={reward?.stars ?? 3}
          sticker={reward?.sticker ?? null}
          onReplay={() => {
            setRound(0);
            setPicked(null);
            setFeedback("idle");
            setDone(false);
            setReward(null);
            reload();
          }}
        />
      </div>
    );
  }

  if (!content) {
    return (
      <GameShell title="Number Adventure" stars={totalStars}>
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
    <GameShell title="Number Adventure" stars={totalStars}>
      <div className="mt-2 flex items-center justify-center gap-3" aria-label={`Round ${round + 1} of ${GAME_ROUNDS}`}>
        {Array.from({ length: GAME_ROUNDS }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-6 w-6 rounded-full border-2 border-stroke ${i < round ? "bg-mint" : i === round ? "bg-sky" : "bg-surface-highest"}`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-col items-center text-center">
        <h2 className="rounded-full bg-primary-fixed px-5 py-2 text-instruction uppercase tracking-wide text-on-primary-fixed">
          📣 {COPY.prompt}
        </h2>
      </div>

      <div role="group" aria-label={`${content.a} plus ${content.b}`}>
        <AdditionStage a={content.a} b={content.b} successTick={successTick} />
        <div className="mt-2 flex items-center justify-center gap-3">
          <p
            className="rounded-full bg-surface-container px-4 py-1 text-headline-md font-black text-primary"
            aria-label={`${content.a} apples`}
          >
            {content.a}
          </p>
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-3xl font-black text-on-secondary-fixed shadow-[0_4px_0_#ffb95f]"
          >
            +
          </span>
          <p
            className="rounded-full bg-surface-container px-4 py-1 text-headline-md font-black text-primary"
            aria-label={`${content.b} apples`}
          >
            {content.b}
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-instruction">{COPY.question}</p>

      <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Answer choices">
        {content.answers.map((a) => (
          <AnswerButton
            key={a}
            value={a}
            onPick={pick}
            state={picked === a ? (additionGame.validate(content, a) ? "correct" : "incorrect") : "idle"}
          />
        ))}
      </div>

      <p aria-live="polite" className="mt-3 min-h-[1.75rem] text-center text-lg font-bold">
        {feedback === "correct" ? `✨ ${COPY.correct}` : feedback === "retry" ? COPY.retry : ""}
      </p>
    </GameShell>
  );
}
