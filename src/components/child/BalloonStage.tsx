"use client";
import * as React from "react";
import { BALLOON_COLOR_BG, type Balloon } from "@/lib/balloonMechanic";

export function BalloonStage({ balloons, onPop, poppedIds }: { balloons: Balloon[]; onPop: (b: Balloon) => void; poppedIds: Set<string> }) {
  return (
    <div className="relative w-full h-64 overflow-hidden rounded-xl bg-gradient-to-b from-sky-100 via-white to-emerald-50 border-2 border-sky-100 p-2">
      {balloons.map((b) => {
        const popped = poppedIds.has(b.id);
        return (
          <button
            key={b.id}
            type="button"
            aria-label={`Balloon ${b.payload} ${b.color}`}
            onClick={() => !popped && onPop(b)}
            disabled={popped}
            className={`absolute bottom-0 flex flex-col items-center justify-center rounded-full text-white font-black shadow-[0_4px_0_rgba(0,0,0,0.15)] active:scale-95 transition-all ${BALLOON_COLOR_BG[b.color]} ${popped ? "opacity-30 scale-75 pointer-events-none" : "animate-bounce"}`}
            style={{
              left: `${b.x}%`,
              width: `${2.5 + b.size * 0.6}rem`,
              height: `${3.2 + b.size * 0.7}rem`,
              animationDuration: `${1.2 + b.speed * 0.4}s`,
              animationDelay: `${b.delayMs}ms`,
              transform: popped ? "scale(0.5)" : undefined,
            }}
          >
            <span className="text-lg">{b.payloadKind === "color" ? "●" : b.payload}</span>
            {!popped && <span className="absolute -bottom-2 text-xs">🎈</span>}
            {popped && <span className="absolute inset-0 flex items-center justify-center text-xl">💥</span>}
          </button>
        );
      })}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/60" aria-hidden />
    </div>
  );
}
