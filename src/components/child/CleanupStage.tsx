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
  const { apiRef, ready } = usePhaserGame<CleanupSceneApi>({
    containerRef,
    createSceneClass: createCleanupScene,
    width: 720,
    height: 340,
  });
  const cbRef = React.useRef(onCollect);
  cbRef.current = onCollect;

  React.useEffect(() => {
    if (ready) {
      apiRef.current?.onCollect((id) => cbRef.current(id));
      apiRef.current?.showScene(scene);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, scene]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="w-full overflow-hidden rounded-xl bg-white shadow-card [&>canvas]:mx-auto [&>canvas]:block"
      style={{ aspectRatio: "720 / 340", touchAction: "manipulation" }}
    />
  );
}
