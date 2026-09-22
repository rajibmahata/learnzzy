"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { AdditionStage } from "@/components/child/AdditionStage";
import { AnswerButton } from "@/components/child/AnswerButton";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
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
import { getCachedProfile } from "@/lib/learner";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLevel = React.useMemo(() => {
    const v = Number(searchParams.get("level"));
    return Number.isFinite(v) && v >= 1 && v <= 100 ? v : null;
  }, [searchParams]);
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  // Global Level — single journey level, visible on every exercise
  // REST ?level=1 overrides profile for direct linking; otherwise profile level.
  const [globalLevel, setGlobalLevel] = React.useState<number>(() => urlLevel ?? 1);
  React.useEffect(() => {
    if (urlLevel !== null) {
      setGlobalLevel(urlLevel);
      return;
    }
    const p = getCachedProfile();
    if (p && typeof p.level === "number") setGlobalLevel(Math.max(1, Math.min(100, p.level)));
  }, [urlLevel]);
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
  // Pool-first (BR-201): 5 validated rounds prefetched; deterministic local
  // top-up/fallback keeps gameplay instant and offline-capable (BR-200/222).
  // Rounds are shuffled per window (sessionStorage) so open windows never see identical games.
  // Difficulty now derived from GLOBAL level (age-appropriate range) — not fixed 1.
  const difficulty = Math.max(1, Math.min(3, Math.ceil(globalLevel / 2))) as 1 | 2 | 3;
  const { rounds, reload, locked } = useGameRounds<AdditionLike>({
    gameId: "addition",
    difficulty,
    total: GAME_ROUNDS,
    mapItem: toAdditionContent,
    makeLocal: (r) => additionGame.createRound({ difficulty, round: r }),
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

  function goNext() {
    cancelCountdown();
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
  }

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
      startCountdown(goNext);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "addition", contentId });
      teddyVoice(gentleRetry("count"));
      startCountdown(goNext);
    }
  }

  const handleContinueHarder = React.useCallback(() => {
    // Continue → next level, harder: bump GLOBAL level and navigate via REST ?level=
    // so /play/addition?level=1 → Continue → /play/addition?level=2 and difficulty increases.
    const next = Math.min(100, globalLevel + 1);
    try {
      const raw = localStorage.getItem("learnzzy.learner.v1");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p.level === "number") {
          localStorage.setItem("learnzzy.learner.v1", JSON.stringify({ ...p, level: next }));
        }
      }
      localStorage.setItem("learnzzy.globalLevel.v1", String(next));
    } catch {}
    // Reset transient state before navigation
    mistakeRounds.current.clear();
    hintOpens.current = 0;
    gameStart.current = Date.now();
    // REST navigation — validated by typecheck, preserves learner isolation
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", String(next));
    router.push(`/play/addition?${params.toString()}`);
    // Fallback local reset if router is same level (e.g. level 6 cap)
    setRound(0);
    setPicked(null);
    setFeedback("idle");
    setDone(false);
    setReward(null);
  }, [globalLevel, reload, router, searchParams]);

  if (done) {
    const isTryAgain = mistakeRounds.current.size > 0;
    const continueLabel = isTryAgain ? "Continue — Try Harder 💪" : "Continue → Next Level";
    if (reward?.sticker) {
      return (
        <WorldReward
          sticker={reward.sticker}
          character="teddy"
          variantSeed={reward.sticker.id}
          continueLabel={isTryAgain ? "Continue — Try Harder 💪" : "Continue → Next Level"}
          onReplay={() => {
            mistakeRounds.current.clear();
            hintOpens.current = 0;
            gameStart.current = Date.now();
            setRound(0);
            setPicked(null);
            setFeedback("idle");
            setDone(false);
            setReward(null);
            reload();
          }}
          onContinue={handleContinueHarder}
        />
      );
    }
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration
          title={isTryAgain ? "Good try! Keep going!" : "AWESOME!"}
          stars={reward?.stars ?? 3}
          sticker={reward?.sticker ?? null}
          character="teddy"
          onReplay={() => {
            mistakeRounds.current.clear();
            hintOpens.current = 0;
            gameStart.current = Date.now();
            setRound(0);
            setPicked(null);
            setFeedback("idle");
            setDone(false);
            setReward(null);
            reload();
          }}
        />
        {/* Explicit Continue on Try Again — harder next level */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <button type="button" onClick={handleContinueHarder} className="w-full h-14 rounded-full bg-primary text-on-primary font-black text-base shadow-[0_5px_0_#004395] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
            <span>{continueLabel}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <p className="text-center text-xs font-bold text-on-surface-variant mt-2">LEVEL {globalLevel} → {Math.min(100, globalLevel + 1)} • Harder!</p>
        </div>
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
      {/* Single authoritative progression: LEVEL + stepper — GameHeader already provides 🏠 Number Adventure ⭐ 🔊 */}
      <div className="flex flex-col items-center gap-1 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-black text-white shadow-[0_3px_0_#004395]">
          <span aria-hidden>⭐</span> LEVEL {globalLevel}
        </span>
        <div className="flex items-center justify-center gap-3" aria-label={`Round ${round + 1} of ${GAME_ROUNDS}`}>
          {Array.from({ length: GAME_ROUNDS }).map((_, i) => {
            if (i < round) return <div key={i} className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container shadow-[0_3px_0_#005236]" aria-hidden><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>check</span></div>;
            if (i === round) return <div key={i} className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-[0_4px_0_#004395] scale-105 font-black text-sm" aria-current="step">{i + 1}</div>;
            if (i === round + 1) return <div key={i} className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant opacity-70 font-bold text-sm">{i + 1}</div>;
            return <div key={i} className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant opacity-70" aria-hidden><span className="material-symbols-outlined text-[16px]">lock</span></div>;
          })}
        </div>
      </div>

      <div className="mt-1 flex flex-col items-center text-center">
        <GuideCard character="teddy" state={stateForMoment({ feedback })} name="TEDDY'S HINT 🧸" line={guideLine} listenLabel="Listen" listenAria="Teddy reads the story aloud" onListen={() => teddyVoice(story.voiceLine)} />
      </div>

      {/* Stitch Single-Task Prompt Box + Read aloud */}
      <div className="flex flex-col items-center justify-center mt-2 mb-3 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-fixed px-5 py-2 rounded-full shadow-[0_3px_0_#adc6ff]">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>campaign</span>
          <h2 className="font-black tracking-wide uppercase text-on-primary-fixed text-lg">COUNT THEM!</h2>
        </div>
        <button className="mt-2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest text-primary shadow-[0_3px_0_#d5e3fc] active:translate-y-0.5 active:shadow-none transition-all text-sm font-bold" onClick={() => teddyVoice(story.voiceLine)}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>volume_up</span> Read aloud
        </button>
      </div>

      {/* Correct addition expression: OperandCard + PlusOperator + OperandCard — single plus, no plus inside operands */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full" role="group" aria-label={`${content.a} plus ${content.b} equals question`}>
        {/* OperandCard — left */}
        <div className="flex-1 w-full sm:w-auto flex flex-col items-center bg-surface-container-lowest p-3 rounded-lg shadow-[0_6px_0_#d5e3fc] border border-surface-container-high">
          <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[96px] w-full" aria-hidden>
            {Array.from({ length: Math.max(0, Math.min(20, content.a)) }).map((_, i) => (
              <span key={i} aria-hidden className="text-2xl leading-none select-none">{theme.emoji}</span>
            ))}
          </div>
          <span className="mt-2 inline-flex items-center justify-center min-w-[3rem] px-4 py-1 rounded-full bg-surface-container text-primary font-black shadow-[0_2px_0_#adc6ff]" aria-label={`${content.a} ${themeNoun(theme.id, content.a)}`}>
            {content.a}
          </span>
        </div>

        {/* PlusOperator — single, central, non-interactive, prominent */}
        <div className="flex items-center justify-center shrink-0 my-1 sm:my-0" aria-hidden>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-3xl font-black shadow-[0_4px_0_#ffb95f] select-none">
            +
          </span>
        </div>

        {/* OperandCard — right */}
        <div className="flex-1 w-full sm:w-auto flex flex-col items-center bg-surface-container-lowest p-3 rounded-lg shadow-[0_6px_0_#d5e3fc] border border-surface-container-high">
          <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[96px] w-full" aria-hidden>
            {Array.from({ length: Math.max(0, Math.min(20, content.b)) }).map((_, i) => (
              <span key={i} aria-hidden className="text-2xl leading-none select-none">{theme.emoji}</span>
            ))}
          </div>
          <span className="mt-2 inline-flex items-center justify-center min-w-[3rem] px-4 py-1 rounded-full bg-surface-container text-primary font-black shadow-[0_2px_0_#adc6ff]" aria-label={`${content.b} ${themeNoun(theme.id, content.b)}`}>
            {content.b}
          </span>
        </div>
      </div>
      {/* Decorative Phaser success animation — hidden from semantics, kept for existing celebratory motion without duplicating plus */}
      <div aria-hidden className="sr-only">
        <AdditionStage a={content.a} b={content.b} successTick={successTick} emoji={theme.emoji} />
      </div>

      <div className="flex flex-col items-center justify-center my-3 text-center">
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-1 shadow-[0_3px_0_#adc6ff] animate-bounce">
          <span className="material-symbols-outlined text-[24px]">arrow_downward</span>
        </div>
        <p className="font-bold text-xl tracking-tight">{COPY.question}</p>
      </div>

      <div className="mt-1 flex justify-center">
        <ClueButton label="Need a Clue? 🧸" onClick={() => { setHintOpen(true); hintOpens.current += 1; queueEvent({ event: "hint_used", gameId: "addition", contentId }); }} />
      </div>
      {hintOpen && content && (
        <div role="dialog" aria-label="Hint" className="safe-panel mx-auto mt-2 w-full max-w-md p-4">
          <p className="text-sm font-black text-on-surface">💡 Hint</p>
          <p className="mt-1 text-sm text-on-surface-variant">{addHint(content.a, content.b)}</p>
          <button type="button" onClick={() => setHintOpen(false)} aria-label="Close hint" className="tactile mt-3 min-h-12 w-full rounded-full bg-primary-container text-sm font-black text-white shadow-[0_4px_0_#004395]">Got it!</button>
        </div>
      )}

      {/* Stitch tactile answer grid — 4 pads >=72px, tertiary highlight for chosen */}
      <div className="mt-3 grid grid-cols-4 gap-2 w-full" role="group" aria-label="Answer choices">
        {content.answers.map((a) => {
          const isPicked = picked === a;
          const isCorrect = additionGame.validate(content, a);
          const showCorrect = isPicked && isCorrect && feedback === "correct";
          const showWrong = isPicked && !isCorrect && feedback === "retry";
          return (
            <button
              key={a}
              onClick={() => pick(a)}
              aria-label={`Answer ${a}`}
              className={`h-20 min-h-[72px] rounded-lg font-black text-[22px] flex items-center justify-center shadow-[0_6px_0_#d5e3fc] active:translate-y-1.5 active:shadow-none transition-all ${showCorrect ? "bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_6px_0_#00855b] scale-[1.02]" : showWrong ? "bg-error-container text-on-error-container" : "bg-surface-container-lowest text-on-surface"}`}
            >
              {a}
            </button>
          );
        })}
      </div>

      {/* Stitch feedback bar + explicit Next to continue */}
      <div className="flex items-center justify-between w-full bg-surface-container px-4 py-3 rounded-lg shadow-[0_4px_0_#d5e3fc] mt-3" id="feedbackBar">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-[0_2px_0_#ffb95f]">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>lightbulb</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm" id="feedbackText">{feedback === "correct" ? `✨ ${COPY.correct}` : feedback === "retry" ? `😢 ${COPY.retry}` : "Tap the number that matches!"}</span>
            <span className="text-xs text-on-surface-variant font-medium">{feedback === "retry" ? "Take your time. Look carefully!" : `Count: ${content.a}… then ${content.b} more!`}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-[0_3px_0_#ffb95f]">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>star</span>
        </div>
      </div>

      {/* Prominent Next to continue next level — Stitch tactile primary */}
      {feedback !== "idle" && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="h-2 w-full max-w-xs mx-auto overflow-hidden rounded-full bg-white/60">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: countdown !== null ? `${(countdown / 10) * 100}%` : "100%" }} />
          </div>
          <button type="button" onClick={goNext} className="w-full h-14 rounded-full bg-primary text-on-primary font-black text-base shadow-[0_5px_0_#004395] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
            <span>{round + 1 >= GAME_ROUNDS ? "Complete Level 🎉" : "Next Level "}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            {countdown !== null && <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{countdown}s</span>}
          </button>
          <p className="text-center text-xs font-bold text-on-surface-variant">LEVEL {globalLevel} • Round {round + 1} of {GAME_ROUNDS}</p>
        </div>
      )}
    </GameShell>
  );
}
