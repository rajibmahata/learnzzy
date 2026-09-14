import type Phaser from "phaser";
import type { CleanupSceneDef } from "../cleanup";

// Tap-to-clean stage (BR-051/052): only defined targets are interactive;
// decorations are inert. Collection is reported back to React, which owns
// completion state and rewards (browser never authoritative — server events only).
export interface CleanupSceneApi {
  showScene: (scene: CleanupSceneDef) => void;
  onCollect: (cb: (targetId: string) => void) => void;
}

const W = 720;
const H = 340;
const BASKET = { x: 648, y: 288 };

export function createCleanupScene(P: typeof Phaser) {
  return class CleanupScene extends P.Scene implements CleanupSceneApi {
    private cb: ((targetId: string) => void) | null = null;
    private reduced = false;

    constructor() {
      super({ key: "cleanup" });
    }

    create() {
      this.reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Basket.
      this.add.text(BASKET.x, BASKET.y, "🧺", { fontSize: "64px" }).setOrigin(0.5).setDepth(10);
      this.add
        .text(BASKET.x, 330, "CLEAN IT UP! 🧹", { fontSize: "20px", color: "#424754", fontStyle: "700" })
        .setOrigin(0.5, 1);
    }

    onCollect(cb: (targetId: string) => void) {
      this.cb = cb;
    }

    showScene(scene: CleanupSceneDef) {
      this.tweens.killAll();
      // Remove previous round objects (keep basket = first two children).
      const kids = this.children.getAll();
      for (let i = kids.length - 1; i >= 2; i--) kids[i].destroy();

      const px = (x: number) => Math.round((x / 100) * (W - 90) + 10);
      const py = (y: number) => Math.round((y / 100) * (H - 70) + 8);

      for (const d of scene.nonTargets) {
        this.add
          .text(px(d.x), py(d.y), d.emoji, { fontSize: "44px", fontFamily: "Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" })
          .setOrigin(0.5)
          .setAlpha(0.9);
      }

      scene.targets.forEach((t, i) => {
        const obj = this.add
          .text(px(t.x), py(t.y), t.emoji, { fontSize: "52px", fontFamily: "Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        if (!this.reduced) {
          obj.setScale(0);
          this.tweens.add({ targets: obj, scale: 1, duration: 250, delay: i * 90, ease: "Back.easeOut" });
        }
        obj.on("pointerdown", () => {
          obj.disableInteractive();
          const done = () => {
            obj.destroy();
            this.cb?.(t.targetId);
          };
          if (this.reduced) {
            done();
            return;
          }
          this.tweens.add({ targets: obj, scale: 1.25, duration: 120, yoyo: true });
          this.tweens.add({
            targets: obj,
            x: BASKET.x,
            y: BASKET.y,
            scale: 0.2,
            alpha: 0.4,
            duration: 450,
            delay: 130,
            ease: "Sine.easeIn",
            onComplete: done,
          });
        });
      });
    }
  };
}
