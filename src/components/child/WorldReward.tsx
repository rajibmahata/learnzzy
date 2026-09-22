"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import type { Sticker } from "@/lib/rewards";
import { CharacterGuide } from "./CharacterGuide";
import type { CharacterId } from "@/lib/characters";
import { speakWithCharacter } from "@/lib/audio";
import { praiseFor } from "@/lib/companion";
import { selectWorldEvent, type WorldRewardEvent } from "@/lib/worldRewards";
import { BalloonBurst } from "./BalloonBurst";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      return undefined;
    }
  }, []);
  return reduced;
}

const ENV_BG: Record<string, string> = {
  jungle: "from-emerald-900 via-green-800 to-amber-900",
  ocean: "from-sky-900 via-blue-800 to-cyan-900",
  sky: "from-sky-400 via-violet-300 to-pink-200",
  space: "from-slate-900 via-violet-900 to-indigo-900",
  garden: "from-green-900 via-emerald-800 to-lime-900",
  playroom: "from-amber-900 via-orange-800 to-red-900",
};

const COMPANION_LINES: Record<string, string[]> = {
  excited: ["Whoa! Did you see that? ✨", "Something BIG is coming! 🌟", "Wow! Look! 💫"],
  happy: ["So wonderful! 🎉", "You did it! 🌈", "Amazing, friend! ⭐"],
  curious: ["Shhh... did you hear that? 👂", "What's that sound? ✨", "Something is near... 🌟"],
  surprised: ["Whoa! It's here! 😮", "So big and friendly! 💫", "Hello, new friend! 🌈"],
};

function pickLine(kind: string, seed: string): string {
  const pool = COMPANION_LINES[kind] ?? COMPANION_LINES.happy;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return pool[(h >>> 0) % pool.length]!;
}

export interface WorldRewardProps {
  sticker: Sticker;
  character?: CharacterId;
  stickerCount?: number;
  levelProgress?: { from: number; to: number; promoted: boolean; gameName?: string } | null;
  milestone?: { emoji: string; name: string; message: string } | null;
  variantSeed?: string;
  continueLabel?: string;
  onContinue?: () => void;
  onReplay?: () => void;
}

