"use client";

// Per-window identity so each open tab/window gets different games/content.
// Uses sessionStorage (tab-scoped, not localStorage) so windows diverge.
// Falls back to Math.random when storage unavailable (e.g. SSR).

const WINDOW_KEY = "learnzzy.windowId.v1";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getWindowId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(WINDOW_KEY);
    if (!id) {
      id = `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(WINDOW_KEY, id);
      // Also register this window in a shared registry so /play can know how many
      // windows are open and optionally diversify further (not required for core).
      try {
        const regKey = "learnzzy.openWindows.v1";
        const raw = localStorage.getItem(regKey);
        const arr: string[] = raw ? JSON.parse(raw) : [];
        if (!arr.includes(id)) {
          arr.push(id);
          localStorage.setItem(regKey, JSON.stringify(arr.slice(-20)));
        }
        // Cleanup on close
        window.addEventListener("beforeunload", () => {
          try {
            const cur = JSON.parse(localStorage.getItem(regKey) || "[]") as string[];
            localStorage.setItem(regKey, JSON.stringify(cur.filter((x) => x !== id)));
          } catch {}
        });
      } catch {}
    }
    return id;
  } catch {
    return `w_fallback_${Math.random().toString(36).slice(2)}`;
  }
}

export function getWindowSeed(): number {
  return hashString(getWindowId());
}

// Deterministic shuffle using mulberry32 - same seed => same order, different
// windows (different seeds) => different game/content order, never same games
// across simultaneously open windows if seeds differ.
import { mulberry32 } from "@/games/framework";

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Convenience: shuffled copy of games/content for this window.
export function shuffledForWindow<T>(arr: T[]): T[] {
  if (typeof window === "undefined") return arr;
  return shuffleWithSeed(arr, getWindowSeed());
}
