"use client";

import * as React from "react";
import { isSoundMuted, setSoundMuted } from "@/lib/audio";

export function SoundToggle() {
  const [on, setOn] = React.useState(true);
  React.useEffect(() => {
    setOn(!isSoundMuted());
  }, []);
  return (
    <button
      type="button"
      aria-label={on ? "Mute sound" : "Turn sound on"}
      aria-pressed={on}
      onClick={() => {
        setOn((v) => {
          setSoundMuted(v);
          return !v;
        });
      }}
      className="tactile flex h-11 w-11 items-center justify-center rounded-full bg-surface-high text-lg text-primary shadow-[0_2px_0_#adc6ff]"
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}
