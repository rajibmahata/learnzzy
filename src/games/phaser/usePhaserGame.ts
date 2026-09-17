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
}): { apiRef: React.RefObject<Api | null>; ready: boolean; booted: boolean } {
  const containerRef = args.containerRef;
  const createSceneClass = React.useRef(args.createSceneClass);
  createSceneClass.current = args.createSceneClass;
  const apiRef = React.useRef<Api | null>(null);
  const [ready, setReady] = React.useState(false);
  // `booted` is true only after the engine's own 'ready' event (scene
  // create() done, plugins like tweens attached). Scene API calls must be
  // gated on `booted`, never on `ready`: the fallback timer can set `ready`
  // while boot is still in flight, and calling showGroups/showScene on an
  // unbooted scene throws inside an effect and kills the whole route.
  const [booted, setBooted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let readyFired = false;
    let game: Phaser.Game | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | null = null;
    const container = containerRef.current;
    if (!container) return;
    // Clear stale Phaser canvases from StrictMode remounts so a second boot
    // never stacks on an old canvas. Only canvas elements are removed here:
    // the container also holds React-managed DOM fallback nodes, and removing
    // those out from under the reconciler crashes the commit phase with
    // "NotFoundError: Failed to execute 'removeChild' on 'Node'".
    try {
      container.querySelectorAll(":scope > canvas").forEach((n) => n.remove());
    } catch {
      container.querySelectorAll("canvas").forEach((n) => n.remove());
    }
    const markReady = () => {
      if (readyFired || cancelled) return;
      readyFired = true;
      if (readyTimer) clearTimeout(readyTimer);
      setReady(true);
    };
    const markBooted = (scene: Api) => {
      if (cancelled) return;
      // Expose the scene API only once the engine booted it. Assigning
      // apiRef earlier lets callers invoke methods on an unbooted scene.
      apiRef.current = scene;
      setBooted(true);
      markReady();
    };
    (async () => {
      const mod = (await import("phaser")) as unknown as { default?: typeof Phaser } & typeof Phaser;
      if (cancelled) return;
      // Phaser ships UMD; Next dynamic import interop differs between builds.
      // Prefer default export but fall back to the namespace itself.
      const PhaserLib = (mod.default ?? (mod as unknown as typeof Phaser)) as typeof Phaser;
      if (!PhaserLib || !PhaserLib.Game || !PhaserLib.Scale) {
        throw new Error("Phaser library did not expose Game/Scale");
      }
      const Klass = createSceneClass.current(PhaserLib);
      const scene = new Klass();
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
      // Readiness via the Game 'ready' event: it fires after boot completes
      // and the scene's create() has run, so API calls are safe. (Never use
      // scene.events before boot — the emitter is attached by the
      // SceneManager during boot, and touching it earlier throws.)
      try {
        game.events.once("ready", () => markBooted(scene as unknown as Api));
      } catch {
        // If the events emitter is unavailable, fall through to the timeout
        // fallback below rather than leaving the stage empty forever.
      }
      // Fallback: if 'ready' never fires (blocked WebGL, driver quirk), still
      // resolve so scene API calls are attempted and the DOM fallback can show.
      readyTimer = setTimeout(() => {
        if (!cancelled && !readyFired) {
          console.warn("[learnzzy] Phaser ready timeout, proceeding with DOM-assisted stage");
          markReady();
        }
      }, 4000);
    })().catch((err: unknown) => {
      // Gameplay degrades gracefully (DOM fallback conveys the activity), but
      // the failure must be VISIBLE: a silent catch here once hid a total
      // engine outage across all five games with zero console output.
      console.warn("[learnzzy] Phaser boot failed, using DOM fallback", err);
      if (readyTimer) clearTimeout(readyTimer);
    });
    return () => {
      cancelled = true;
      if (readyTimer) clearTimeout(readyTimer);
      apiRef.current = null;
      try {
        game?.destroy(true);
      } catch {
        /* destroy must never break unmount */
      }
      game = null;
      setReady(false);
      setBooted(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { apiRef, ready, booted };
}
