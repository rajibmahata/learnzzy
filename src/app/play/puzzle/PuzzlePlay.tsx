"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { PuzzleStage } from "@/components/child/PuzzleStage";
import { Celebration } from "@/components/child/Celebration";
import { GAME_ROUNDS } from "@/games/framework";
import { createPuzzleDef, validatePuzzleDef, type PuzzleDef } from "@/games/puzzle";
import { toPuzzleContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";

export default function PuzzlePlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [done, setDone] = React.useState(false);

  const { rounds, reload, locked } = useGameRounds<PuzzleDef>({
    gameId: "puzzle",
    difficulty: 1,
    total: GAME_ROUNDS,
    mapItem: toPuzzleContent,
    makeLocal: (r) => createPuzzleDef(`local-puz-${Date.now() % 2147483647}-${r}`, 1),
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

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="BEAUTIFUL!" stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} onReplay={() => { setRound(0); setDone(false); setReward(null); reload(); }} />
      </div>
    );
  }

  if (locked) return <LockedAdventure title="Picture Puzzle" />;

  if (!valid) {
    return (
      <GameShell title="Picture Puzzle" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Picture Puzzle" stars={totalStars}>
      <h2 className="mt-2 text-center text-instruction uppercase">COMPLETE THE PICTURE</h2>
      <p className="text-center text-sm text-on-surface-variant">
        Drag pieces — or tap a piece, then tap its home
      </p>
      <div className="mt-2" aria-label={`${valid.pieces.length}-piece puzzle`}>
        <PuzzleStage
          puzzle={valid}
          onComplete={complete}
          onPlace={placePiece}
          onMisdrop={misdrop}
        />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-on-surface-variant">🧩 Tap and drag gently!</p>
    </GameShell>
  );
}
