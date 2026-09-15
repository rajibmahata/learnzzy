"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { SketchStage } from "@/components/child/SketchStage";
import { Celebration } from "@/components/child/Celebration";
import { Button } from "@/components/ui/Button";
import { GAME_ROUNDS } from "@/games/framework";
import { createSketchDef, type SketchDef } from "@/games/sketch";
import { evaluateTracing } from "@/games/sketch-eval";
import type { SketchSceneApi } from "@/games/phaser/sketchScene";
import { toSketchContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";

const INK_COLORS = [
  { name: "Blue", hex: 0x0058be, css: "#0058be" },
  { name: "Red", hex: 0xd7263d, css: "#d7263d" },
  { name: "Green", hex: 0x1f9d55, css: "#1f9d55" },
  { name: "Orange", hex: 0xf4890a, css: "#f4890a" },
  { name: "Purple", hex: 0x7b2fbe, css: "#7b2fbe" },
] as const;

export default function SketchPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [done, setDone] = React.useState(false);
  const [result, setResult] = React.useState<"idle" | "good" | "retry">("idle");
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [inkColor, setInkColor] = React.useState<(typeof INK_COLORS)[number]>(INK_COLORS[0]);
  const apiRef = React.useRef<SketchSceneApi | null>(null);
  const retryRounds = React.useRef<Set<number>>(new Set());

  const { rounds, reload } = useGameRounds<SketchDef>({
    gameId: "sketch",
    difficulty: 1,
    total: GAME_ROUNDS,
    mapItem: toSketchContent,
    makeLocal: (r) => createSketchDef(`local-skt-${Date.now() % 2147483647}-${r}`, 1),
  });
  const sketch = rounds?.[round]?.content;
  const contentId = rounds?.[round]?.contentId;

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "sketch", metadata: { sessionId: getSessionId() } });
  }, []);

  // Reset per-round transient state when the round changes.
  React.useEffect(() => {
    setResult("idle");
    setStartedAt(null);
  }, [round, rounds]);

  function strokeStart() {
    if (startedAt === null) {
      setStartedAt(Date.now());
      queueEvent({ event: "drawing_started", gameId: "sketch", contentId });
    }
  }

  function clear() {
    apiRef.current?.clear();
    setResult("idle");
  }

  function pickColor(c: (typeof INK_COLORS)[number]) {
    setInkColor(c);
    apiRef.current?.setInkColor(c.hex);
  }

  function finish() {
    if (!sketch || done) return;
    const drawing = apiRef.current?.getDrawing() ?? [];
    const durationMs = startedAt === null ? 0 : Date.now() - startedAt;
    // BR-072: forgiving thresholds from the content definition.
    const evalResult = evaluateTracing(sketch.guidePath, drawing, {
      tolerance: sketch.tolerance,
      coverageThreshold: sketch.coverageThreshold,
    });
    queueEvent({
      event: "drawing_completed",
      gameId: "sketch",
      contentId,
      metadata: {
        coverage: Math.round(evalResult.coverage * 100) / 100,
        strokes: drawing.length,
        durationMs,
        shape: sketch.shape,
      },
    });
    if (evalResult.completed) {
      setResult("good");
      setTimeout(() => {
        if (round + 1 >= GAME_ROUNDS) {
          const r = award("sketch", 3);
          setReward(r);
          setDone(true);
          queueEvent({ event: "game_completed", gameId: "sketch", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
          const accuracy = Math.max(0, Math.min(1, (GAME_ROUNDS - retryRounds.current.size) / GAME_ROUNDS));
          reportGameCompletion({ gameId: "sketch", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji });
        } else {
          setRound(round + 1);
        }
      }, 900);
    } else {
      setResult("retry");
      retryRounds.current.add(round);
      queueEvent({ event: "retry_started", gameId: "sketch", contentId, metadata: { round: round + 1 } });
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="BEAUTIFUL!" stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} onReplay={() => { setRound(0); setDone(false); setReward(null); reload(); }} />
      </div>
    );
  }

  if (!sketch) {
    return (
      <GameShell title="Shadow Sketch" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Shadow Sketch" stars={totalStars}>
      <h2 className="mt-2 text-center text-instruction uppercase">TRACE THE {sketch.shape.toUpperCase()}</h2>
      <div className="mt-2">
        <SketchStage sketch={sketch} onStrokeStart={strokeStart} apiRef={apiRef} />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-on-surface-variant">✏️ Draw here</p>
      <div className="mt-2 flex items-center justify-center gap-3" role="group" aria-label="Pick a crayon color">
        {INK_COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-label={`${c.name} crayon`}
            aria-pressed={inkColor.name === c.name}
            onClick={() => pickColor(c)}
            className={`h-12 w-12 rounded-full border-4 shadow-card transition-transform active:scale-95 ${inkColor.name === c.name ? "border-on-surface scale-110" : "border-white"}`}
            style={{ backgroundColor: c.css }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={clear}>
          Clear
        </Button>
        <Button variant="success" size="lg" className="flex-1" onClick={finish}>
          Done ✓
        </Button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-[1.75rem] text-center text-lg font-bold">
        {result === "good" ? "✨ Wonderful tracing!" : result === "retry" ? "Nice try — follow the dots!" : ""}
      </p>
    </GameShell>
  );
}
