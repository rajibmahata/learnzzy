"use client";

import * as React from "react";
import { fetchPool, type PoolItem, type PoolGameId } from "./pool-client";
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
  reload: () => void;
} {
  const mapRef = React.useRef(opts.mapItem);
  mapRef.current = opts.mapItem;
  const localRef = React.useRef(opts.makeLocal);
  localRef.current = opts.makeLocal;

  const [rounds, setRounds] = React.useState<PlayRound<T>[] | null>(null);
  const [source, setSource] = React.useState<"loading" | "pool" | "mixed" | "local">("loading");
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setRounds(null);
      setSource("loading");
      // Per-window seed ensures different windows never get identical game sequences
      const wSeed = typeof window !== "undefined" ? getWindowSeed() : 0;
      const local = (n: number): PlayRound<T> => {
        // Mix window seed into local generation so simultaneous windows diverge
        // even without pool content.
        const seededRound = (n + (wSeed % 1000)) % 2147483647;
        // localRef expects round index; we offset it with seed-derived jitter
        return { content: localRef.current(seededRound) };
      };
      try {
        const items = await fetchPool(opts.gameId, opts.difficulty, opts.total);
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
        setSource(withId === opts.total ? "pool" : withId > 0 ? "mixed" : "local");
        setRounds(final);
      } catch {
        if (cancelled) return;
        setSource("local");
        const localOnly = Array.from({ length: opts.total }, (_, i) => local(i));
        setRounds(shuffleWithSeed(localOnly, wSeed));
      }
    })().catch(() => {
      if (cancelled) return;
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

  return { rounds, source, reload: () => setNonce((n) => n + 1) };
}
