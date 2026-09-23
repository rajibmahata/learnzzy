"use client";

import * as React from "react";
import { cacheProfile, getCachedProfile, getLearnerId, type LearnerProfile } from "./learner";

// Single writer for the learner's global level (fixes key fragmentation:
// games used learnzzy.learner.v1 while the profile lives in
// learnzzy.learnerProfile.v1 — level-ups never reached rewards/dashboard).
const LEGACY_LEVEL_KEY = "learnzzy.learner.v1";
const GLOBAL_LEVEL_KEY = "learnzzy.globalLevel.v1";

export function readGlobalLevel(fallback = 1): number {
  if (typeof window === "undefined") return fallback;
  try {
    const profile = getCachedProfile();
    if (profile && typeof profile.level === "number" && profile.level >= 1) {
      return Math.min(100, profile.level);
    }
    const legacy = localStorage.getItem(LEGACY_LEVEL_KEY);
    if (legacy) {
      const p = JSON.parse(legacy) as { level?: number };
      if (typeof p.level === "number" && p.level >= 1) {
        migrateLegacyLevel(p.level);
        return Math.min(100, p.level);
      }
    }
    const global = Number(localStorage.getItem(GLOBAL_LEVEL_KEY));
    if (Number.isInteger(global) && global >= 1) return Math.min(100, global);
  } catch {}
  return fallback;
}

function migrateLegacyLevel(level: number) {
  try {
    const profile = getCachedProfile();
    if (profile) cacheProfile({ ...profile, level });
    localStorage.setItem(GLOBAL_LEVEL_KEY, String(level));
    const legacy = localStorage.getItem(LEGACY_LEVEL_KEY);
    if (legacy) {
      const p = JSON.parse(legacy);
      localStorage.setItem(LEGACY_LEVEL_KEY, JSON.stringify({ ...p, level }));
    }
  } catch {}
}

/** Bump (or set) the canonical global level. Returns the new level (1..100). */
export function bumpGlobalLevel(current: number, delta = 1): number {
  const next = Math.max(1, Math.min(100, current + delta));
  writeGlobalLevel(next);
  return next;
}

export function writeGlobalLevel(level: number): number {
  const next = Math.max(1, Math.min(100, level));
  if (typeof window === "undefined") return next;
  try {
    localStorage.setItem(GLOBAL_LEVEL_KEY, String(next));
    const profile = getCachedProfile();
    if (profile) {
      cacheProfile({ ...profile, level: next });
    } else if (getLearnerId()) {
      // Minimal profile so rewards/dashboard can read the level offline.
      cacheProfile({ learnerId: getLearnerId()!, ageBand: "6-7", level: next });
    }
    const legacy = localStorage.getItem(LEGACY_LEVEL_KEY);
    if (legacy) {
      const p = JSON.parse(legacy);
      localStorage.setItem(LEGACY_LEVEL_KEY, JSON.stringify({ ...p, level: next }));
    } else {
      localStorage.setItem(LEGACY_LEVEL_KEY, JSON.stringify({ level: next }));
    }
  } catch {}
  return next;
}

export interface LevelUpResult {
  from: number;
  to: number;
  promoted: boolean;
}

/**
 * Reset-in-place "continue to next level" without window.location.reload().
 * Writes the new level, bumps a nonce so round fetchers re-run, and clears
 * transient play state via the provided reset callback.
 */
export function useLevelUp(currentLevel: number): {
  level: number;
  setLevel: (n: number) => void;
  continueHarder: (opts?: { reset?: () => void; nonce?: number }) => LevelUpResult;
  registerReset: (fn: () => void) => void;
} {
  const [level, setLevelState] = React.useState(() => currentLevel);
  const resetRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    setLevelState(currentLevel);
  }, [currentLevel]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === GLOBAL_LEVEL_KEY || e.key === "learnzzy.learnerProfile.v1") {
        setLevelState(readGlobalLevel(level));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerReset = React.useCallback((fn: () => void) => {
    resetRef.current = fn;
  }, []);

  const continueHarder = React.useCallback(
    (opts?: { reset?: () => void; nonce?: number }): LevelUpResult => {
      const from = level;
      const to = bumpGlobalLevel(from, 1);
      setLevelState(to);
      const reset = opts?.reset ?? resetRef.current;
      reset?.();
      return { from, to, promoted: true };
    },
    [level]
  );

  return { level, setLevel: setLevelState, continueHarder, registerReset };
}
