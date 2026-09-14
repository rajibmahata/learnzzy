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
}: {
  start: number;
  removed: number;
  successTick: number;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef, ready } = usePhaserGame<SubtractionSceneApi>({
    containerRef,
    createSceneClass: createSubtractionScene,
    width: 720,
    height: 300,
  });

  React.useEffect(() => {
    if (ready) apiRef.current?.showScene(start, removed);
  }, [ready, apiRef, start, removed]);

  React.useEffect(() => {
    if (ready && successTick > 0) apiRef.current?.playSuccess();
  }, [ready, apiRef, successTick]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="w-full overflow-hidden rounded-xl bg-gradient-to-b from-primary-fixed via-surface-low to-surface-container shadow-card [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 300", touchAction: "manipulation" }}
    />
  );
}
