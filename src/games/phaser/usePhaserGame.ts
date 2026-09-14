"use client";

import * as React from "react";
import type Phaser from "phaser";

// Creates and destroys a Phaser.Game inside a container div (LZ-040/043).
// Phaser is imported dynamically so SSR/prerender never touches `window`.
// FIT scale + CENTER_BOTH keeps the stage responsive across portrait,
// landscape, phones, tablets and desktop without game-code changes.
export type SceneClass<Api> = new () => Phaser.Scene & Api;

export function usePhaserGame<Api>(args: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  createSceneClass: (P: typeof Phaser) => SceneClass<Api>;
  width: number;
  height: number;
}): { apiRef: React.RefObject<Api | null>; ready: boolean } {
  const containerRef = args.containerRef;
  const createSceneClass = React.useRef(args.createSceneClass);
  createSceneClass.current = args.createSceneClass;
  const apiRef = React.useRef<Api | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let game: Phaser.Game | null = null;
    const container = containerRef.current;
    if (!container) return;
    (async () => {
      const mod = await import("phaser");
      if (cancelled) return;
      const PhaserLib = mod.default;
      const Klass = createSceneClass.current(PhaserLib);
      const scene = new Klass();
      apiRef.current = scene;
      // Scene emits 'create' after create() finishes — then API calls are safe.
      scene.events.once("create", () => {
        if (!cancelled) setReady(true);
      });
      game = new PhaserLib.Game({
        type: PhaserLib.AUTO,
        parent: container,
        transparent: true,
        banner: false,
        disableContextMenu: true,
        render: { antialias: true },
        scale: {
          mode: PhaserLib.Scale.FIT,
          autoCenter: PhaserLib.Scale.CENTER_BOTH,
          width: args.width,
          height: args.height,
        },
        scene: [scene],
      });
    })().catch(() => {
      // WebGL/canvas unavailable: the DOM pills still convey the quantities,
      // so gameplay degrades gracefully instead of breaking.
    });
    return () => {
      cancelled = true;
      apiRef.current = null;
      game?.destroy(true);
      game = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { apiRef, ready };
}
