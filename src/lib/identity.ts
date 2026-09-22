// Child identity helpers — deterministic, dependency-free so unit tests
// import the real code. The authoritative identity is ALWAYS learnerId;
// displayName, nickname, avatar, and companion are personalization-only and
// must never be used as authentication.

import { CHARACTERS, getCharacterDef } from "./characters.ts";

export const ONBOARDING_VERSION = 1;

export interface CompanionInput {
  characterId: string;
  displayName?: string;
}

export interface Companion {
  /** Validated roster id at write time; kept as string so cached/server JSON stays assignable. */
  characterId: string;
  displayName?: string;
}

export function normalizeAvatar(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().slice(0, 12);
  return s.length < 1 ? undefined : s;
}

export function normalizeDisplayName(raw?: string): string | undefined {
  if (!raw) return undefined;
  // No HTML, safe length, child-friendly plain text (same rules as nickname).
  const s = raw.replace(/[<>&"']/g, "").trim().slice(0, 20);
  return s.length < 1 ? undefined : s;
}

export function normalizeNickname(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().slice(0, 20);
  return s.length < 1 ? undefined : s;
}

/** What Learnzzy calls the child: nickname wins, then displayName. */
export function greetingName(learner: { nickname?: string; displayName?: string } | null | undefined): string {
  return learner?.nickname?.trim() || learner?.displayName?.trim() || "Explorer";
}

/**
 * Strict companion validation: unknown character ids return null so callers
 * can reject (422) instead of silently substituting a different friend.
 */
export function sanitizeCompanion(input: CompanionInput | null | undefined): Companion | null {
  if (!input || typeof input.characterId !== "string") return null;
  const def = CHARACTERS.find((c) => c.id === input.characterId);
  if (!def) return null;
  const displayName = normalizeNickname(input.displayName);
  const companion: Companion = { characterId: def.id };
  if (displayName) companion.displayName = displayName;
  return companion;
}

/** Display emoji for a learner's companion (new field wins, legacy avatar falls back). */
export function companionEmoji(learner: { companion?: Companion | null; avatar?: string } | null | undefined): string {
  if (learner?.companion) {
    try {
      return getCharacterDef(learner.companion.characterId).emoji;
    } catch {
      /* fall through */
    }
  }
  return learner?.avatar?.trim() || "🌟";
}

/** How the companion introduces itself: custom name wins, else character name. */
export function companionCallName(learner: { companion?: Companion | null } | null | undefined): string {
  if (learner?.companion?.displayName?.trim()) return learner.companion.displayName.trim();
  if (learner?.companion) {
    try {
      return getCharacterDef(learner.companion.characterId).name;
    } catch {
      /* fall through */
    }
  }
  return "Buddy";
}
