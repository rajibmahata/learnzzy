import type Phaser from "phaser";
import type { PuzzleDef } from "../puzzle";

// Drag-and-drop board (BR-061/062): touch + mouse + stylus via pointer,
// snap-to-place on the correct slot, gentle return otherwise, tap-to-select
// as an accessible alternative. Completion is reported to React.
export interface PuzzleSceneApi {
  showPuzzle: (def: PuzzleDef) => void;
  onComplete: (cb: () => void) => void;
  onPlace: (cb: (pieceId: string) => void) => void;
  onMisdrop: (cb: (pieceId: string) => void) => void;
}

const BOARD = { x: 30, y: 30, w: 330, h: 320 };
const TRAY = { x: 400, y: 30, w: 290, h: 320 };

type Piece = {
  id: string;
  correct: number;
  obj: Phaser.GameObjects.Container;
  home: { x: number; y: number };
  placed: boolean;
};

export function createPuzzleScene(P: typeof Phaser) {
  return class PuzzleScene extends P.Scene implements PuzzleSceneApi {
    private cb: (() => void) | null = null;
    private placeCb: ((pieceId: string) => void) | null = null;
    private misdropCb: ((pieceId: string) => void) | null = null;
    private pieces: Piece[] = [];
    private slots: { x: number; y: number; taken: boolean }[] = [];
    private selected: Piece | null = null;
    private cell = 100;
    private reduced = false;

    constructor() {
      super({ key: "puzzle" });
    }

    create() {
      this.reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.input.on("dragstart", (_p: unknown, obj: Phaser.GameObjects.Container) => {
        obj.setDepth(20);
        this.select(obj.getData("piece") as Piece);
      });
      this.input.on(
        "drag",
        (_p: unknown, obj: Phaser.GameObjects.Container, x: number, y: number) => {
          obj.x = x;
          obj.y = y;
        }
      );
      this.input.on("dragend", (_p: unknown, obj: Phaser.GameObjects.Container) => {
        obj.setDepth(5);
        this.tryPlace(obj.getData("piece") as Piece);
      });
    }

    onComplete(cb: () => void) {
      this.cb = cb;
    }

    onPlace(cb: (pieceId: string) => void) {
      this.placeCb = cb;
    }

    onMisdrop(cb: (pieceId: string) => void) {
      this.misdropCb = cb;
    }

    private select(piece: Piece | null) {
      if (this.selected && !this.selected.placed) this.selected.obj.setScale(1);
      this.selected = piece && !piece.placed ? piece : null;
      if (this.selected) this.selected.obj.setScale(1.12);
    }

    private slotAt(x: number, y: number): number {
      let best = -1;
      let bestD = this.cell * 0.6;
      this.slots.forEach((s, i) => {
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    private place(piece: Piece, slot: number) {
      const s = this.slots[slot];
      s.taken = true;
      piece.placed = true;
      piece.obj.disableInteractive();
      this.placeCb?.(piece.id);
      if (this.selected === piece) this.select(null);
      const land = () => {
        piece.obj.x = s.x;
        piece.obj.y = s.y;
        piece.obj.setScale(1);
      };
      if (this.reduced) {
        land();
      } else {
        this.tweens.add({
          targets: piece.obj,
          x: s.x,
          y: s.y,
          scale: 1,
          duration: 220,
          ease: "Sine.easeOut",
          onComplete: land,
        });
      }
      if (this.pieces.every((p) => p.placed)) {
        if (this.reduced) this.cb?.();
        else this.time.delayedCall(350, () => this.cb?.());
      }
    }

    private tryPlace(piece: Piece) {
      if (piece.placed) return;
      const slot = this.slotAt(piece.obj.x, piece.obj.y);
      const target = this.pieces.find((p) => p.id === piece.id);
      if (slot >= 0 && !this.slots[slot].taken && target && target.correct === slot) {
        this.place(piece, slot);
        return;
      }
      // Wrong slot (or no slot): report for learning signals, then gentle return.
      // Only count drops near the board as real attempts, not tray fumbles.
      if (slot >= 0) this.misdropCb?.(piece.id);
      // Gentle return — never harsh (DEC-014).
      if (this.reduced) {
        piece.obj.x = piece.home.x;
        piece.obj.y = piece.home.y;
      } else {
        this.tweens.add({
          targets: piece.obj,
          x: piece.home.x,
          y: piece.home.y,
          duration: 300,
          ease: "Sine.easeInOut",
        });
        this.tweens.add({ targets: piece.obj, angle: 8, duration: 90, yoyo: true, repeat: 1 });
      }
    }

    showPuzzle(def: PuzzleDef) {
      this.children.removeAll();
      this.pieces = [];
      this.slots = [];
      this.selected = null;
      const n = def.rows * def.columns;
      this.cell = Math.floor(Math.min(BOARD.w / def.columns, BOARD.h / def.rows));

      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(BOARD.x - 8, BOARD.y - 8, BOARD.w + 16, BOARD.h + 16, 20);

      for (let i = 0; i < n; i++) {
        const c = i % def.columns;
        const r = Math.floor(i / def.columns);
        const x = BOARD.x + (c + 0.5) * (BOARD.w / def.columns);
        const y = BOARD.y + (r + 0.5) * (BOARD.h / def.rows);
        this.slots.push({ x, y, taken: false });
        const slot = this.add
          .zone(x, y, this.cell - 8, this.cell - 8)
          .setInteractive({ useHandCursor: true });
        slot.on("pointerdown", () => {
          if (this.selected && !this.slots[i].taken) {
            const target = this.pieces.find((p) => p.id === this.selected!.id);
            if (target && target.correct === i) this.place(this.selected, i);
            else if (target) this.misdropCb?.(this.selected.id);
          }
        });
        const frame = this.add.graphics();
        frame.lineStyle(3, 0xd5e3fc, 1);
        frame.strokeRoundedRect(x - this.cell / 2 + 4, y - this.cell / 2 + 4, this.cell - 8, this.cell - 8, 14);
      }

      def.pieces.forEach((pd, k) => {
        const c = k % 2;
        const r = Math.floor(k / 2);
        const hx = TRAY.x + 40 + c * 120;
        const hy = TRAY.y + 55 + r * 100;
        const bg = this.add.graphics();
        bg.fillStyle(0xeff4ff, 1);
        bg.fillRoundedRect(-this.cell / 2 + 6, -this.cell / 2 + 6, this.cell - 12, this.cell - 12, 14);
        const face = this.add.text(0, 0, pd.emoji, { fontSize: `${Math.min(56, this.cell - 24)}px`, fontFamily: "Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" }).setOrigin(0.5);
        const obj = this.add.container(hx, hy, [bg, face]);
        obj.setSize(this.cell - 12, this.cell - 12);
        obj.setInteractive({ useHandCursor: true, draggable: true });
        const piece: Piece = { id: pd.pieceId, correct: pd.correctPosition, obj, home: { x: hx, y: hy }, placed: false };
        obj.setData("piece", piece);
        obj.on("pointerdown", () => {
          if (!piece.placed) this.select(this.selected === piece ? null : piece);
        });
        this.pieces.push(piece);
      });
    }
  };
}
