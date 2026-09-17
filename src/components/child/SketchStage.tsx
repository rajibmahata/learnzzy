"use client";

import * as React from "react";
import { usePhaserGame } from "@/games/phaser/usePhaserGame";
import { createSketchScene, type SketchSceneApi } from "@/games/phaser/sketchScene";
import type { SketchDef } from "@/games/sketch";

export function SketchStage({
  sketch,
  onStrokeStart,
  apiRef,
}: {
  sketch: SketchDef;
  onStrokeStart: () => void;
  apiRef: React.MutableRefObject<SketchSceneApi | null>;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef: gameApi, ready, booted } = usePhaserGame<SketchSceneApi>({
    containerRef,
    createSceneClass: createSketchScene,
    width: 720,
    height: 420,
  });
  const strokeRef = React.useRef(onStrokeStart);
  strokeRef.current = onStrokeStart;

  React.useEffect(() => {
    apiRef.current = booted ? gameApi.current : null;
  }, [apiRef, gameApi, ready, booted]);

  React.useEffect(() => {
    if (booted) {
      gameApi.current?.onStrokeStart(() => strokeRef.current());
      gameApi.current?.showGuide(sketch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, sketch]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Trace the ${sketch.shape}. Drawing canvas.`}
      className="relative w-full min-h-[200px] touch-none overflow-hidden rounded-xl bg-white shadow-card [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 420" }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 p-4 text-3xl">
          <span aria-hidden>✏️</span>
          <span aria-hidden>🌟</span>
          <span aria-hidden>🐘</span>
        </div>
      )}
    </div>
  );
}
