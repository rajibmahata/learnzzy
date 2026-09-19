"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { SubtractionStage } from "@/components/child/SubtractionStage";
import { AnswerButton } from "@/components/child/AnswerButton";
import { Celebration } from "@/components/child/Celebration";
import { subtractionGame, subHint, subInstruction } from "@/games/subtraction";
import { GAME_ROUNDS } from "@/games/framework";
import { toSubtractionContent, type SubtractionLike } from "@/lib/pool-client";
import { pickVisualTheme, themeById, themeNoun } from "@/lib/visualThemes";
import { GuideCard, StepperTrail, QuestFeedbackBar, ClueButton } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter, CHARACTER_VOICES } from "@/lib/audio";
import { subtractionStory, subtractionPraise, gentleRetry } from "@/lib/learningStories";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";
import { getCachedProfile } from "@/lib/learner";

export default function SubtractionPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [globalLevel, setGlobalLevel] = React.useState(1);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const countdownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNextRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancelCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoNextRef.current) clearTimeout(autoNextRef.current);
    setCountdown(null);
  }
  function startCountdown(onDone: () => void) {
    setCountdown(10);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoNextRef.current) clearTimeout(autoNextRef.current);
    countdownRef.current = setInterval(() => setCountdown((c) => (c !== null && c > 0 ? c - 1 : 0)), 1000);
    autoNextRef.current = setTimeout(() => { if (countdownRef.current) clearInterval(countdownRef.current); setCountdown(null); onDone(); }, 10000);
  }
  React.useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); if (autoNextRef.current) clearTimeout(autoNextRef.current); }, []);
  React.useEffect(() => {
    const p = getCachedProfile();
    if (p && typeof p.level === "number") setGlobalLevel(Math.max(1, Math.min(6, p.level)));
  }, []);
  const difficulty = Math.max(1, Math.min(3, Math.ceil(globalLevel / 2))) as 1 | 2 | 3;
  // Pool-first per-window shuffled — open windows never see identical subtraction sets.
  const { rounds, reload, locked } = useGameRounds<SubtractionLike>({
    gameId: "subtraction",
    difficulty,
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
  const [hintOpen, setHintOpen] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const mistakeRounds = React.useRef<Set<number>>(new Set());
  const hintOpens = React.useRef(0);
  const gameStart = React.useRef(Date.now());

  const remaining = content ? content.start - content.removed : 0;

  function teddyVoice(text: string) {
    const v = CHARACTER_VOICES.teddy ?? { rate: 0.85, pitch: 1.0 };
    speakWithCharacter(text, { lang: "en-US", rate: v.rate, pitch: v.pitch });
  }

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "subtraction", metadata: { sessionId: getSessionId() } });
  }, []);

  React.useEffect(() => {
    if (rounds && !done) {
      queueEvent({ event: "question_shown", gameId: "subtraction", contentId, metadata: { round: round + 1 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, round, done]);

  function goNext() {
    cancelCountdown();
    if (round + 1 >= GAME_ROUNDS) {
      const r = award("subtraction", 3);
      setReward(r);
      setDone(true);
      queueEvent({ event: "game_completed", gameId: "subtraction", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
      const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - mistakeRounds.current.size) / GAME_ROUNDS));
      reportGameCompletion({ gameId: "subtraction", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji, hintsUsed: hintOpens.current, durationMs: Date.now() - gameStart.current });
    } else {
      setRound(round + 1);
      setPicked(null);
      setFeedback("idle");
      setHintOpen(false);
    }
  }

  function pick(v: number) {
    if (!content || feedback === "correct" || done) return;
    const ok = subtractionGame.validate(content, v);
    setPicked(v);
    queueEvent({ event: "answer_submitted", gameId: "subtraction", contentId, metadata: { answer: v, correct: ok } });
    if (ok) {
      setFeedback("correct");
      setSuccessTick((t) => t + 1);
      queueEvent({ event: "answer_correct", gameId: "subtraction", contentId });
      teddyVoice(subtractionPraise(content.start, content.removed, content.objectType ?? "teddy"));
      startCountdown(goNext);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "subtraction", contentId });
      teddyVoice(gentleRetry("look"));
      startCountdown(goNext);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="AWESOME!" stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} character="teddy" onReplay={() => { setRound(0); setPicked(null); setFeedback("idle"); setDone(false); setReward(null); reload(); }} />
      </div>
    );
  }

  if (locked) return <LockedAdventure title="Fly Away" />;

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

  // Breeze Valley: per-round visual theme from the pool (validated id) or a
  // deterministic fallback. Display-only — math never reads it (DEC-185).
  const theme = content.objectType
    ? themeById(content.objectType)
    : pickVisualTheme(contentId ?? `local:subtraction:${round}`, "counting");
  // Meadow story (Stitch breeze-valley): birds settle, some fly into puffy
  // clouds — how many stay? Deterministic; the math itself is untouched.
  const story = subtractionStory(content.start, content.removed, theme.id, theme.emoji);
  const praise = subtractionPraise(content.start, content.removed, theme.id);
  const retryLine = gentleRetry("look");
  const guideLine = feedback === "correct" ? praise : feedback === "retry" ? retryLine : story.setup;

  return (
    <GameShell title="Fly Away" stars={totalStars}>
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-black text-white shadow-[0_3px_0_#004395]">
          <span aria-hidden>🌟</span> LEVEL {globalLevel}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
          Fly Away • {globalLevel <= 2 ? "Building basics" : globalLevel <= 4 ? "Growing strong" : "Master explorer"}
        </span>
      </div>
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

      {/* Breeze Meadow stage (Stitch breeze-valley): sky gradient card,
          meadow badge, flew-away pill, and the countable birds. */}
      <div className="relative mt-3 w-full overflow-hidden rounded-3xl border-2 border-sky-200 bg-gradient-to-b from-[#d9f0ff] via-[#fff6f0] to-[#e8f5ff] p-3 shadow-[0_8px_20px_rgba(56,189,248,0.18)]">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-1.5 text-[14px] font-black uppercase tracking-wider text-white shadow-[0_3px_0_#075985]">
            🐦 {theme.emoji} Breeze Meadow
          </span>
        </div>
        <div className="mt-2 flex justify-center">
          <span aria-label={`${content.removed} flew away`} className="rounded-full bg-error-container px-3 py-1 text-xs font-black text-on-error-container shadow-sm">
            ↗ −{content.removed} Flew Away!
          </span>
        </div>
        <div className="mt-2" aria-label={`${remaining} ${themeNoun(theme.id, remaining)} remaining out of ${content.start}`}>
          <SubtractionStage
            start={content.start}
            removed={content.removed}
            successTick={successTick}
            emoji={theme.emoji}
          />
          {remaining === 0 ? (
            <p className="mt-2 text-center font-bold">All flew away! How many left?</p>
          ) : null}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm font-black">
          <span className="rounded-full bg-sky-500 px-3 py-1 text-white shadow-[0_3px_0_#075985]">
            🐦 {content.start} {themeNoun(theme.id, content.start)}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-sky-900 shadow-sm">
            Still Perched: {remaining}
          </span>
        </div>
        <div className="mt-3 flex flex-col items-center justify-center text-center">
          <p className="rounded-full border border-sky-200 bg-white/90 px-3.5 py-1 text-[15px] font-extrabold text-sky-900 shadow-sm">
            ⬇ {story.question}
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-instruction">{subInstruction(content.start, content.removed)}</p>

      <div className="mt-2 flex justify-center">
        <ClueButton
          label="Need a Clue? 🧸"
          onClick={() => {
            setHintOpen(true);
            hintOpens.current += 1;
            queueEvent({ event: "hint_used", gameId: "subtraction", contentId });
          }}
        />
      </div>
      {hintOpen && (
        <div role="dialog" aria-label="Hint" className="safe-panel mx-auto mt-2 w-full max-w-md p-4">
          <p className="text-sm font-black text-on-surface">💡 Hint</p>
          <p className="mt-1 text-sm text-on-surface-variant">{subHint(content.start, content.removed)}</p>
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
            state={picked === a ? (subtractionGame.validate(content, a) ? "correct" : "incorrect") : "idle"}
          />
        ))}
      </div>

       <div className="mt-4" aria-live="polite">
          <QuestFeedbackBar
            title={feedback === "correct" ? "✨ Great job!" : feedback === "retry" ? "😢 Try again — Let's look again!" : "Count the birds still on the branch!"}
            hint={feedback === "retry" ? "Take your time. Look carefully — you can do it!" : `Take away: start at ${content.start}, ${content.removed} flew!`}
          />
          {feedback !== "idle" && countdown !== null && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/60">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(countdown / 10) * 100}%` }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant">Next in {countdown}s</span>
                <button type="button" onClick={goNext} className="rounded-full bg-primary px-4 py-1 text-xs font-black text-white shadow-[0_2px_0_#004395]">Next →</button>
              </div>
            </div>
          )}
        </div>
    </GameShell>
  );
}
