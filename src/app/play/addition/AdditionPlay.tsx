"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { AdditionStage } from "@/components/child/AdditionStage";
import { AnswerButton } from "@/components/child/AnswerButton";
import { Celebration } from "@/components/child/Celebration";
import { additionGame, addHint, addInstruction } from "@/games/addition";
import { GAME_ROUNDS } from "@/games/framework";
import { toAdditionContent, type AdditionLike } from "@/lib/pool-client";
import { pickVisualTheme, themeById, themeNoun } from "@/lib/visualThemes";
import { GuideCard, StepperTrail, QuestFeedbackBar, ClueButton } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter, CHARACTER_VOICES } from "@/lib/audio";
import { additionStory, additionPraise, gentleRetry } from "@/lib/learningStories";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";

const COPY = {
  prompt: "COUNT THEM!",
  question: "How many altogether?",
  correct: "Great job!",
  retry: "Try again!",
} as const;

function teddyVoice(text: string) {
  const v = CHARACTER_VOICES.teddy ?? { rate: 0.85, pitch: 1.0 };
  speakWithCharacter(text, { lang: "en-US", rate: v.rate, pitch: v.pitch });
}

export default function AdditionPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  // Pool-first (BR-201): 5 validated rounds prefetched; deterministic local
  // top-up/fallback keeps gameplay instant and offline-capable (BR-200/222).
  // Rounds are shuffled per window (sessionStorage) so open windows never see identical games.
  const { rounds, reload, locked } = useGameRounds<AdditionLike>({
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
  const [hintOpen, setHintOpen] = React.useState(false);
  const [done, setDone] = React.useState(false);
  // Rounds with at least one wrong pick — for first-try accuracy reporting.
  const mistakeRounds = React.useRef<Set<number>>(new Set());
  const hintOpens = React.useRef(0);
  const gameStart = React.useRef(Date.now());

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
      teddyVoice(content ? additionPraise(content.a, content.b, content.objectType ?? "teddy") : COPY.correct);
      setTimeout(() => {
        if (round + 1 >= GAME_ROUNDS) {
          const r = award("addition", 3);
          setReward(r);
          setDone(true);
          queueEvent({ event: "game_completed", gameId: "addition", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
          const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - mistakeRounds.current.size) / GAME_ROUNDS));
          reportGameCompletion({ gameId: "addition", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji, hintsUsed: hintOpens.current, durationMs: Date.now() - gameStart.current });
        } else {
          setRound(round + 1);
          setPicked(null);
          setFeedback("idle");
          setHintOpen(false);
        }
      }, 900);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "addition", contentId });
      teddyVoice(gentleRetry("count"));
      setTimeout(() => {
        setPicked(null);
        setFeedback("idle");
        setHintOpen(false);
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
          character="teddy"
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

  if (locked) return <LockedAdventure title="Number Adventure" />;

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

  // Number Orchard: per-round visual theme from the pool (validated id) or
  // a deterministic fallback. Display-only — math never reads it (DEC-185).
  const theme = content.objectType
    ? themeById(content.objectType)
    : pickVisualTheme(contentId ?? `local:addition:${round}`, "addition");
  // Learning story (§3/§19): Teddy's tiny tale gives the numbers meaning.
  // Deterministic from (a, b, theme) — the math itself is untouched.
  const story = additionStory(content.a, content.b, theme.id, theme.emoji);
  const praise = additionPraise(content.a, content.b, theme.id);
  const retryLine = gentleRetry("count");
  const guideLine =
    feedback === "correct" ? praise : feedback === "retry" ? retryLine : story.setup;

  return (
    <GameShell title="Number Adventure" stars={totalStars}>
      <StepperTrail round={round} total={GAME_ROUNDS} />

      <div className="mt-2 flex flex-col items-center text-center">
        <GuideCard
          character="teddy"
          state={stateForMoment({ feedback })}
          name="TEDDY'S HINT 🧸"
          line={guideLine}
          listenLabel="Listen"
          listenAria="Teddy reads the story aloud"
          onListen={() => teddyVoice(story.voiceLine)}
        />
      </div>

      {/* Orchard stage (Stitch number-orchard): gradient grove card, branch
          count badges, glowing plus ring, and the countable groups. */}
      <div className="relative mt-3 w-full overflow-hidden rounded-3xl border-2 border-emerald-200/90 bg-gradient-to-b from-sky-100/90 via-amber-50/80 to-emerald-100/90 p-3 shadow-[0_8px_20px_rgba(16,185,129,0.18)]">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-[14px] font-black uppercase tracking-wider text-white shadow-[0_3px_0_#065f46]">
            🌳 {theme.emoji} {theme.label}
          </span>
        </div>
        <div role="group" aria-label={`${content.a} plus ${content.b}`} className="relative z-10 mt-2">
          <AdditionStage a={content.a} b={content.b} successTick={successTick} emoji={theme.emoji} />
          <div className="mt-2 flex items-center justify-center gap-3">
            <p
              className="rounded-full bg-red-500 px-4 py-1 text-headline-md font-black text-white shadow-[0_3px_0_#9f1239]"
              aria-label={`${content.a} ${themeNoun(theme.id, content.a)}`}
            >
              🌳 {content.a}
            </p>
            <span
              aria-hidden
              className="anim-glow flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 text-3xl font-black text-amber-950 shadow-[0_4px_0_#d97706]"
            >
              +
            </span>
            <p
              className="rounded-full bg-amber-500 px-4 py-1 text-headline-md font-black text-white shadow-[0_3px_0_#92400e]"
              aria-label={`${content.b} ${themeNoun(theme.id, content.b)}`}
            >
              ✨ {content.b}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col items-center justify-center text-center">
          <p className="rounded-full border border-emerald-200 bg-white/90 px-3.5 py-1 text-[15px] font-extrabold text-emerald-900 shadow-sm">
            ⬇ {story.question}
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-instruction">{content ? addInstruction(content.a, content.b) : COPY.question}</p>

      <div className="mt-2 flex justify-center">
        <ClueButton
          label="Need a Clue? 🧸"
          onClick={() => {
            setHintOpen(true);
            hintOpens.current += 1;
            queueEvent({ event: "hint_used", gameId: "addition", contentId });
          }}
        />
      </div>
      {hintOpen && content && (
        <div role="dialog" aria-label="Hint" className="safe-panel mx-auto mt-2 w-full max-w-md p-4">
          <p className="text-sm font-black text-on-surface">💡 Hint</p>
          <p className="mt-1 text-sm text-on-surface-variant">{addHint(content.a, content.b)}</p>
          <button
            type="button"
            onClick={() => setHintOpen(false)}
            aria-label="Close hint"
            className="tactile mt-3 min-h-12 w-full rounded-full bg-primary-container text-sm font-black text-white shadow-[0_4px_0_#004395]"
          >
            Got it!
          </button>
        </div>
      )}

       <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Answer choices">
        {content.answers.map((a) => (
          <AnswerButton
            key={a}
            value={a}
            onPick={pick}
            state={picked === a ? (additionGame.validate(content, a) ? "correct" : "incorrect") : "idle"}
          />
        ))}
      </div>

       <div className="mt-4" aria-live="polite">
         <QuestFeedbackBar
           title={feedback === "correct" ? `✨ ${COPY.correct}` : feedback === "retry" ? COPY.retry : "Tap the number that matches!"}
           hint={feedback === "retry" ? "Count them slowly with me!" : `Put them together: count ${content.a}… then ${content.b} more!`}
         />
       </div>
    </GameShell>
  );
}
