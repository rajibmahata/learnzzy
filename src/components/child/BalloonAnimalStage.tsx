"use client";
import * as React from "react";
import { type Balloon } from "@/lib/balloonMechanic";
import { BALLOON_COLOR_BG } from "@/lib/balloonMechanic";

export function BalloonAnimalStage({ balloons, poppedIds, onPop }: { balloons: Balloon[]; poppedIds: Set<string>; onPop: (b: Balloon) => void }) {
  return (
    <div className="relative w-full h-[360px] overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50 via-white to-emerald-50 border-2 border-amber-100 p-2">
      <div className="absolute top-2 left-4 px-2 py-1 rounded-full bg-white/80 text-xs font-bold shadow">Find the cat! 🐱</div>
      {balloons.map((b) => {
        const popped = poppedIds.has(b.id);
        return (
          <button
            key={b.id}
            type="button"
            aria-label={`Animal ${b.payload}`}
            onClick={() => !popped && onPop(b)}
            disabled={popped}
            className={`absolute bottom-0 flex flex-col items-center justify-center rounded-full font-black shadow-[0_4px_0_rgba(0,0,0,0.15)] active:scale-90 transition-all ${BALLOON_COLOR_BG[b.color]} ${popped ? "opacity-0 scale-0" : "animate-bounce"}`}
            style={{ left: `${b.x}%`, width: `${3.4 + b.size * 0.5}rem`, height: `${4.2 + b.size * 0.6}rem`, animationDuration: `${1.3 + b.speed * 0.4}s`, animationDelay: `${b.delayMs}ms` }}
          >
            <span className="text-2xl drop-shadow">{b.payload}</span>
            <span className="text-[10px] -mt-1">🎈</span>
            {popped && <span className="absolute inset-0 flex items-center justify-center text-2xl">💥</span>}
          </button>
        );
      })}
    </div>
  );
}
