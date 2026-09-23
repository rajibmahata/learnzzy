"use client";

import * as React from "react";
import { GameHeader } from "./GameHeader";
import { PetCompanion } from "./PetCompanion";
import { isSoundMuted, setSoundMuted } from "@/lib/audio";

export function GameShell({
  title,
  stars,
  children,
  /** Optional round progress passed through to the header. */
  progress,
  level,
}: {
  title: string;
  stars: number;
  children: React.ReactNode;
  progress?: { current: number; total: number };
  level?: number;
}) {
  // Persisted mute preference (§18): one toggle honored by every voice call.
  const [soundOn, setSoundOn] = React.useState(true);
  React.useEffect(() => {
    setSoundOn(!isSoundMuted());
  }, []);
  function toggle() {
    setSoundOn((s) => {
      setSoundMuted(s);
      return !s;
    });
  }
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-game flex-col px-4 pb-6">
      <GameHeader title={title} stars={stars} soundOn={soundOn} onToggleSound={toggle} progress={progress} level={level} />
      <div className="relative flex flex-1 flex-col">
        {children}
        {/* Personal pet in dedicated safe corner — decorative, hidden from AT */}
        <div className="pointer-events-none absolute bottom-2 right-2 h-24 w-28" aria-hidden>
          <PetCompanion context="game" size="sm" />
        </div>
      </div>
    </div>
  );
}
