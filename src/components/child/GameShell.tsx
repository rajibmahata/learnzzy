"use client";

import * as React from "react";
import { GameHeader } from "./GameHeader";
import { isSoundMuted, setSoundMuted } from "@/lib/audio";

export function GameShell({
  title,
  stars,
  children,
}: {
  title: string;
  stars: number;
  children: React.ReactNode;
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
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 pb-6">
      <GameHeader title={title} stars={stars} soundOn={soundOn} onToggleSound={toggle} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
