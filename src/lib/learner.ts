"use client";

export type AgeBand = "4-5" | "6-7" | "8-9";

const KEY = "learnzzy.learnerId.v1";
const PROFILE_KEY = "learnzzy.learnerProfile.v1";

export interface LearnerProfile {
  learnerId: string;
  nickname?: string;
  ageBand: AgeBand;
  level: number;
  totalStars?: number;
}

export function getLearnerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setLearnerId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}

export function clearLearner() {
  try {
    localStorage.removeItem(KEY);
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
