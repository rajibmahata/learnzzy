"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { SubtractionStage } from "@/components/child/SubtractionStage";
import { AnswerButton } from "@/components/child/AnswerButton";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
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
import { bumpGlobalLevel } from "@/lib/levelUp";
import { useRouter, useSearchParams } from "next/navigation";

export default function SubtractionPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLevel = React.useMemo(() => {
    const v = Number(searchParams.get("level"));
    return Number.isFinite(v) && v >= 1 && v <= 100 ? v : null;
  }, [searchParams]);
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [globalLevel, setGlobalLevel] = React.useState<number>(() => urlLevel ?? 1);
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
    if (urlLevel !== null) {
      setGlobalLevel(urlLevel);
      return;
    }
    const p = getCachedProfile();
    if (p && typeof p.level === "number") setGlobalLevel(Math.max(1, Math.min(100, p.level)));
  }, [urlLevel]);
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

  const handleContinueHarder = React.useCallback(() => {
    const next = bumpGlobalLevel(globalLevel, 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", String(next));
    router.push(`/play/subtraction?${params.toString()}`);
    mistakeRounds.current.clear();
    hintOpens.current = 0;
    gameStart.current = Date.now();
    setRound(0);
    setPicked(null);
    setFeedback("idle");
    setDone(false);
    setReward(null);
  }, [globalLevel, router, searchParams]);

  if (done) {
    const isTryAgain = mistakeRounds.current.size > 0;
    const continueLabel = isTryAgain ? "Continue — Try Harder 💪" : "Continue → Next Level";
    if (reward?.sticker) {
      return (
        <WorldReward
          sticker={reward.sticker}
          character="teddy"
          variantSeed={reward.sticker.id}
          continueLabel={continueLabel}
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
        <Celebration title={isTryAgain ? "Good try! Keep going!" : "AWESOME!"} stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} character="teddy" onReplay={() => { mistakeRounds.current.clear(); hintOpens.current = 0; gameStart.current = Date.now(); setRound(0); setPicked(null); setFeedback("idle"); setDone(false); setReward(null); reload(); }} />
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

  if (locked) return <LockedAdventure title="Fly Away" />;

  if (!content) {
    return (
    <GameShell title="Fly Away" stars={totalStars} progress={{ current: round + 1, total: GAME_ROUNDS }} level={globalLevel}>
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
      {/* Single authoritative progression: LEVEL + stepper — GameHeader already provides 🏠 Fly Away ⭐ 🔊 */}
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

      {/* Stitch Instruction Banner with Listen */}
      <div className="mt-2 flex items-center justify-between gap-2 bg-surface-container-lowest p-3 rounded-lg shadow-[0_4px_0_#e6eeff]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-inner">
            <span className="material-symbols-outlined text-[24px]">air</span>
          </div>
          <div>
            <p className="font-black text-base leading-none tracking-tight">WATCH THEM FLY!</p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Subtract by counting what stays</p>
          </div>
        </div>
        <button aria-label="Listen to instructions" className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_5px_0_#004395] active:translate-y-1 active:shadow-none transition-transform" onClick={() => teddyVoice(story.voiceLine)}>
          <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>volume_up</span>
        </button>
      </div>

      {/* Stitch Sunny Meadow with Branch and Birds — tactile meadow stage */}
      <div className="relative w-full mt-4 rounded-xl overflow-hidden shadow-[0_6px_0_#d5e3fc] bg-gradient-to-b from-primary-fixed via-surface-container-low to-surface-container p-4 select-none">
        <div className="absolute top-3 left-4 flex items-center gap-1 bg-surface-container-lowest/80 backdrop-blur-sm px-3 py-1 rounded-full text-primary shadow-sm">
          <span className="material-symbols-outlined text-[18px]">cloud</span>
          <span className="font-bold text-xs">Sunny Sky</span>
        </div>
        <div className="absolute top-2 left-2 bg-error-container text-on-error-container px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm text-xs font-black">↗ −{content.removed} Flew Away</div>
        <div className="absolute top-4 right-5 text-secondary-container opacity-60 animate-pulse">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>arrow_back_ios_new</span>
        </div>
        {/* Dashed flight trails */}
        <svg className="absolute inset-0 w-full h-56 pointer-events-none" fill="none" viewBox="0 0 320 90">
          <path d="M 120 70 C 160 50, 200 40, 260 20" opacity="0.35" stroke="#0058be" strokeDasharray="6 6" strokeLinecap="round" strokeWidth="3" />
          <path d="M 80 80 C 130 65, 180 50, 240 30" opacity="0.4" stroke="#fea619" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="2.5" />
        </svg>
        {/* Departing birds (animated) */}
        <div className="relative h-24 w-full flex flex-col justify-between mt-6">
          <div className="absolute top-0 right-12 flex flex-col items-center animate-bounce" style={{ animationDuration: "2.2s" } as React.CSSProperties}>
            <div className="bg-surface-container-lowest/90 px-2 py-0.5 rounded-full text-secondary text-[11px] shadow-sm mb-1 font-bold">Bye bye! 💨</div>
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-[0_3px_0_#855300] -rotate-12">
              <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>flutter</span>
            </div>
          </div>
          <div className="absolute top-6 right-28 flex flex-col items-center animate-bounce" style={{ animationDuration: "1.8s" } as React.CSSProperties}>
            <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_3px_0_#004395] -rotate-6">
              <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>flight</span>
            </div>
          </div>
        </div>
        {/* Wooden Perch & remaining birds */}
        <div className="relative w-full mt-2">
          <div className="flex items-end justify-start pl-2 gap-2 z-10 relative -mb-2">
            {Array.from({ length: remaining }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center group cursor-pointer active:scale-90 transition-transform">
                <span className="w-4 h-4 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-black flex items-center justify-center shadow-xs mb-1">{idx + 1}</span>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_0_#004395] ${idx % 2 === 0 ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container"}`}>
                  <span className="material-symbols-outlined text-[34px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>cruelty_free</span>
                </div>
              </div>
            ))}
            {remaining === 0 && <p className="text-sm font-bold ml-2">All flew away! ✨</p>}
            <div className="ml-auto mr-1 bg-surface-container-lowest/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-tertiary text-[18px]">favorite</span>
              <span className="font-black text-xs">Still Perched!</span>
            </div>
          </div>
          <div className="h-6 w-full rounded-full bg-secondary shadow-[0_4px_0_#653e00] flex items-center justify-between px-4 relative overflow-hidden mt-1">
            <div className="w-3 h-3 rounded-full bg-tertiary-container shadow-xs"></div>
            <div className="h-2 w-12 rounded-full bg-secondary-fixed/30"></div>
            <div className="w-4 h-4 rounded-full bg-tertiary-container shadow-xs"></div>
          </div>
        </div>
        {/* Fallback SubtractionStage for edge cases (hidden visually but keeps logic) */}
        <div className="sr-only" aria-hidden>
          <SubtractionStage start={content.start} removed={content.removed} successTick={successTick} emoji={theme.emoji} />
        </div>
      </div>

      {/* Stitch Subtraction Math Strip */}
      <div className="mt-4 bg-surface-container-low rounded-lg p-3 flex flex-col items-center text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[18px]">{content.start} Birds</span>
          <span className="font-black text-xl text-error">−</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-bold text-[18px]">{content.removed} Flew</span>
          <span className="font-black text-xl">=</span>
          <span className="w-9 h-9 rounded-full bg-surface-container-highest text-primary font-black text-[22px] flex items-center justify-center shadow-inner">?</span>
        </div>
        <p className="font-bold text-sm text-on-surface-variant mt-1.5">How many birds are left on the branch?</p>
      </div>

      <div className="mt-2 flex justify-center">
        <ClueButton label="Need a Clue? 🧸" onClick={() => { setHintOpen(true); hintOpens.current += 1; queueEvent({ event: "hint_used", gameId: "subtraction", contentId }); }} />
      </div>
      {hintOpen && (
        <div role="dialog" aria-label="Hint" className="safe-panel mx-auto mt-2 w-full max-w-md p-4">
          <p className="text-sm font-black text-on-surface">💡 Hint</p>
          <p className="mt-1 text-sm text-on-surface-variant">{subHint(content.start, content.removed)}</p>
          <button type="button" onClick={() => setHintOpen(false)} aria-label="Close hint" className="tactile mt-3 min-h-12 w-full rounded-full bg-primary-container text-sm font-black text-white shadow-[0_4px_0_#004395]">Got it!</button>
        </div>
      )}

      {/* Stitch tactile answer grid */}
      <div className="mt-3 grid grid-cols-4 gap-2.5 w-full" role="group" aria-label="Answer choices">
        {content.answers.map((a) => {
          const isPicked = picked === a;
          const isCorrect = subtractionGame.validate(content, a);
          const showCorrect = isPicked && isCorrect && feedback === "correct";
          const showWrong = isPicked && !isCorrect && feedback === "retry";
          return (
            <button key={a} onClick={() => pick(a)} className={`h-20 rounded-lg flex flex-col items-center justify-center shadow-[0_6px_0_#ccdbf3] active:translate-y-1.5 active:shadow-none transition-all ${showCorrect ? "bg-tertiary text-on-tertiary shadow-[0_6px_0_#005236]" : showWrong ? "bg-error-container text-on-error-container animate-pulse" : "bg-surface-container-lowest text-on-surface"}`}>
              <span className="font-black text-[22px]">{a}</span>
              <span className={`text-xs font-semibold ${showCorrect ? "text-on-tertiary" : "text-outline"}`}>birds</span>
            </button>
          );
        })}
      </div>

      {/* Encouragement footer + explicit Next to continue */}
      <div className="mt-4 bg-tertiary-fixed text-on-tertiary-fixed p-3 rounded-lg flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px]">touch_app</span>
          <span className="font-black text-sm">Count the birds still on the branch! 🐦</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-lowest/80 px-2.5 py-1 rounded-full text-tertiary font-black text-xs shadow-xs">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}>star</span> +1 Star
        </div>
      </div>

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
