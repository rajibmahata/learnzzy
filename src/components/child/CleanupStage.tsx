"use client";

import * as React from "react";
import { usePhaserGame } from "@/games/phaser/usePhaserGame";
import { createCleanupScene, type CleanupSceneApi } from "@/games/phaser/cleanupScene";
import type { CleanupSceneDef } from "@/games/cleanup";

export function CleanupStage({
  scene,
  onCollect,
}: {
  scene: CleanupSceneDef;
  onCollect: (targetId: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { apiRef, ready, booted } = usePhaserGame<CleanupSceneApi>({
    containerRef,
    createSceneClass: createCleanupScene,
    width: 720,
    height: 340,
  });
  const cbRef = React.useRef(onCollect);
  cbRef.current = onCollect;

  React.useEffect(() => {
    if (booted) {
      apiRef.current?.onCollect((id) => cbRef.current(id));
      apiRef.current?.showScene(scene);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, scene]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full min-h-[180px] overflow-hidden rounded-xl bg-white shadow-card [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 340", touchAction: "manipulation" }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 p-4 text-3xl">
          <span aria-hidden>🧹</span>
          <span aria-hidden>🧸</span>
          <span aria-hidden>🧺</span>
        </div>
      )}
    </div>
  );
}
