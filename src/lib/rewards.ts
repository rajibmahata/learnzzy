"use client";

import * as React from "react";
import { selectUnownedSticker, stickerById, type StickerDef } from "./stickers.ts";

// Sticker + stars rewards (client cache). The SERVER is authoritative:
// every completion claims an unowned catalog sticker via
// POST /api/learners/[learnerId]/rewards/claim and the local store is
// reconciled to it. Local awards are optimistic placeholders only.
//
// Stores are namespaced per learner (`learnzzy.rewards.v1.<learnerId>`) so
// siblings on one device never mix collections. Server data wins on hydrate.

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  gameId: string;
  earnedAt: string;
  /** Optimistic placeholder awaiting server confirmation. */
  pending?: boolean;
}

export interface RewardsState {
  totalStars: number;
  stickers: Sticker[];
}

const LEGACY_KEY = "learnzzy.rewards.v1";
const HYDRATED_PREFIX = "learnzzy.rewards.hydrated.v1.";

function keyFor(learnerId?: string | null): string {
  return learnerId ? `learnzzy.rewards.v1.${learnerId}` : LEGACY_KEY;
}

function activeLearnerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("learnzzy.activeLearnerId") ?? localStorage.getItem("learnzzy.learnerId.v1");
  } catch {
    return null;
  }
}

function load(learnerId?: string | null): RewardsState {
  if (typeof window === "undefined") return { totalStars: 0, stickers: [] };
  try {
    const raw = localStorage.getItem(keyFor(learnerId));
    if (!raw) return { totalStars: 0, stickers: [] };
    const p = JSON.parse(raw) as RewardsState;
    if (typeof p.totalStars !== "number" || !Array.isArray(p.stickers)) return { totalStars: 0, stickers: [] };
    return p;
  } catch {
    return { totalStars: 0, stickers: [] };
  }
}

function save(s: RewardsState, learnerId?: string | null) {
  try {
    localStorage.setItem(keyFor(learnerId), JSON.stringify(s));
  } catch {}
}

function notify() {
  try {
    window.dispatchEvent(new CustomEvent("learnzzy:rewards"));
  } catch {}
}

export function getRewards(learnerId?: string | null): RewardsState {
  return load(learnerId ?? activeLearnerId());
}

