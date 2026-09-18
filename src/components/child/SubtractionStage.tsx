"use client";

import * as React from "react";
import { usePhaserGame } from "@/games/phaser/usePhaserGame";
import { createSubtractionScene, type SubtractionSceneApi } from "@/games/phaser/subtractionScene";

// Phaser visual stage for Fly Away. Decorative: the authoritative counts
// stay in the DOM text next to this canvas.
export function SubtractionStage({
  start,
  removed,
  successTick,
  emoji = "🐦",
}: {
  start: number;
  removed: number;
  successTick: number;
  /** Breeze Valley per-round visual theme. Display-only; math never reads it. */
  emoji?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef, ready, booted } = usePhaserGame<SubtractionSceneApi>({
    containerRef,
    createSceneClass: createSubtractionScene,
    width: 720,
    height: 300,
  });

  React.useEffect(() => {
    if (booted) apiRef.current?.showScene(start, removed, emoji);
  }, [booted, apiRef, start, removed, emoji]);

  React.useEffect(() => {
    if (booted && successTick > 0) apiRef.current?.playSuccess();
  }, [booted, apiRef, successTick]);

  const remaining = Math.max(0, start - removed);
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full min-h-[180px] overflow-hidden rounded-xl bg-gradient-to-b from-primary-fixed via-surface-low to-surface-container shadow-card [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 300", touchAction: "manipulation" }}
    >
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4">
          <p className="text-3xl" aria-hidden>
            {Array.from({ length: Math.max(0, Math.min(20, remaining)) }, () => emoji).join(" ") || emoji}
          </p>
          <p className="text-xs font-bold text-on-surface-variant" aria-hidden>
            {removed} flew away
          </p>
        </div>
      )}
    </div>
  );
}
