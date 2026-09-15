import type Phaser from "phaser";
import type { SketchDef } from "../sketch";

// Drawing canvas: touch + mouse + stylus via pointer. Guide rendered as a
// soft dotted shadow; the child draws over it. Strokes are returned in 0–100
// guide space for deterministic evaluation in game code.
export interface SketchSceneApi {
  showGuide: (def: SketchDef) => void;
  clear: () => void;
  getDrawing: () => { x: number; y: number }[][];
  onStrokeStart: (cb: () => void) => void;
  setInkColor: (hex: number) => void;
}

const W = 720;
const H = 420;
const toX = (x: number) => (x / 100) * W;
const toY = (y: number) => (y / 100) * H;
const fromX = (x: number) => Math.max(0, Math.min(100, (x / W) * 100));
const fromY = (y: number) => Math.max(0, Math.min(100, (y / H) * 100));

export function createSketchScene(P: typeof Phaser) {
  return class SketchScene extends P.Scene implements SketchSceneApi {
    private ink!: Phaser.GameObjects.Graphics;
    private guide: Phaser.GameObjects.Graphics | null = null;
    private strokes: { x: number; y: number }[][] = [];
    private current: { x: number; y: number }[] | null = null;
    private last: { x: number; y: number } | null = null;
    private strokeCb: (() => void) | null = null;
    private drawing = false;
    private inkColor = 0x0058be;

    constructor() {
      super({ key: "sketch" });
    }

    create() {
      this.ink = this.add.graphics().setDepth(5);
      this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) return;
        this.drawing = true;
        this.current = [{ x: fromX(p.x), y: fromY(p.y) }];
        this.last = { x: p.x, y: p.y };
        this.strokeCb?.();
      });
      this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
        if (!this.drawing || !p.isDown || !this.current || !this.last) return;
        if (Math.hypot(p.x - this.last.x, p.y - this.last.y) < 4) return;
        this.ink.lineStyle(12, this.inkColor, 1);
        this.ink.beginPath();
        this.ink.moveTo(this.last.x, this.last.y);
        this.ink.lineTo(p.x, p.y);
        this.ink.strokePath();
        // Round the joints with dots.
        this.ink.fillStyle(this.inkColor, 1);
        this.ink.fillCircle(p.x, p.y, 6);
        this.current.push({ x: fromX(p.x), y: fromY(p.y) });
        this.last = { x: p.x, y: p.y };
      });
      const end = () => {
        if (this.drawing && this.current && this.current.length > 0) {
          this.strokes.push(this.current);
        }
        this.drawing = false;
        this.current = null;
        this.last = null;
      };
      this.input.on("pointerup", end);
      this.input.on("pointerupoutside", end);
    }

    onStrokeStart(cb: () => void) {
      this.strokeCb = cb;
    }

    setInkColor(hex: number) {
      // Cosmetic only — evaluation (coverage/tolerance) never sees color.
      if (Number.isInteger(hex) && hex >= 0 && hex <= 0xffffff) this.inkColor = hex;
    }

    showGuide(def: SketchDef) {
      this.clearInk();
      this.guide?.destroy();
      const guide = this.add.graphics().setDepth(1);
      this.guide = guide;
      guide.lineStyle(4, 0x727785, 0.35);
      guide.beginPath();
      def.guidePath.forEach((p, i) => {
        const x = toX(p.x);
        const y = toY(p.y);
        if (i === 0) guide.moveTo(x, y);
        else guide.lineTo(x, y);
      });
      guide.strokePath();
      guide.fillStyle(0x0058be, 0.3);
      def.guidePath.forEach((p, i) => {
        if (i % 2 === 0) guide.fillCircle(toX(p.x), toY(p.y), 5);
      });
    }

    clear() {
      // Clears the child's ink but keeps the guide visible.
      this.clearInk();
    }

    private clearInk() {
      this.strokes = [];
      this.current = null;
      this.last = null;
      this.drawing = false;
      this.ink?.clear();
    }

    getDrawing() {
      const all = [...this.strokes];
      if (this.current && this.current.length > 0) all.push([...this.current]);
      return all;
    }
  };
}