export function WorldReward({ sticker, character = "teddy", stickerCount, levelProgress, milestone, variantSeed, continueLabel, onContinue, onReplay }: WorldRewardProps) {
  const reducedMotion = useReducedMotion();
  const event: WorldRewardEvent = React.useMemo(() => selectWorldEvent(sticker.id, variantSeed ?? sticker.id), [sticker.id, variantSeed]);
  const [phase, setPhase] = React.useState<"enter" | "settle" | "reveal">("enter");
  const [companionLine, setCompanionLine] = React.useState(() => pickLine("curious", `${sticker.id}:enter`));

  React.useEffect(() => {
    // Phase 1: curious → enter (1.2s)
    const t1 = setTimeout(() => {
      setCompanionLine(pickLine(event.companionReaction, `${sticker.id}:arrival`));
      setPhase("settle");
      // Voice: companion reacts naturally, not robotic
      const voice = praiseFor({ characterId: character, moment: "celebration", count: stickerCount ?? 0, salt: sticker.id });
      speakWithCharacter(pickLine(event.companionReaction, `${sticker.id}:voice`), { lang: "en-US", rate: voice.rate, pitch: voice.pitch, characterId: character });
    }, 1200);
    // Phase 2: settle → reveal (after creature has crossed)
    const t2 = setTimeout(() => {
      setPhase("reveal");
      setCompanionLine(pickLine("happy", `${sticker.id}:reveal`));
      const voice = praiseFor({ characterId: character, moment: "celebration", count: (stickerCount ?? 0) + 1, salt: `${sticker.id}:reveal` });
      speakWithCharacter(voice.line, { lang: "en-US", rate: voice.rate, pitch: voice.pitch, characterId: character });
    }, event.durationMs - 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [character, event.companionReaction, event.durationMs, sticker.id, stickerCount]);

  // Full-screen experience — not constrained to game canvas
  return (
    <section aria-live="polite" aria-label="World reward" className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Environment */}
      <div className={`absolute inset-0 bg-gradient-to-br ${ENV_BG[event.environment] ?? ENV_BG.playroom}`} aria-hidden />
      {/* Subtle ground + lighting */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
      <div className="absolute top-6 left-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-amber-200/20 blur-xl" aria-hidden />
      {/* Particles */}
      {!reducedMotion && event.particleEffects.includes("sparkles") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="absolute animate-bounce text-lg" style={{ left: `${10 + i * 11}%`, top: `${6 + (i % 3) * 10}%`, animationDelay: `${i * 0.2}s`, animationDuration: `${1.2 + (i % 2) * 0.5}s` }}>
              ✨
            </span>
          ))}
        </div>
      )}
      {!reducedMotion && event.particleEffects.includes("dust") && phase !== "reveal" && (
        <div className="absolute bottom-6 left-0 right-0 h-8 bg-gradient-to-t from-amber-900/20 to-transparent blur-md" aria-hidden />
      )}
      {!reducedMotion && event.particleEffects.includes("waves") && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-sky-400/30 via-blue-300/20 to-transparent" aria-hidden>
          <div className="absolute bottom-2 left-0 right-0 h-2 bg-white/20 blur-sm" aria-hidden />
        </div>
      )}

      {/* Companion top bar */}
      <div className="relative z-10 flex items-center gap-3 p-4 pt-safe">
        <CharacterGuide character={character} state={phase === "enter" ? "curious" : phase === "settle" ? "surprised" : "celebrating"} compact line={companionLine} />
      </div>

      {/* Creature / Object — traverses full viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {phase !== "reveal" ? (
          <div
            aria-hidden
            className={`select-none ${reducedMotion ? "" : event.animation === "walk" ? "animate-[walk_6s_linear]" : event.animation === "sail" ? "animate-[sail_6.5s_linear]" : event.animation === "fly" ? "animate-[fly_5.5s_ease-in-out]" : "animate-bounce"}`}
            style={
              reducedMotion
                ? { fontSize: `${event.asset.scale * 5}rem` }
                : event.asset.entranceDirection === "right"
                  ? ({ fontSize: `${event.asset.scale * 5}rem`, animation: `${event.animation === "walk" ? "walkAcross" : event.animation === "sail" ? "sailAcross" : "flyAcross"} ${event.durationMs}ms linear forwards` } as React.CSSProperties)
                  : { fontSize: `${event.asset.scale * 5}rem` }
            }
          >
            {event.asset.emoji}
            {/* Shadow */}
            <div className="mx-auto mt-1 h-2 w-16 rounded-full bg-black/15 blur-sm" aria-hidden />
          </div>
        ) : (
          // Settled — friendly idle
          <div aria-hidden className="text-center" style={{ fontSize: `${event.asset.scale * 4}rem` }}>
            <span className={reducedMotion ? "" : "animate-bounce"} style={{ animationDuration: "1.6s" } as React.CSSProperties}>
              {event.asset.emoji}
            </span>
            <p className="mt-2 text-white font-black drop-shadow text-lg">
              {event.asset.emoji} {sticker.name.toUpperCase()} DISCOVERED!
            </p>
          </div>
        )}
        {/* Inline keyframes for walk/sail/fly — full viewport */}
        <style>{`
          @keyframes walkAcross { from { transform: translateX(55vw) scale(${event.asset.scale}); } to { transform: translateX(-55vw) scale(${event.asset.scale}); } }
          @keyframes sailAcross { from { transform: translateX(55vw) translateY(2px) scale(${event.asset.scale}); } to { transform: translateX(-55vw) translateY(-2px) scale(${event.asset.scale}); } }
          @keyframes flyAcross { 0% { transform: translateX(55vw) translateY(10px) scale(${event.asset.scale}); } 50% { transform: translateX(0) translateY(-14px) scale(${event.asset.scale}); } 100% { transform: translateX(-55vw) translateY(6px) scale(${event.asset.scale}); } }
        `}</style>
      </div>

      {/* Sticker reveal — center burst, 3D-like */}
      {phase === "reveal" && (
        <div className="relative z-10 flex flex-col items-center p-4 pb-safe">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 rounded-full bg-amber-200/40 blur-2xl animate-pulse" aria-hidden />
            <div className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-200 to-orange-300 text-6xl shadow-[0_8px_0_#ffb95f] border-4 border-white ${reducedMotion ? "" : "animate-bounce"}`} style={{ animationDuration: "1.4s" } as React.CSSProperties}>
              <span aria-hidden className={reducedMotion ? "" : "animate-spin"} style={{ animationDuration: "3s" } as React.CSSProperties}>
                {sticker.emoji}
              </span>
              <span aria-hidden className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</span>
              <span aria-hidden className="absolute -bottom-1 -left-1 text-xl animate-ping">💫</span>
            </div>
            <p className="mt-3 rounded-full bg-gradient-to-r from-tertiary to-emerald-400 px-4 py-1.5 text-sm font-black text-white shadow-md">🎉 New Sticker: {sticker.name}!</p>
            <p className="mt-1 text-xs font-bold text-white drop-shadow">Added to your magical collection ✨</p>
            {levelProgress && (
              <div className="mt-3 w-full max-w-sm rounded-2xl bg-white/90 backdrop-blur p-3 text-center shadow-lg">
                <p className="text-xs font-black uppercase tracking-wider text-primary">Level {levelProgress.from} ✓ Completed</p>
                <p aria-hidden>↓</p>
                {levelProgress.promoted ? (
                  <p className="text-sm font-extrabold">Level {levelProgress.to} <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs">★ Next</span></p>
                ) : (
                  <p className="text-sm font-bold text-on-surface-variant">Level {levelProgress.from} — keep practicing</p>
                )}
              </div>
            )}
            {milestone && (
              <p className="mt-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-black shadow"> {milestone.emoji} {milestone.name}! {milestone.message}</p>
            )}
            <p className="mt-2 font-black text-white text-lg drop-shadow">⭐ +3 Stars!</p>
            <BalloonBurst />
          </div>
          <div className="mt-4 flex w-full max-w-sm flex-col gap-3">
            {onReplay && (
              <Button size="xl" className="w-full shadow-lg" onClick={onReplay}>
                PLAY AGAIN ✨
              </Button>
            )}
            {onContinue ? (
              <Button size="xl" variant="primary" className="w-full" onClick={onContinue}>
                {continueLabel ?? "Continue →"}
              </Button>
            ) : (
              <Link href="/play" className="w-full">
                <Button variant="outline" size="lg" className="w-full bg-white/90">
                  🏠 Home
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
      {phase !== "reveal" && <p className="relative z-10 pb-6 text-center text-white/80 text-xs font-bold animate-pulse">Watch what appears… ✨</p>}
    </section>
  );
}
