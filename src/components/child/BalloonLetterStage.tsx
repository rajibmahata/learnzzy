"use client";
import * as React from "react";
import { type Balloon } from "@/lib/balloonMechanic";
import { BALLOON_COLOR_BG } from "@/lib/balloonMechanic";

export function BalloonLetterStage({
  balloons,
  poppedIds,
  onPop,
}: {
  balloons: Balloon[];
  poppedIds: Set<string>;
  onPop: (b: Balloon) => void;
}) {
  return (
    <div className="relative w-full h-[360px] overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 via-white to-emerald-50 border-2 border-sky-200 shadow-[0_8px_20px_rgba(56,189,248,0.15)]">
      {/* Clouds */}
      <div className="absolute top-3 left-6 w-16 h-8 bg-white/70 rounded-full blur-[0.5px]" aria-hidden />
      <div className="absolute top-6 right-10 w-20 h-8 bg-white/60 rounded-full blur-[0.5px]" aria-hidden />
      <span className="absolute top-2 left-1/2 text-amber-300 animate-pulse" aria-hidden>✨</span>
      {balloons.map((b) => {
        const popped = poppedIds.has(b.id);
        return (
          <button
            key={b.id}
            type="button"
            aria-label={`Letter ${b.payload}`}
            onClick={() => !popped && onPop(b)}
            disabled={popped}
            className={`absolute bottom-0 flex flex-col items-center justify-center rounded-full font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] active:scale-90 transition-all ${BALLOON_COLOR_BG[b.color]} ${popped ? "opacity-0 scale-0 pointer-events-none" : "animate-bounce"}`}
            style={{
              left: `${b.x}%`,
              width: `${3.2 + b.size * 0.5}rem`,
              height: `${4 + b.size * 0.6}rem`,
              animationDuration: `${1.4 + b.speed * 0.45}s`,
              animationDelay: `${b.delayMs}ms`,
            }}
          >
            <span className="text-xl drop-shadow">{b.payload}</span>
            <span className="text-[10px] opacity-80 -mt-1">🎈</span>
            {popped && <span className="absolute inset-0 flex items-center justify-center text-2xl animate-ping">💥</span>}
          </button>
        );
      })}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/40 backdrop-blur" aria-hidden />
    </div>
  );
}
