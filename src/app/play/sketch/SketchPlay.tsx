"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { SketchStage } from "@/components/child/SketchStage";
import { Celebration } from "@/components/child/Celebration";
import { WorldReward } from "@/components/child/WorldReward";
import { GuideCard, ClueButton } from "@/components/child/WonderBits";
import { stateForMoment } from "@/lib/characters";
import { speakWithCharacter, CHARACTER_VOICES } from "@/lib/audio";
import { artForGame } from "@/lib/worlds";
import { Button } from "@/components/ui/Button";
import { GAME_ROUNDS } from "@/games/framework";
import { createSketchActivity, type SketchActivity } from "@/games/sketch";
import { evaluateTracing } from "@/games/sketch-eval";
import type { SketchSceneApi } from "@/games/phaser/sketchScene";
import { toSketchContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";
import { LockedAdventure } from "@/components/child/LockedAdventure";

// Starlight wand palette (Stitch sketch): same six ink slots, Stitch color
// story names. "Red" keeps its e2e-pinned accessible name.
const INK_COLORS = [
  { name: "Sky Aqua", hex: 0x38bdf8, css: "#38bdf8" },
  { name: "Starlight", hex: 0xf5b301, css: "#f5b301" },
  { name: "Red", hex: 0xd7263d, css: "#d7263d" },
  { name: "Rainbow", hex: 0xf472b6, css: "#f472b6" },
  { name: "Berry", hex: 0xa21caf, css: "#a21caf" },
  { name: "Green", hex: 0x1f9d55, css: "#1f9d55" },
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
  const hintOpens = React.useRef(0);
  const gameStart = React.useRef(Date.now());

  const [hintOpen, setHintOpen] = React.useState(false);
  const { rounds, reload, locked } = useGameRounds<SketchActivity>({
    gameId: "sketch",
    difficulty: 1,
    total: GAME_ROUNDS,
    mapItem: toSketchContent,
    makeLocal: (r) => createSketchActivity(`local-skt-${Date.now() % 2147483647}-${r}`, 1),
  });
  const sketch = rounds?.[round]?.content;
  const contentId = rounds?.[round]?.contentId;
  const instruction = sketch?.instruction ?? (sketch ? `TRACE THE ${sketch.shape.toUpperCase()}` : "");

  function openHint() {
    if (!sketch) return;
    setHintOpen(true);
    hintOpens.current += 1;
    queueEvent({ event: "hint_used", gameId: "sketch", contentId, metadata: { shape: sketch.shape } });
  }

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "sketch", metadata: { sessionId: getSessionId() } });
  }, []);

  // Reset per-round transient state when the round changes.
  React.useEffect(() => {
    setResult("idle");
    setStartedAt(null);
    setHintOpen(false);
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
          reportGameCompletion({ gameId: "sketch", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji, hintsUsed: hintOpens.current, durationMs: Date.now() - gameStart.current });
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
    if (reward?.sticker) return <WorldReward sticker={reward.sticker} character="bunny" variantSeed={reward.sticker.id} onReplay={() => { setRound(0); setDone(false); setReward(null); reload(); }} />;
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="BEAUTIFUL!" stars={reward?.stars ?? 3} sticker={reward?.sticker ?? null} character="bunny" onReplay={() => { setRound(0); setDone(false); setReward(null); reload(); }} />
      </div>
    );
  }

  if (locked) return <LockedAdventure title="Shadow Sketch" />;

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
      {/* Starlight Trace (Stitch sketch): Bella Bunny guide + wand palette.
          Tracing mechanics, thresholds, and e2e contracts untouched. */}
      <div className="mt-3 flex justify-center">
        <h2 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-1.5 text-[14px] font-black uppercase tracking-wider text-white shadow-[0_3px_0_#6b21a8]">
          ✨ {instruction || "Starlight Trace"}
        </h2>
      </div>
      <div className="mt-2">
        <GuideCard
          character="bunny"
          state={stateForMoment({
            feedback: result === "good" ? "good" : result === "retry" ? "retry" : "idle",
            tracing: startedAt !== null && result === "idle",
          })}
          name="BELLA BUNNY 🐰"
          line="Trace the glowing rainbow star trail with your magic finger!"
          listenLabel="Listen"
          onListen={() => {
            const v = CHARACTER_VOICES.bunny ?? CHARACTER_VOICES.teddy;
            speakWithCharacter("Trace the glowing rainbow star trail with your magic finger!", {
              lang: "en-US",
              rate: v.rate,
              pitch: v.pitch,
            });
          }}
          art={artForGame("sketch")}
          tint="from-violet-50 via-white to-fuchsia-50"
          border="border-violet-200"
        />
      </div>
      <div className="mt-2 flex justify-center">
        <ClueButton label="Need a Clue? Let's trace together!" ariaLabel="Show a hint" onClick={openHint} />
      </div>
      {hintOpen && (
        <div role="dialog" aria-label="Hint" className="safe-panel mx-auto mt-2 w-full max-w-md p-4">
          <img src={artForGame("sketch") ?? undefined} alt="" aria-hidden loading="lazy" className="h-24 w-full rounded-xl object-cover" />
          <p className="mt-2 text-sm font-black text-on-surface">💡 Let&apos;s trace together!</p>
          <p className="mt-1 text-sm text-on-surface-variant">{sketch.hint ?? "Follow the dots slowly."}</p>
          <button
            type="button"
            onClick={() => setHintOpen(false)}
            aria-label="Close hint"
            className="tactile mt-3 min-h-12 w-full rounded-full bg-primary-container text-sm font-black text-white shadow-[0_4px_0_#004395]"
          >
            Got it!
          </button>
        </div>
      )}
      {/* Starlight frame: night-sky gradient around the vector canvas.
          The guide itself stays vector-drawn (no image assets involved). */}
      <div className="mt-2 rounded-2xl bg-gradient-to-b from-[#1b2350] via-[#2b3a6b] to-[#0f1533] p-2 shadow-card">
        <div className="overflow-hidden rounded-xl">
          <SketchStage sketch={sketch} onStrokeStart={strokeStart} apiRef={apiRef} />
        </div>
        <p className="py-1 text-center text-xs font-bold text-amber-200" aria-hidden>
          ✨ Trace among the starlight ✨
        </p>
      </div>
      <p className="mt-2 text-center text-sm font-bold text-on-surface-variant">✏️ Draw here</p>
      <p className="mt-1 text-center text-xs font-black uppercase tracking-wider text-fuchsia-700">🪄 Magic Wand Colors — tap to swap glow</p>
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
