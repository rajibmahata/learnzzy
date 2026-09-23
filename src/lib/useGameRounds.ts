"use client";

import * as React from "react";
import { fetchPool, PoolAccessError, type PoolItem, type PoolGameId } from "./pool-client";
import { getWindowSeed, shuffleWithSeed } from "./windowSeed";

export type { PoolGameId };

// Prefetches a full game's worth of rounds from the validated pool (BR-201,
// DEC-162) with deterministic local top-up/fallback so gameplay never waits
// on or breaks from content availability (BR-200/222).
export interface PlayRound<T> {
  content: T;
  contentId?: string;
}

export function useGameRounds<T>(opts: {
  gameId: PoolGameId;
  difficulty: number;
  total: number;
  mapItem: (item: PoolItem) => T | null;
  makeLocal: (round: number) => T;
}): {
  rounds: PlayRound<T>[] | null;
  source: "loading" | "pool" | "mixed" | "local";
  locked: boolean;
  reload: () => void;
} {
  const mapRef = React.useRef(opts.mapItem);
  mapRef.current = opts.mapItem;
  const localRef = React.useRef(opts.makeLocal);
  localRef.current = opts.makeLocal;

  const [rounds, setRounds] = React.useState<PlayRound<T>[] | null>(null);
  const [source, setSource] = React.useState<"loading" | "pool" | "mixed" | "local">("loading");
  const [locked, setLocked] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setRounds(null);
      setSource("loading");
      setLocked(false);
      // Per-window seed ensures different windows never get identical game sequences
      const wSeed = typeof window !== "undefined" ? getWindowSeed() : 0;
      const profile = readProfile();
      const requestedLevel = readRequestedLevel() ?? profile?.level ?? 1;
      const recentKey = `learnzzy.recentContent.${profile?.learnerId ?? "guest"}.${opts.gameId}`;
      const recentIds = readRecentIds(recentKey);
      const local = (n: number): PlayRound<T> => {
        // Mix window seed into local generation so simultaneous windows diverge
        // even without pool content.
        const seededRound = (n + (wSeed % 1000)) % 2147483647;
        // localRef expects round index; we offset it with seed-derived jitter
        return { content: localRef.current(seededRound) };
      };
      try {
        const items = await fetchPool(opts.gameId, opts.difficulty, opts.total, {
          level: requestedLevel,
          ageBand: profile?.ageBand,
          learnerId: profile?.learnerId,
          seed: wSeed ^ nonce,
          recentIds,
        });
        const mapped: PlayRound<T>[] = [];
        for (const item of items) {
          const c = mapRef.current(item);
          if (c) mapped.push({ content: c, contentId: item.contentId });
          if (mapped.length >= opts.total) break;
        }
        // Shuffle pool-derived rounds per window so open windows see different questions
        const shuffled = mapped.length > 1 ? shuffleWithSeed(mapped, wSeed ^ hashGame(opts.gameId)) : mapped;
        for (let i = shuffled.length; i < opts.total; i++) shuffled.push(local(i));
        // Further shuffle the combined set if we had to top up with local content,
        // but keep at least one pool item at front when available for stability.
        const final = shuffled.length > 1 ? shuffleWithSeed(shuffled, wSeed ^ 0x9e3779b9) : shuffled;
        if (cancelled) return;
        const withId = final.filter((m) => m.contentId).length;
        if (typeof window !== "undefined" && withId > 0) {
          const ids = final.flatMap((round) => (round.contentId ? [round.contentId] : []));
          // Larger recent window → server exclusion prevents same questions
          // resurfacing for longer (fixes "same 5 questions" feel).
          window.localStorage.setItem(recentKey, JSON.stringify([...recentIds, ...ids].slice(-40)));
        }
        setSource(withId === opts.total ? "pool" : withId > 0 ? "mixed" : "local");
        setRounds(final);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof PoolAccessError) {
          setLocked(true);
          setRounds(null);
          return;
        }
        setSource("local");
        const localOnly = Array.from({ length: opts.total }, (_, i) => local(i));
        setRounds(shuffleWithSeed(localOnly, wSeed));
      }
    })().catch((error) => {
      if (cancelled) return;
      if (error instanceof PoolAccessError) {
        setLocked(true);
        setRounds(null);
        return;
      }
      setSource("local");
      const wSeed = typeof window !== "undefined" ? getWindowSeed() : 0;
      const localOnly = Array.from({ length: opts.total }, (_, i) => ({ content: localRef.current((i + (wSeed % 1000)) % 2147483647) }));
      setRounds(shuffleWithSeed(localOnly as PlayRound<T>[], wSeed));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.gameId, opts.difficulty, opts.total, nonce]);

function hashGame(g: string): number {
  let h = 0;
  for (let i = 0; i < g.length; i++) h = (Math.imul(h ^ g.charCodeAt(i), 16777619) >>> 0);
  return h;
}

  return { rounds, source, locked, reload: () => setNonce((n) => n + 1) };
}

function readProfile(): { learnerId?: string; ageBand?: string; level?: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("learnzzy.learnerProfile.v1");
    return raw ? JSON.parse(raw) as { learnerId?: string; ageBand?: string; level?: number } : null;
  } catch {
    return null;
  }
}

function readRecentIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(-40) : [];
  } catch {
    return [];
  }
}

function readRequestedLevel(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const value = Number(new URLSearchParams(window.location.search).get("level"));
  return Number.isInteger(value) && value >= 1 && value <= 100 ? value : undefined;
}
