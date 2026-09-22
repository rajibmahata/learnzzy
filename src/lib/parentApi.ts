"use client";

// Parent client helpers. All data comes from server-authorized endpoints;
// the browser never sees provider internals, prompts, or other families.
export interface ParentMe {
  authenticated: boolean;
  parent: { parentId: string; email: string; name?: string } | null;
}

export interface ChildSummary {
  learnerId: string;
  displayName?: string;
  nickname?: string;
  companion?: { characterId: string; displayName?: string };
  ageBand: string;
  level: number;
  totalStars: number;
  stickerCount: number;
  concepts: { conceptId: string; name: string; masteryPct: number; attempts: number }[];
  strengths: string[];
  practiceOpportunities: string[];
  recommendedNext: { gameId: string; level: number; reason: string }[];
  advisoryFocus?: string;
}

export async function parentGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? "Request failed.");
  return body.data as T;
}

export async function parentPost<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? "Request failed.");
  return body.data as T;
}

export function childLabel(c: { displayName?: string; nickname?: string; learnerId: string }): string {
  return c.nickname?.trim() || c.displayName?.trim() || `Learner ${c.learnerId.slice(-4)}`;
}
