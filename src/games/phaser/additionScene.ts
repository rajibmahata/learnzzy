import type Phaser from "phaser";
import { gridPositions, type Zone } from "./layout";

// Visual layer for Number Adventure (LZ-051). Renders only — all math,
// validation and scoring stay in deterministic game code (DEC-050/051).
export interface AdditionSceneApi {
  showGroups: (a: number, b: number) => void;
  playSuccess: () => void;
}

const W = 720;
const LEFT: Zone = { x: 30, y: 40, w: 270, h: 220 };
const RIGHT: Zone = { x: 420, y: 40, w: 270, h: 220 };

export function createAdditionScene(P: typeof Phaser) {
  return class AdditionScene extends P.Scene implements AdditionSceneApi {
    private apples: Phaser.GameObjects.Image[] = [];
    private rightApples: Phaser.GameObjects.Image[] = [];
    private plus!: Phaser.GameObjects.Text;
    private reduced = false;

    constructor() {
      super({ key: "addition" });
    }

    preload() {
      // Local asset ensures the animation is visible even without emoji fonts or network CDN.
      this.load.image("apple", "/assets/apple.svg");
    }

    create() {
      this.reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.plus = this.add
        .text(W / 2, 150, "+", {
          fontSize: "64px",
          color: "#684000",
          fontStyle: "900",
        })
        .setOrigin(0.5)
        .setDepth(1);
      // If the SVG fails to load (e.g. offline before cache), Phaser will still
      // render a missing-texture; the deterministic count pills remain authoritative,
      // so gameplay never blocks (BR-221).
      if (!this.textures.exists("apple")) {
        // Defensive: allow a retry on next showGroups if preload was skipped.
        this.load.image("apple", "/assets/apple.svg");
        this.load.start();
      }
    }

    private spawnApple(x: number, y: number, size: number, delay: number, right: boolean) {
      // Prefer a real image sprite for reliable cross-platform rendering over emoji text.
      const useImage = this.textures.exists("apple");
      const apple: Phaser.GameObjects.Image | Phaser.GameObjects.Text = useImage
        ? this.add.image(x, y, "apple").setDisplaySize(size, size).setOrigin(0.5)
        : (this.add.text(x, y, "🍎", { fontSize: `${size}px`, fontFamily: "Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" }).setOrigin(0.5) as unknown as Phaser.GameObjects.Image);
      this.apples.push(apple);
      if (right) this.rightApples.push(apple);
      if (this.reduced || delay < 0) return;
      apple.setScale(0);
      this.tweens.add({
        targets: apple,
        scale: 1,
        duration: 250,
        delay,
        ease: "Back.easeOut",
      });
    }

    showGroups(a: number, b: number) {
      this.tweens.killAll();
      for (const apple of this.apples) apple.destroy();
      this.apples = [];
      this.rightApples = [];
      gridPositions(a, LEFT).forEach((p, i) =>
        this.spawnApple(p.x, p.y, p.size, i * 70, false)
      );
      gridPositions(b, RIGHT).forEach((p, i) =>
        this.spawnApple(p.x, p.y, p.size, 250 + i * 70, true)
      );
    }

    playSuccess() {
      if (this.reduced) return;
      // Right group hops toward the middle (combining), then everything pulses.
      this.tweens.add({
        targets: this.rightApples,
        x: "-=70",
        duration: 300,
        ease: "Sine.easeInOut",
        yoyo: false,
      });
      this.tweens.add({
        targets: this.apples,
        scale: 1.25,
        duration: 180,
        delay: 320,
        yoyo: true,
        stagger: 40,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: this.plus,
        scale: 1.3,
        duration: 180,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }
  };
}
