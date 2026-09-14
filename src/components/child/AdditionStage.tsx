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
}: {
  a: number;
  b: number;
  successTick: number;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef, ready } = usePhaserGame<AdditionSceneApi>({
    containerRef,
    createSceneClass: createAdditionScene,
    width: 720,
    height: 300,
  });

  React.useEffect(() => {
    if (ready) apiRef.current?.showGroups(a, b);
  }, [ready, apiRef, a, b]);

  React.useEffect(() => {
    if (ready && successTick > 0) apiRef.current?.playSuccess();
  }, [ready, apiRef, successTick]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="w-full overflow-hidden rounded-lg bg-white shadow-card [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 300", touchAction: "manipulation" }}
    />
  );
}
