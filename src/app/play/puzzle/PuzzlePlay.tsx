"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { PuzzleStage } from "@/components/child/PuzzleStage";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
import { GuideCard } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter, CHARACTER_VOICES } from "@/lib/audio";
import { artForGame } from "@/lib/worlds";
import { GAME_ROUNDS } from "@/games/framework";
import { createPuzzleDef, validatePuzzleDef, type PuzzleDef } from "@/games/puzzle";
import { toPuzzleContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";
import { getCachedProfile } from "@/lib/learner";
import { bumpGlobalLevel } from "@/lib/levelUp";
import { useRouter, useSearchParams } from "next/navigation";

export default function PuzzlePlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLevel = React.useMemo(() => {
    const v = Number(searchParams.get("level"));
    return Number.isFinite(v) && v >= 1 && v <= 100 ? v : null;
  }, [searchParams]);
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [done, setDone] = React.useState(false);
  const [globalLevel, setGlobalLevel] = React.useState<number>(() => urlLevel ?? 1);
  React.useEffect(() => {
    if (urlLevel !== null) { setGlobalLevel(urlLevel); return; }
    const p = getCachedProfile();
    if (p && typeof p.level === "number") setGlobalLevel(Math.max(1, Math.min(100, p.level)));
  }, [urlLevel]);
  const difficulty = Math.max(1, Math.min(3, Math.ceil(globalLevel / 2))) as 1 | 2 | 3;

  const { rounds, reload, locked } = useGameRounds<PuzzleDef>({
    gameId: "puzzle",
    difficulty,
    total: GAME_ROUNDS,
    mapItem: toPuzzleContent,
    makeLocal: (r) => createPuzzleDef(`local-puz-${Date.now() % 2147483647}-${r}`, difficulty),
  });
  const puzzle = rounds?.[round]?.content;
  const contentId = rounds?.[round]?.contentId;
  const valid = puzzle && validatePuzzleDef(puzzle) ? puzzle : undefined;

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "puzzle", metadata: { sessionId: getSessionId() } });
  }, []);

  function complete() {
    if (done || !valid) return;
    queueEvent({ event: "puzzle_completed", gameId: "puzzle", contentId });
    setTimeout(() => {
      if (round + 1 >= GAME_ROUNDS) {
        const r = award("puzzle", 3);
        setReward(r);
        setDone(true);
        queueEvent({ event: "game_completed", gameId: "puzzle", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
        // Puzzle completion requires all pieces correct; misdrops return gently
        // and are counted via wrongDropRounds when reported by the stage.
        const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - wrongDropRounds.current.size) / GAME_ROUNDS));
        reportGameCompletion({ gameId: "puzzle", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji });
      } else {
        setRound(round + 1);
      }
    }, 800);
  }

  const wrongDropRounds = React.useRef<Set<number>>(new Set());

  function placePiece(pieceId: string) {
    if (!valid) return;
    queueEvent({ event: "puzzle_piece_placed", gameId: "puzzle", contentId, metadata: { pieceId } });
  }

  function misdrop() {
    if (!valid || done) return;
    wrongDropRounds.current.add(round);
    queueEvent({ event: "retry_started", gameId: "puzzle", contentId, metadata: { round: round + 1 } });
  }

  const handleContinueHarder = React.useCallback(() => {
    const next = bumpGlobalLevel(globalLevel, 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", String(next));
    router.push(`/play/puzzle?${params.toString()}`);
    setRound(0); setDone(false); setReward(null);
  }, [globalLevel, router, searchParams]);

  if (done) {
    if (reward?.sticker) return <WorldReward sticker={reward.sticker} character="dino" variantSeed={reward.sticker.id} continueLabel="Continue → Next Level" onReplay={() => { setRound(0); setDone(false); setReward(null); reload(); }} onContinue={handleContinueHarder} />;
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="Dino is Awake!" stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} character="dino" onReplay={() => { setRound(0); setDone(false); setReward(null); reload(); }} />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <button type="button" onClick={handleContinueHarder} className="w-full h-14 rounded-full bg-primary text-on-primary font-black text-base shadow-[0_5px_0_#004395] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"><span>Continue → Next Level</span><span className="material-symbols-outlined text-[20px]">arrow_forward</span></button>
          <p className="text-center text-xs font-bold text-on-surface-variant mt-2">LEVEL {globalLevel} → {Math.min(100, globalLevel + 1)} • Harder!</p>
        </div>
      </div>
    );
  }

  if (locked) return <LockedAdventure title="Picture Puzzle" />;

  if (!valid) {
    return (
    <GameShell title="Picture Puzzle" stars={totalStars} progress={{ current: round + 1, total: GAME_ROUNDS }} level={globalLevel}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  // Dino Discovery (Stitch puzzle): wake the happy baby dino by snapping
  // wooden pieces home. Guide + art only; placement logic untouched.
  const dinoLine = "Put the pieces together to wake up our happy baby dino!";
  function dinoVoice(text: string) {
    const v = CHARACTER_VOICES.dino ?? CHARACTER_VOICES.teddy;
    speakWithCharacter(text, { lang: "en-US", rate: v.rate, pitch: v.pitch });
  }

  return (
    <GameShell title="Picture Puzzle" stars={totalStars}>
      <p className="mt-3 text-center text-xs font-black uppercase tracking-wider text-on-surface-variant">
        Puzzle {round + 1} of {GAME_ROUNDS}
      </p>
      <div className="mt-2">
        <GuideCard
          character="dino"
          state={stateForMoment({})}
          name="DINO GUIDE 🦕"
          line={dinoLine}
          listenLabel="Listen"
          onListen={() => dinoVoice(dinoLine)}
          art={artForGame("puzzle")}
          tint="from-emerald-50 via-white to-teal-50"
          border="border-emerald-200"
        />
      </div>
      <div className="mt-2" aria-label={`${valid.pieces.length}-piece puzzle`}>
        <PuzzleStage
          puzzle={valid}
          onComplete={complete}
          onPlace={placePiece}
          onMisdrop={misdrop}
        />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-on-surface-variant">🧩 Tap a piece, then tap its home — Snap &amp; Fit!</p>
    </GameShell>
  );
}
