"use client";

import * as React from "react";
import { usePhaserGame } from "@/games/phaser/usePhaserGame";
import { createAdditionScene, type AdditionSceneApi } from "@/games/phaser/additionScene";

// Phaser visual stage for Number Adventure. Decorative: the authoritative
// quantities stay in the DOM count pills next to this canvas.
export function AdditionStage({
  a,
  b,
  successTick,
  emoji = "🍎",
}: {
  a: number;
  b: number;
  successTick: number;
  /** Number Orchard per-round visual theme. Display-only; math never reads it. */
  emoji?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef, ready, booted } = usePhaserGame<AdditionSceneApi>({
    containerRef,
    createSceneClass: createAdditionScene,
    width: 720,
    height: 300,
  });

  React.useEffect(() => {
    if (booted) apiRef.current?.showGroups(a, b, emoji);
  }, [booted, apiRef, a, b, emoji]);

  React.useEffect(() => {
    if (booted && successTick > 0) apiRef.current?.playSuccess();
  }, [booted, apiRef, successTick]);

  // DOM fallback: if Phaser fails or is still booting, the child still sees
  // the countable groups instead of an empty white box. The canvas covers
  // this fallback once the engine is ready.
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full min-h-[180px] overflow-hidden rounded-lg bg-white shadow-card [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 300", touchAction: "manipulation" }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-6 p-4 text-3xl">
          <span aria-hidden>{Array.from({ length: Math.max(0, Math.min(20, a)) }, () => emoji).join(" ") || emoji}</span>
          <span aria-hidden className="font-black text-secondary">+</span>
          <span aria-hidden>{Array.from({ length: Math.max(0, Math.min(20, b)) }, () => emoji).join(" ") || emoji}</span>
        </div>
      )}
    </div>
  );
}
