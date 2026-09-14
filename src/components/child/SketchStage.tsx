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
  const { apiRef: gameApi, ready } = usePhaserGame<SketchSceneApi>({
    containerRef,
    createSceneClass: createSketchScene,
    width: 720,
    height: 420,
  });
  const strokeRef = React.useRef(onStrokeStart);
  strokeRef.current = onStrokeStart;

  React.useEffect(() => {
    apiRef.current = gameApi.current;
  }, [apiRef, gameApi, ready]);

  React.useEffect(() => {
    if (ready) {
      gameApi.current?.onStrokeStart(() => strokeRef.current());
      gameApi.current?.showGuide(sketch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sketch]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Trace the ${sketch.shape}. Drawing canvas.`}
      className="w-full touch-none overflow-hidden rounded-xl bg-white shadow-card [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 420" }}
    />
  );
}
