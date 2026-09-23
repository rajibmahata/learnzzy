"use client";
import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
import { BalloonAnimalStage } from "@/components/child/BalloonAnimalStage";
import { GuideCard } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter } from "@/lib/audio";
import { createBalloonAnimalRound, validateBalloonAnimal } from "@/games/balloonAnimal";
import { GAME_ROUNDS } from "@/games/framework";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { getCachedProfile } from "@/lib/learner";
import { bumpGlobalLevel } from "@/lib/levelUp";
import { normalizeAgeBand } from "@/lib/complexity";

export default function BalloonAnimalsPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [done, setDone] = React.useState(false);
  const [feedback, setFeedback] = React.useState<"idle" | "correct" | "retry">("idle");
  const [poppedIds, setPoppedIds] = React.useState<Set<string>>(new Set());
  const [showWord, setShowWord] = React.useState<string | null>(null);
  const mistakeRounds = React.useRef<Set<number>>(new Set());
  const gameStart = React.useRef(Date.now());
  const profile = getCachedProfile();
  const ageBand = normalizeAgeBand(profile?.ageBand);
  const globalLevel = Math.max(1, Math.min(100, profile?.level ?? 1));
  // Nonce re-derives rounds after a level-up without window.location.reload().
  const [nonce, setNonce] = React.useState(0);

  const rounds = React.useMemo(() => {
    const seed = `${profile?.learnerId ?? "guest"}-${globalLevel}-${ageBand}-animal-${nonce}`;
    return Array.from({ length: GAME_ROUNDS }, (_, i) => createBalloonAnimalRound(seed, ageBand, i));
  }, [ageBand, globalLevel, profile?.learnerId, nonce]);

  const current = rounds[round];
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(null);
  }
  function startCountdown(next: () => void) {
    setCountdown(6);
    intervalRef.current = setInterval(() => setCountdown((c) => (c !== null && c > 0 ? c - 1 : 0)), 1000);
    timerRef.current = setTimeout(() => { cancel(); next(); }, 6000);
  }
  React.useEffect(() => () => cancel(), []);
  React.useEffect(() => { queueEvent({ event: "game_started", gameId: "balloon-animals", metadata: { sessionId: getSessionId() } }); }, []);

  function goNext() {
    cancel();
    setShowWord(null);
    if (round + 1 >= GAME_ROUNDS) {
      const r = award("balloon-animals", 3);
      setReward(r);
      setDone(true);
      queueEvent({ event: "game_completed", gameId: "balloon-animals", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
      const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - mistakeRounds.current.size) / GAME_ROUNDS));
      reportGameCompletion({ gameId: "balloon-animals", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji, durationMs: Date.now() - gameStart.current });
    } else {
      setRound((r) => r + 1);
      setFeedback("idle");
      setPoppedIds(new Set());
    }
  }

  function onPop(b: import("@/lib/balloonMechanic").Balloon) {
    if (!current || feedback === "correct" || done) return;
    const ok = validateBalloonAnimal(current, b.payload);
    setPoppedIds((prev) => new Set(prev).add(b.id));
    queueEvent({ event: "answer_submitted", gameId: "balloon-animals", contentId: b.id, metadata: { payload: b.payload, correct: ok } });
    if (ok) {
      setFeedback("correct");
      setShowWord(current.targetWord);
      queueEvent({ event: "answer_correct", gameId: "balloon-animals", contentId: b.payload });
      speakWithCharacter(`Yes! Cat burst! C-A-T spells CAT!`, { lang: "en-US", rate: 1.1, pitch: 1.18, characterId: "panda" });
      startCountdown(goNext);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "balloon-animals", contentId: b.payload });
      speakWithCharacter(`Try again! Find the cat 🐱!`, { lang: "en-US", rate: 1.0, pitch: 1.1, characterId: "panda" });
      setTimeout(() => setFeedback("idle"), 900);
      setPoppedIds((prev) => {
        const next = new Set(prev);
        next.delete(b.id);
        return next;
      });
    }
  }

  if (done) {
    const isTryAgain = mistakeRounds.current.size > 0;
    if (reward?.sticker) return <WorldReward sticker={reward.sticker} character="panda" variantSeed={reward.sticker.id} continueLabel={isTryAgain ? "Continue — Try Harder 💪" : "Continue → Next Level"} onReplay={() => { mistakeRounds.current.clear(); gameStart.current = Date.now(); setRound(0); setFeedback("idle"); setDone(false); setReward(null); setPoppedIds(new Set()); setShowWord(null); }} onContinue={() => { bumpGlobalLevel(globalLevel, 1); mistakeRounds.current.clear(); gameStart.current = Date.now(); setRound(0); setFeedback("idle"); setDone(false); setReward(null); setPoppedIds(new Set()); setShowWord(null); setNonce((n) => n + 1); }} />;
    return <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4"><Celebration title={isTryAgain ? "Good try!" : "AMAZING!"} stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} character="panda" onReplay={() => { setRound(0); setFeedback("idle"); setDone(false); setReward(null); setPoppedIds(new Set()); }} /></div>;
  }
  if (!current) return <GameShell title="Balloon Burst — Animals" stars={totalStars}><div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status"><p className="text-5xl">🌈</p><p className="mt-3 text-instruction">Getting balloons ready…</p></div></GameShell>;

  const guideLine = feedback === "correct" ? `✨ ${current.targetWord} — C-A-T! Cat burst!` : feedback === "retry" ? `Find the cat 🐱! Tap its balloon!` : `Find the cat! Pop the 🐱 balloon and learn C-A-T!`;

  return (
    <GameShell title="Balloon Burst — Animals" stars={totalStars} progress={{ current: round + 1, total: GAME_ROUNDS }} level={globalLevel}>
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-white shadow-[0_3px_0_#004395]">LEVEL {globalLevel}</span>
        <span className="text-xs font-bold text-on-surface-variant">Round {round + 1} of {GAME_ROUNDS} • {ageBand}</span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {Array.from({ length: GAME_ROUNDS }).map((_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-full ${i < round ? "bg-tertiary" : i === round ? "bg-primary" : "bg-surface-container-high"}`} />
        ))}
      </div>
      <div className="mt-2">
        <GuideCard character="panda" state={stateForMoment({ feedback })} name="PANDA 🐼" line={guideLine} listenLabel="Listen" onListen={() => speakWithCharacter(`Find the cat! C-A-T spells CAT!`, { lang: "en-US", rate: 1.1, pitch: 1.18, characterId: "panda" })} />
      </div>
      <div className="mt-3 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-6 py-2 shadow-[0_3px_0_#adc6ff]">
          <span className="text-2xl">🐱</span>
          <span className="font-black text-primary text-lg">Find CAT!</span>
          <span className="text-xs font-bold opacity-60">C-A-T</span>
        </div>
      </div>
      <div className="mt-3">
        <BalloonAnimalStage balloons={current.balloons} poppedIds={poppedIds} onPop={onPop} />
      </div>
      {showWord && (
        <div className="mt-3 rounded-2xl bg-tertiary-fixed/20 border-2 border-tertiary p-3 text-center animate-bounce">
          <p className="text-2xl font-black tracking-widest text-tertiary">C - A - T</p>
          <p className="font-black text-lg">CAT 🐱 Burst!</p>
          <p className="text-xs font-bold text-on-surface-variant">You learned the word CAT!</p>
        </div>
      )}
      <p className="mt-2 text-center text-sm font-bold text-on-surface-variant">Tap the 🐱 balloon to burst and learn CAT!</p>
      {feedback === "correct" && (
        <div className="mt-3 rounded-2xl bg-tertiary-fixed/30 border border-tertiary p-3 text-center">
          <p className="font-black text-tertiary">✨ CAT burst! You learned C-A-T!</p>
          <div className="mt-2 h-2 w-full max-w-xs mx-auto overflow-hidden rounded-full bg-white/60">
            <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: `${(countdown ?? 6) / 6 * 100}%` }} />
          </div>
          <button type="button" onClick={goNext} className="mt-2 w-full h-12 rounded-full bg-tertiary text-on-tertiary font-black shadow-[0_4px_0_#005236]">Next Level →</button>
        </div>
      )}
      {feedback === "retry" && (
        <div className="mt-3 rounded-2xl bg-error-container/40 border border-error p-3 text-center">
          <p className="font-bold text-on-error-container">Try again! Find the cat 🐱 balloon!</p>
        </div>
      )}
    </GameShell>
  );
}