function tempId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `pending_${(crypto as { randomUUID: () => string }).randomUUID().replace(/-/g, "").slice(0, 12)}`;
    }
  } catch {}
  return `pending_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Optimistic local award shown instantly at celebration. The returned sticker
 *  is a placeholder: callers must reconcile it with the server claim result. */
export function addReward(gameId: string, starsAwarded = 3, learnerId?: string | null): { stars: number; sticker: Sticker } {
  const owner = learnerId ?? activeLearnerId();
  const cur = load(owner);
  const owned = cur.stickers.map((s) => s.id);
  const pick = selectUnownedSticker(owned, `temp:${owner ?? "anon"}:${Date.now()}`);
  const fallback = { emoji: "🌟", name: "Star Buddy" };
  const sticker: Sticker = {
    id: tempId(),
    emoji: pick?.emoji ?? fallback.emoji,
    name: pick?.name ?? fallback.name,
    gameId,
    earnedAt: new Date().toISOString(),
    pending: true,
  };
  const next: RewardsState = {
    totalStars: cur.totalStars + starsAwarded,
    stickers: [...cur.stickers, sticker].slice(-100),
  };
  save(next, owner);
  notify();
  return { stars: starsAwarded, sticker };
}

export interface ServerSticker {
  id: string;
  emoji: string;
  name: string;
}

/**
 * Swap an optimistic placeholder for the server-authoritative sticker.
 * Dedups by canonical id (a retried claim never duplicates). Returns the
 * canonical local sticker, or null when there is nothing to swap
 * (offline/server gave no sticker — the placeholder stays until hydrate).
 */
export function reconcileSticker(tempId: string, server: ServerSticker | null, gameId: string, learnerId?: string | null): Sticker | null {
  if (!server) return null;
  const owner = learnerId ?? activeLearnerId();
  const cur = load(owner);
  const withoutTemp = cur.stickers.filter((s) => s.id !== tempId);
  if (withoutTemp.some((s) => s.id === server.id)) {
    save({ ...cur, stickers: withoutTemp }, owner);
    notify();
    return withoutTemp.find((s) => s.id === server.id) ?? null;
  }
  const canonical: Sticker = { id: server.id, emoji: server.emoji, name: server.name, gameId, earnedAt: new Date().toISOString() };
  save({ ...cur, stickers: [...withoutTemp, canonical].slice(-100) }, owner);
  notify();
  return canonical;
}

/**
 * Adopt a server-awarded sticker into the local store (activities/missions
 * claim without an optimistic placeholder). Dedups by canonical id.
 */
export function adoptServerSticker(server: ServerSticker, gameId: string, learnerId?: string | null): Sticker {
  const owner = learnerId ?? activeLearnerId();
  const cur = load(owner);
  const existing = cur.stickers.find((s) => s.id === server.id);
  if (existing) return existing;
  const canonical: Sticker = { id: server.id, emoji: server.emoji, name: server.name, gameId, earnedAt: new Date().toISOString() };
  save({ ...cur, stickers: [...cur.stickers, canonical].slice(-100) }, owner);
  notify();
  return canonical;
}

/**
 * One-time adoption of the retired shared store (`learnzzy.rewards.v1`) into
 * a learner's namespaced collection — so stickers earned before signup are not
 * lost. Runs only when the learner's own store is empty; the legacy key is
 * left untouched for other devices/profiles. Server data still wins on
 * hydrate.
 */
export function adoptLegacyStore(learnerId: string): RewardsState | null {
  if (typeof window === "undefined") return null;
  try {
    const owned = load(learnerId);
    if (owned.stickers.length > 0 || owned.totalStars > 0) return null;
    const legacy = load(null);
    if (legacy.stickers.length === 0 && legacy.totalStars === 0) return null;
    const adopted: RewardsState = {
      totalStars: legacy.totalStars,
      stickers: legacy.stickers.map((s) => ({ ...s, pending: false })).slice(-100),
    };
    save(adopted, learnerId);
    notify();
    return adopted;
  } catch {
    return null;
  }
}

/** Merge server truth into the local store (server wins on conflicts). */
export function hydrateFromServer(
  server: { totalStars: number; stickerIds: string[] },
  learnerId?: string | null
): RewardsState {
  const owner = learnerId ?? activeLearnerId();
  const cur = load(owner);
  const byId = new Map(cur.stickers.map((s) => [s.id, s]));
  for (const id of server.stickerIds ?? []) {
    if (!byId.has(id)) {
      const def: StickerDef | null = stickerById(id);
      if (def) {
        byId.set(id, { id: def.id, emoji: def.emoji, name: def.name, gameId: "learnzzy", earnedAt: new Date().toISOString() });
      }
    } else {
      const s = byId.get(id)!;
      if (s.pending) byId.set(id, { ...s, pending: false });
    }
  }
  const next: RewardsState = { totalStars: server.totalStars, stickers: [...byId.values()].slice(-100) };
  save(next, owner);
  try {
    localStorage.setItem(`${HYDRATED_PREFIX}${owner ?? "anon"}`, new Date().toISOString());
  } catch {}
  notify();
  return next;
}

export function useRewards() {
  const [state, setState] = React.useState<RewardsState>({ totalStars: 0, stickers: [] });

  React.useEffect(() => {
    const owner = activeLearnerId();
    const key = keyFor(owner);
    setState(load(owner));
    // One server hydration per learner per device (server is truth).
    let cancelled = false;
    try {
      const hydrated = localStorage.getItem(`${HYDRATED_PREFIX}${owner ?? "anon"}`);
      if (owner && !hydrated) {
        fetch(`/api/learners/${encodeURIComponent(owner)}/rewards`, { cache: "no-store" })
          .then((r) => r.json())
          .then((b) => {
            if (!cancelled && b?.success && b.data) setState(hydrateFromServer(b.data, owner));
          })
          .catch(() => {});
      }
    } catch {}
    const reload = (e: StorageEvent) => {
      if (!e.key || e.key === key || e.key === LEGACY_KEY) setState(load(activeLearnerId()));
    };
    const onFocus = () => setState(load(activeLearnerId()));
    const onCustom = () => setState(load(activeLearnerId()));
    window.addEventListener("storage", reload);
    window.addEventListener("focus", onFocus);
    window.addEventListener("learnzzy:rewards", onCustom as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", reload);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("learnzzy:rewards", onCustom as EventListener);
    };
  }, []);

  const award = React.useCallback((gameId: string, stars = 3) => {
    const r = addReward(gameId, stars);
    setState(load(activeLearnerId()));
    return r;
  }, []);

  return { ...state, award };
}
