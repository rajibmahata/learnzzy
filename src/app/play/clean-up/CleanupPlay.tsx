"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { CleanupStage } from "@/components/child/CleanupStage";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
import { GuideCard, ClueButton } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter, CHARACTER_VOICES } from "@/lib/audio";
import { artForGame } from "@/lib/worlds";
import { GAME_ROUNDS } from "@/games/framework";
import { createCleanupScene, isSceneComplete, type CleanupSceneDef } from "@/games/cleanup";
import { toCleanupContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";
import { getCachedProfile } from "@/lib/learner";
import { useRouter, useSearchParams } from "next/navigation";

export default function CleanupPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLevel = React.useMemo(() => {
    const v = Number(searchParams.get("level"));
    return Number.isFinite(v) && v >= 1 && v <= 100 ? v : null;
  }, [searchParams]);
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [collected, setCollected] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);
  const [globalLevel, setGlobalLevel] = React.useState<number>(() => urlLevel ?? 1);
  React.useEffect(() => {
    if (urlLevel !== null) { setGlobalLevel(urlLevel); return; }
    const p = getCachedProfile();
    if (p && typeof p.level === "number") setGlobalLevel(Math.max(1, Math.min(100, p.level)));
  }, [urlLevel]);
  const difficulty = Math.max(1, Math.min(3, Math.ceil(globalLevel / 2))) as 1 | 2 | 3;

  const { rounds, reload, locked } = useGameRounds<CleanupSceneDef>({
    gameId: "clean-up",
    difficulty,
    total: GAME_ROUNDS,
    mapItem: toCleanupContent,
    makeLocal: (r) => createCleanupScene(`local-clean-${Date.now() % 2147483647}-${r}`, ["bedroom", "garden", "park"][r % 3], difficulty),
  });
  const scene = rounds?.[round]?.content;
  const contentId = rounds?.[round]?.contentId;
  const left = scene ? scene.targets.length - collected.length : 0;

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "clean-up", metadata: { sessionId: getSessionId() } });
  }, []);

  function pipVoice(text: string) {
    const v = CHARACTER_VOICES.puppy ?? CHARACTER_VOICES.teddy;
    speakWithCharacter(text, { lang: "en-US", rate: v.rate, pitch: v.pitch });
  }

  function collect(id: string) {
    if (!scene || done) return;
    if (collected.includes(id)) return;
    const next = [...collected, id];
    setCollected(next);
    queueEvent({ event: "answer_submitted", gameId: "clean-up", contentId, metadata: { targetId: id } });
    if (isSceneComplete(scene.targets.length, next)) {
      queueEvent({ event: "answer_correct", gameId: "clean-up", contentId });
      setTimeout(() => {
        if (round + 1 >= GAME_ROUNDS) {
          const r = award("clean-up", 5);
          setReward(r);
          setDone(true);
          queueEvent({ event: "game_completed", gameId: "clean-up", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
          // Tap-to-clean has no wrong answers (decorations inert) — completion is the signal.
          reportGameCompletion({ gameId: "clean-up", accuracy: 1, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji });
        } else {
          setRound(round + 1);
          setCollected([]);
        }
      }, 800);
    }
  }

  const handleContinueHarder = React.useCallback(() => {
    const next = Math.min(100, globalLevel + 1);
    try {
      const raw = localStorage.getItem("learnzzy.learner.v1");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p.level === "number") localStorage.setItem("learnzzy.learner.v1", JSON.stringify({ ...p, level: next })); }
      localStorage.setItem("learnzzy.globalLevel.v1", String(next));
    } catch {}
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", String(next));
    router.push(`/play/clean-up?${params.toString()}`);
    setRound(0); setCollected([]); setDone(false); setReward(null);
  }, [globalLevel, reload, router, searchParams]);

  if (done) {
    if (reward?.sticker) return <WorldReward sticker={reward.sticker} character="puppy" variantSeed={reward.sticker.id} continueLabel="Continue → Next Level" onReplay={() => { setRound(0); setCollected([]); setDone(false); setReward(null); reload(); }} onContinue={handleContinueHarder} />;
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="Wonderful Job!" stars={reward?.stars ?? 5} sticker={reward?.sticker ?? null} character="puppy" onReplay={() => { setRound(0); setCollected([]); setDone(false); setReward(null); reload(); }} />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <button type="button" onClick={handleContinueHarder} className="w-full h-14 rounded-full bg-primary text-on-primary font-black text-base shadow-[0_5px_0_#004395] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"><span>Continue → Next Level</span><span className="material-symbols-outlined text-[20px]">arrow_forward</span></button>
          <p className="text-center text-xs font-bold text-on-surface-variant mt-2">LEVEL {globalLevel} → {Math.min(100, globalLevel + 1)} • Harder!</p>
        </div>
      </div>
    );
  }

  if (locked) return <LockedAdventure title="Clean Up" />;

  if (!scene) {
    return (
      <GameShell title="Clean Up" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  // Quest stepper (Stitch clean-up): stars earned across rounds.
  const questLine = left === 0 ? "All tidy! Great sorting!" : "Help me tidy our sunny playroom! Tap what needs cleaning!";
  return (
    <GameShell title="Clean Up" stars={totalStars}>
      <div className="mt-3 flex items-center justify-center gap-2" aria-label={`Round ${round + 1} of ${GAME_ROUNDS}`}>
        <span className="rounded-full bg-surface-low px-3 py-1 text-xs font-black uppercase text-on-surface-variant shadow-sm">
          Quest: Tidy Room
        </span>
        {Array.from({ length: GAME_ROUNDS }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow-sm ${i < round ? "bg-secondary-container text-on-secondary-fixed shadow-[0_3px_0_#ffb95f]" : i === round ? "bg-white text-primary ring-2 ring-secondary-container" : "bg-surface-high text-on-surface-variant"}`}
          >
            {i < round ? "★" : i + 1}
          </span>
        ))}
      </div>
      <div className="mt-2">
        <GuideCard
          character="puppy"
          state={stateForMoment({ done: left === 0 })}
          name="PIP THE PUPPY 🐶"
          line={questLine}
          listenLabel="Listen to Pip"
          onListen={() => pipVoice(questLine)}
          art={artForGame("clean-up")}
        />
      </div>
      <div className="mt-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-200 to-orange-200 px-4 py-1.5 text-sm font-black text-amber-950 shadow-[0_3px_0_#f6ad55]">
          🧺 Item to Sort Now
        </span>
      </div>
      <div aria-label={`${left} things left to clean`}>
        <CleanupStage scene={scene} onCollect={collect} />
      </div>
      <p aria-live="polite" className="mt-3 text-center text-lg font-bold">
        🧺 {left} thing{left === 1 ? "" : "s"} left
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-secondary-fixed/40 px-3 py-2">
        <p className="text-xs font-bold text-on-secondary-fixed">Pip says: “You are a super helper!” +1 Star waits!</p>
        <ClueButton label="Need a Clue? 🐶" onClick={() => pipVoice("Look for what does not belong. Tap it to tidy up!")} />
      </div>
    </GameShell>
  );
}
