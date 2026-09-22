"use client";

import * as React from "react";
import { getCachedProfile } from "./learner";
import { skillLevelFor } from "./skillLevels";

/**
 * Per-game skill level (1..5) — learner-specific, server-authoritative via
 * `gameLevels`, but readable instantly from the cached profile. Refreshes on
 * focus and on the global `learnzzy:rewards` event that reportGameCompletion
 * fires after a successful skill adjustment.
 */
export function useSkillLevel(gameId: string): number {
  const [level, setLevel] = React.useState<number>(() => {
    const p = getCachedProfile();
    return p ? skillLevelFor(p as unknown as { level?: number; gameLevels?: Record<string, number> }, gameId) : 1;
  });

  React.useEffect(() => {
    const refresh = () => {
      const p = getCachedProfile();
      setLevel(p ? skillLevelFor(p as unknown as { level?: number; gameLevels?: Record<string, number> }, gameId) : 1);
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("learnzzy:rewards", refresh as EventListener);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("learnzzy:rewards", refresh as EventListener);
      window.removeEventListener("storage", refresh);
    };
  }, [gameId]);

  return level;
}
