"use client";

import * as React from "react";
import { CHARACTER_VOICES, speakWithCharacter } from "@/lib/audio";

// Companion voice board — fitted from Stitch home screens
// (f929… §3 + 8bde… §5) to Learnzzy conventions: offline speechSynthesis,
// 56px+ touch targets, no alert() popups.
const COMPANIONS = [
  { id: "teddy", name: "Teddy", role: "Math Guide", emoji: "🧸", line: "Let's count the shiny red apples together!", voice: "teddy" },
  { id: "pip", name: "Pip", role: "Sorting Scout", emoji: "🐶", line: "Woof! Help me find where the big blue blocks belong!", voice: "puppy" },
  { id: "bella", name: "Bella", role: "Calm Guide", emoji: "🐰", line: "Breathe gently like the wind, and watch the birds take flight!", voice: "bunny" },
  { id: "hoot", name: "Prof Hoot", role: "Logic Sage", emoji: "🦉", line: "Hoo hoo! Look closely at the wooden puzzle edge. Does it curve?", voice: "owl" },
  { id: "ellie", name: "Ellie", role: "Tracing Friend", emoji: "🐘", line: "Follow the sparkling rainbow star with your fingertip!", voice: "elephant" },
] as const;

export function HomeVoiceBoard() {
  const [active, setActive] = React.useState<(typeof COMPANIONS)[number]>(COMPANIONS[0]);

  function listen(c: (typeof COMPANIONS)[number]) {
    setActive(c);
    const v = CHARACTER_VOICES[c.voice] ?? { rate: 0.9, pitch: 1.1 };
    speakWithCharacter(c.line, { lang: "en-US", rate: v.rate, pitch: v.pitch });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-surface-high bg-white p-4 shadow-pillow sm:flex-row">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary-fixed text-4xl">
            {active.emoji}
          </span>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wider text-primary">{active.name} • {active.role}</p>
            <p className="text-lg font-extrabold">“{active.line}”</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => listen(active)}
          className="tactile flex min-h-touch min-w-[140px] items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-white shadow-[0_4px_0_#004395]"
        >
          🔊 Hear Voice
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {COMPANIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => listen(c)}
            aria-pressed={active.id === c.id}
            className={`tactile flex min-h-touch flex-col items-center rounded-2xl border-2 bg-white p-4 text-center shadow-pillow ${
              active.id === c.id ? "border-primary" : "border-stroke"
            }`}
          >
            <span aria-hidden className="char char-idle text-5xl">{c.emoji}</span>
            <span className="mt-1 font-extrabold">{c.name}</span>
            <span className="text-xs font-bold text-muted">{c.role}</span>
            <span className="mt-2 rounded-full bg-surface-low px-3 py-1 text-xs font-black text-primary">▶ Listen</span>
          </button>
        ))}
      </div>
    </div>
  );
}
