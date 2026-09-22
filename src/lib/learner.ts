"use client";

export type AgeBand = "4-5" | "6-7" | "8-9";

const KEY = "learnzzy.learnerId.v1";
const PROFILE_KEY = "learnzzy.learnerProfile.v1";
// Canonical active-learner pointer (CHILD_SESSION.md). The legacy KEY stays in
// sync so older screens keep working; new code should use the active key.
const ACTIVE_KEY = "learnzzy.activeLearnerId";
const DEVICE_LIST_KEY = "learnzzy.learners.v1";

export interface LearnerProfile {
  learnerId: string;
  displayName?: string;
  nickname?: string;
  /** Explorer buddy emoji picked by the child (display-only, never auth). */
  avatar?: string;
  companion?: { characterId: string; displayName?: string };
  ageBand: AgeBand;
  level: number;
  totalStars?: number;
}

export interface DeviceLearner {
  learnerId: string;
  displayName?: string;
  nickname?: string;
  avatar?: string;
  companion?: { characterId: string; displayName?: string };
  ageBand: AgeBand;
  addedAt: string;
}

export { greetingName } from "./identity.ts";

export function getLearnerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Alias for the canonical active-learner pointer (spec §8). */
export function getActiveLearnerId(): string | null {
  return getLearnerId();
}

export function setLearnerId(id: string) {
  try {
    localStorage.setItem(KEY, id);
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {}
}

/** Switch the active learner without touching any other learner's data. */
export function setActiveLearnerId(id: string) {
  setLearnerId(id);
}

export function listDeviceLearners(): DeviceLearner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEVICE_LIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DeviceLearner[];
    return Array.isArray(arr) ? arr.filter((x) => typeof x?.learnerId === "string") : [];
  } catch {
    return [];
  }
}

export function upsertDeviceLearner(entry: DeviceLearner) {
  try {
    const rest = listDeviceLearners().filter((x) => x.learnerId !== entry.learnerId);
    localStorage.setItem(DEVICE_LIST_KEY, JSON.stringify([...rest, entry].slice(-10)));
  } catch {}
}

export function removeDeviceLearner(learnerId: string) {
  try {
    localStorage.setItem(
      DEVICE_LIST_KEY,
      JSON.stringify(listDeviceLearners().filter((x) => x.learnerId !== learnerId))
    );
  } catch {}
}

export function clearLearner() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {}
}

export function getCachedProfile(): LearnerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cacheProfile(p: LearnerProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {}
}

export async function ensureLearner(): Promise<LearnerProfile | null> {
  const existing = getCachedProfile();
  if (existing?.learnerId) return existing;
  const id = getLearnerId();
  if (!id) return null;
  // Fetch from server to refresh
  try {
    const res = await fetch(`/api/learners/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    const doc = body.data as LearnerProfile;
    cacheProfile(doc);
    return doc;
  } catch {
    return null;
  }
}
