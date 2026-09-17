"use client";

import * as React from "react";

// Simple sticker + stars reward system.
// Persisted in localStorage (shared across windows/tabs) so collected
// stickers survive reloads. Stars are aggregated. No PII.

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  gameId: string;
  earnedAt: string;
}

export interface RewardsState {
  totalStars: number;
  stickers: Sticker[];
}

const KEY = "learnzzy.rewards.v1";

const STICKER_POOL: Record<string, { emoji: string; name: string }[]> = {
  addition: [
    { emoji: "🍎", name: "Apple Star" },
    { emoji: "🌟", name: "Number Star" },
    { emoji: "🎈", name: "Counting Balloon" },
    { emoji: "🍓", name: "Berry Star" },
    { emoji: "🏆", name: "Math Champion" },
  ],
  subtraction: [
    { emoji: "🐦", name: "Little Bird" },
    { emoji: "🪶", name: "Feather" },
    { emoji: "🌤️", name: "Sunny Sky" },
    { emoji: "⭐", name: "Subtraction Star" },
    { emoji: "🎈", name: "Fly Away" },
  ],
  "clean-up": [
    { emoji: "🧹", name: "Super Cleaner" },
    { emoji: "✨", name: "Sparkle" },
    { emoji: "🧸", name: "Tidy Teddy" },
    { emoji: "🌟", name: "Clean Star" },
    { emoji: "🏅", name: "Tidy Champion" },
  ],
  puzzle: [
    { emoji: "🧩", name: "Puzzle Master" },
    { emoji: "🎨", name: "Art Star" },
    { emoji: "🌈", name: "Rainbow Puzzle" },
    { emoji: "⭐", name: "Logic Star" },
    { emoji: "🏆", name: "Puzzle Champion" },
  ],
  sketch: [
    { emoji: "✏️", name: "Magic Pencil" },
    { emoji: "🎨", name: "Artist Star" },
    { emoji: "🌟", name: "Sketch Star" },
    { emoji: "🖍️", name: "Color Burst" },
    { emoji: "🏆", name: "Sketch Champion" },
  ],
  discover: [
    { emoji: "🧭", name: "Little Explorer" },
    { emoji: "🦜", name: "Bird Buddy" },
    { emoji: "🍎", name: "Fruit Finder" },
    { emoji: "🎨", name: "Color Champion" },
    { emoji: "🏆", name: "Discovery Star" },
  ],
};

function load(): RewardsState {
  if (typeof window === "undefined") return { totalStars: 0, stickers: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { totalStars: 0, stickers: [] };
    const p = JSON.parse(raw) as RewardsState;
    if (typeof p.totalStars !== "number" || !Array.isArray(p.stickers)) return { totalStars: 0, stickers: [] };
    return p;
  } catch {
    return { totalStars: 0, stickers: [] };
  }
}

function save(s: RewardsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function getRewards(): RewardsState {
  return load();
}

export function addReward(gameId: string, starsAwarded = 3): { stars: number; sticker: Sticker } {
  const pool = STICKER_POOL[gameId] ?? STICKER_POOL["addition"];
  // Pick sticker deterministically per window but with time entropy so
  // consecutive completions in same window don't repeat.
  let idx = 0;
  try {
    const wId = sessionStorage.getItem("learnzzy.windowId.v1") || "";
    let h = 0;
    const s = `${wId}:${gameId}:${Date.now()}`;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0);
    idx = h % pool.length;
  } catch {
    idx = Math.floor(Math.random() * pool.length);
  }
  const pick = pool[idx];
  const sticker: Sticker = {
    id: `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    emoji: pick.emoji,
    name: pick.name,
    gameId,
    earnedAt: new Date().toISOString(),
  };
  const cur = load();
  const next: RewardsState = {
    totalStars: cur.totalStars + starsAwarded,
    stickers: [...cur.stickers, sticker].slice(-100),
  };
  save(next);
  // Notify other windows/tabs
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: JSON.stringify(next) }));
  } catch {}
  return { stars: starsAwarded, sticker };
}

export function useRewards() {
  const [state, setState] = React.useState<RewardsState>({ totalStars: 0, stickers: [] });

  React.useEffect(() => {
    setState(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(load());
    };
    const onFocus = () => setState(load());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    // Also poll for same-window updates via custom event
    const onCustom = () => setState(load());
    window.addEventListener("learnzzy:rewards", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("learnzzy:rewards", onCustom as EventListener);
    };
  }, []);

  const award = React.useCallback((gameId: string, stars = 3) => {
    const r = addReward(gameId, stars);
    try {
      window.dispatchEvent(new CustomEvent("learnzzy:rewards"));
    } catch {}
    setState(load());
    return r;
  }, []);

  return { ...state, award };
}
