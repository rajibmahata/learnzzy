import type Phaser from "phaser";
import { gridPositions, type Zone } from "./layout";

// Visual layer for Fly Away (LZ-061). Renders only — the authoritative
// `remaining = start - removed` math lives in deterministic game code.
export interface SubtractionSceneApi {
  showScene: (start: number, removed: number, emoji?: string) => void;
  playSuccess: () => void;
}

const FLOCK: Zone = { x: 60, y: 50, w: 400, h: 160 };
const BRANCH_Y = 262;

export function createSubtractionScene(P: typeof Phaser) {
  return class SubtractionScene extends P.Scene implements SubtractionSceneApi {
    private stayers: Phaser.GameObjects.Image[] = [];
    private label: Phaser.GameObjects.Text | null = null;
    private reduced = false;

    constructor() {
      super({ key: "subtraction" });
    }

    preload() {
      this.load.svg("bird", "/assets/bird.svg", { width: 64, height: 64 });
    }

    create() {
      this.reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!this.textures.exists("bird")) {
        this.load.svg("bird", "/assets/bird.svg", { width: 64, height: 64 });
        this.load.start();
      }
      // Wooden perch the remaining birds sit on.
      const g = this.add.graphics();
      g.lineStyle(14, 0x855300, 1);
      g.beginPath();
      g.moveTo(50, BRANCH_Y);
      g.lineTo(470, BRANCH_Y);
      g.strokePath();
      g.lineStyle(8, 0x855300, 1);
      g.beginPath();
      g.moveTo(430, BRANCH_Y);
      g.lineTo(430, 300);
      g.strokePath();
    }

    showScene(start: number, removed: number, emoji = "🐦") {
      this.tweens.killAll();
      for (const bird of this.stayers) bird.destroy();
      this.stayers = [];
      this.label?.destroy();
      this.label = null;

      const remaining = Math.max(0, start - removed);
      const spots = gridPositions(start, FLOCK);

      spots.forEach((p, i) => {
        // Breeze Valley: per-round visual themes render as emoji text; the
        // bird sprite stays the default path so existing rendering is identical.
        const useImage = emoji === "🐦" && this.textures.exists("bird");
        const bird: Phaser.GameObjects.Image = useImage
          ? (this.add.image(p.x, p.y, "bird").setDisplaySize(p.size, p.size).setOrigin(0.5) as unknown as Phaser.GameObjects.Image)
          : (this.add.text(p.x, p.y, emoji, { fontSize: `${p.size}px`, fontFamily: "Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" }).setOrigin(0.5) as unknown as Phaser.GameObjects.Image);
        if (i < remaining) {
          this.stayers.push(bird);
          if (!this.reduced) {
            bird.setScale(0);
            this.tweens.add({
              targets: bird,
              scale: 1,
              duration: 250,
              delay: i * 60,
              ease: "Back.easeOut",
            });
          }
        } else if (!this.reduced) {
          // Flyers: perch briefly, then flap up-right and fade (LZ-061).
          bird.setScale(0);
          this.tweens.add({
            targets: bird,
            scale: 1,
            duration: 200,
            delay: i * 60,
            ease: "Back.easeOut",
          });
          this.tweens.add({
            targets: bird,
            x: bird.x + 260,
            y: bird.y - 170,
            alpha: 0,
            duration: 650,
            delay: 700 + (i - remaining) * 150,
            ease: "Quad.easeIn",
            onComplete: () => bird.destroy(),
          });
        } else {
          bird.destroy(); // reduced motion: departed birds simply absent
        }
      });

      if (removed > 0) {
        this.label = this.add
          .text(60, 16, `↗ -${removed} Flew Away`, {
            fontSize: "22px",
            color: "#93000a",
            backgroundColor: "#ffdad6",
            padding: { x: 10, y: 6 },
            fontStyle: "700",
          })
          .setDepth(2);
      }
    }

    playSuccess() {
      if (this.reduced) return;
      this.tweens.add({
        targets: this.stayers,
        scale: 1.25,
        duration: 180,
        yoyo: true,
        stagger: 50,
        ease: "Sine.easeInOut",
      });
    }
  };
}
