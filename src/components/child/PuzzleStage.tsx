"use client";

import * as React from "react";
import { usePhaserGame } from "@/games/phaser/usePhaserGame";
import { createPuzzleScene, type PuzzleSceneApi } from "@/games/phaser/puzzleScene";
import type { PuzzleDef } from "@/games/puzzle";

export function PuzzleStage({
  puzzle,
  onComplete,
  onPlace,
  onMisdrop,
}: {
  puzzle: PuzzleDef;
  onComplete: () => void;
  onPlace: (pieceId: string) => void;
  onMisdrop?: (pieceId: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef, ready, booted } = usePhaserGame<PuzzleSceneApi>({
    containerRef,
    createSceneClass: createPuzzleScene,
    width: 720,
    height: 380,
  });
  const cbRef = React.useRef(onComplete);
  cbRef.current = onComplete;
  const placeRef = React.useRef(onPlace);
  placeRef.current = onPlace;
  const misdropRef = React.useRef(onMisdrop);
  misdropRef.current = onMisdrop;

  React.useEffect(() => {
    if (booted) {
      apiRef.current?.onComplete(() => cbRef.current());
      apiRef.current?.onPlace((id) => placeRef.current(id));
      apiRef.current?.onMisdrop((id) => misdropRef.current?.(id));
      apiRef.current?.showPuzzle(puzzle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, puzzle]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full min-h-[180px] overflow-hidden rounded-xl bg-surface-low shadow-card [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 380", touchAction: "none" }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 p-4 text-3xl">
          <span aria-hidden>🧩</span>
          <span aria-hidden>🦖</span>
          <span aria-hidden>🌈</span>
        </div>
      )}
    </div>
  );
}
