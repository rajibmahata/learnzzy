"use client";
import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
import { BalloonLetterStage } from "@/components/child/BalloonLetterStage";
import { GuideCard } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter } from "@/lib/audio";
import { createBalloonLetterRound, validateBalloonLetter } from "@/games/balloonLetter";
import { GAME_ROUNDS } from "@/games/framework";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";
import { getCachedProfile } from "@/lib/learner";
import { normalizeAgeBand } from "@/lib/complexity";

export default function BalloonWordsPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [done, setDone] = React.useState(false);
  const [feedback, setFeedback] = React.useState<"idle" | "correct" | "retry">("idle");
  const [poppedIds, setPoppedIds] = React.useState<Set<string>>(new Set());
  const [locked, setLocked] = React.useState(false);
  const mistakeRounds = React.useRef<Set<number>>(new Set());
  const gameStart = React.useRef(Date.now());
  const profile = getCachedProfile();
  const ageBand = normalizeAgeBand(profile?.ageBand);
  const globalLevel = Math.max(1, Math.min(100, profile?.level ?? 1));

  const rounds = React.useMemo(() => {
    const seed = `${profile?.learnerId ?? "guest"}-${globalLevel}-${ageBand}`;
    return Array.from({ length: GAME_ROUNDS }, (_, i) => createBalloonLetterRound(seed, ageBand, i));
  }, [ageBand, globalLevel, profile?.learnerId]);

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

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "balloon-words", metadata: { sessionId: getSessionId() } });
  }, []);

  function goNext() {
    cancel();
    if (round + 1 >= GAME_ROUNDS) {
      const r = award("balloon-words", 3);
      setReward(r);
      setDone(true);
      queueEvent({ event: "game_completed", gameId: "balloon-words", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
      const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - mistakeRounds.current.size) / GAME_ROUNDS));
      reportGameCompletion({ gameId: "balloon-words", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji, durationMs: Date.now() - gameStart.current });
    } else {
      setRound((r) => r + 1);
      setFeedback("idle");
      setPoppedIds(new Set());
    }
  }

  function onPopBalloon(b: import("@/lib/balloonMechanic").Balloon) {
    if (!current || feedback === "correct" || done) return;
    const ok = validateBalloonLetter(current, b.payload);
    setPoppedIds((prev) => new Set(prev).add(b.id));
    queueEvent({ event: "answer_submitted", gameId: "balloon-words", contentId: b.id, metadata: { payload: b.payload, correct: ok } });
    if (ok) {
      setFeedback("correct");
      queueEvent({ event: "answer_correct", gameId: "balloon-words", contentId: b.payload });
      speakWithCharacter(`Yes! ${b.payload} burst!`, { lang: "en-US", rate: 1.1, pitch: 1.18, characterId: "bunny" });
      startCountdown(goNext);
    } else {
      setFeedback("retry");
      mistakeRounds.current.add(round);
      queueEvent({ event: "answer_incorrect", gameId: "balloon-words", contentId: b.payload });
      speakWithCharacter(`Try again! Find ${current.targetLetter}!`, { lang: "en-US", rate: 1.0, pitch: 1.1, characterId: "bunny" });
      // gentle shake, stay on same round, allow retry — not auto-next on wrong
      setTimeout(() => setFeedback("idle"), 900);
      // don't auto-advance on wrong; child must find correct
      setPoppedIds((prev) => {
        const next = new Set(prev);
        next.delete(b.id);
        return next;
      });
    }
  }

  // Keyboard typing support — type the letter to pop
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || feedback === "correct" || !current) return;
      const key = e.key.toUpperCase();
      if (key.length !== 1 || key < "A" || key > "Z") return;
      const target = current.balloons.find((b) => b.payload.toUpperCase() === key && !poppedIds.has(b.id));
      if (target) onPopBalloon(target);
      else if (key === current.targetLetter) {
        const correct = current.balloons.find((b) => b.payload.toUpperCase() === current.targetLetter && !poppedIds.has(b.id));
        if (correct) onPopBalloon(correct);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, feedback, current, poppedIds]);

  if (done) {
    const isTryAgain = mistakeRounds.current.size > 0;
    if (reward?.sticker) {
      return (
        <WorldReward
          sticker={reward.sticker}
          character="bunny"
          variantSeed={reward.sticker.id}
          continueLabel={isTryAgain ? "Continue — Try Harder 💪" : "Continue → Next Level"}
          onReplay={() => {
            mistakeRounds.current.clear();
            gameStart.current = Date.now();
            setRound(0);
            setFeedback("idle");
            setDone(false);
            setReward(null);
            setPoppedIds(new Set());
          }}
          onContinue={() => {
            // harder next — bump level via localStorage then reload
            try {
              const raw = localStorage.getItem("learnzzy.learner.v1");
              if (raw) {
                const p = JSON.parse(raw);
                const next = Math.min(100, (p.level ?? 1) + 1);
                localStorage.setItem("learnzzy.learner.v1", JSON.stringify({ ...p, level: next }));
              }
            } catch {}
            window.location.reload();
          }}
        />
      );
    }
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title={isTryAgain ? "Good try! Keep going!" : "AMAZING!"} stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} character="bunny" onReplay={() => { setRound(0); setFeedback("idle"); setDone(false); setReward(null); setPoppedIds(new Set()); }} />
      </div>
    );
  }

  if (!current) {
    return (
      <GameShell title="Balloon Burst — Letters" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your balloons ready…</p>
        </div>
      </GameShell>
    );
  }

  const guideLine = feedback === "correct" ? `✨ Yes! ${current.targetLetter} burst!` : feedback === "retry" ? `Find ${current.targetLetter}! Tap it or type ${current.targetLetter} on your keyboard!` : `Find the letter ${current.targetLetter}! Tap the 🎈 or type ${current.targetLetter}!`;

  return (
    <GameShell title="Balloon Burst — Letters" stars={totalStars}>
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
        <GuideCard character="bunny" state={stateForMoment({ feedback })} name="BELLA BUNNY 🐰" line={guideLine} listenLabel="Listen" onListen={() => speakWithCharacter(`Find the letter ${current.targetLetter}!`, { lang: "en-US", rate: 1.1, pitch: 1.18, characterId: "bunny" })} />
      </div>

      {/* Target letter pill */}
      <div className="mt-3 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-6 py-2 shadow-[0_3px_0_#adc6ff]">
          <span className="text-2xl font-black text-primary">{current.targetLetter}</span>
          {current.targetWord && <span className="text-xs font-bold text-on-primary-fixed opacity-70">as in {current.targetWord}</span>}
        </div>
      </div>

      <div className="mt-3">
        <BalloonLetterStage balloons={current.balloons} poppedIds={poppedIds} onPop={onPopBalloon} />
      </div>

      <p className="mt-2 text-center text-sm font-bold text-on-surface-variant">Tap the 🎈 letter or type {current.targetLetter} on your keyboard!</p>

      {feedback === "correct" && (
        <div className="mt-3 rounded-2xl bg-tertiary-fixed/30 border border-tertiary p-3 text-center">
          <p className="font-black text-tertiary">✨ Burst! You found {current.targetLetter}!</p>
          <div className="mt-2 h-2 w-full max-w-xs mx-auto overflow-hidden rounded-full bg-white/60">
            <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: `${(countdown ?? 6) / 6 * 100}%` }} />
          </div>
          <button type="button" onClick={goNext} className="mt-2 w-full h-12 rounded-full bg-tertiary text-on-tertiary font-black shadow-[0_4px_0_#005236] active:translate-y-1 active:shadow-none">Next Level →</button>
        </div>
      )}
      {feedback === "retry" && (
        <div className="mt-3 rounded-2xl bg-error-container/40 border border-error p-3 text-center">
          <p className="font-bold text-on-error-container">Try again! Look for {current.targetLetter} 🎈</p>
        </div>
      )}

      <div className="mt-3 flex justify-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-bold">🎈 Balloons float • different speeds & sizes</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-bold">⌨️ Type to burst</span>
      </div>
    </GameShell>
  );
}
