import { asCharacterId, getCharacterDef, type CharacterId, type CharacterState } from "./characters.ts";

// Personal pet companion — additive layer over existing companion system.
// Identity always resolves from the current learner profile; never hardcoded,
// never global, never default-learner. Multi-child isolation via learnerId.

export type PetState =
  | "IDLE" | "WALK" | "RUN" | "HOP" | "JUMP" | "LOOK" | "SIT" | "SLEEP"
  | "PLAY" | "FOLLOW" | "CELEBRATE" | "THINK" | "CURIOUS" | "EXCITED" | "SURPRISED" | "REST" | "INTERACT";

export interface PetIdentity {
  learnerId: string;
  learnerName: string;
  characterId: CharacterId;
  petName: string;
  /** "RV's BunBun" style display — learner + pet, never PII beyond nickname. */
  title: string;
}

export interface PetPersonality {
  traits: string[];
  energy: "calm" | "playful" | "energetic";
}

const PERSONALITY: Record<CharacterId, PetPersonality> = {
  bunny: { traits: ["energetic", "curious", "friendly", "playful"], energy: "energetic" },
  teddy: { traits: ["gentle", "wise", "friendly"], energy: "calm" },
  owl: { traits: ["calm", "thoughtful", "observant"], energy: "calm" },
  monkey: { traits: ["playful", "funny", "energetic"], energy: "energetic" },
  parrot: { traits: ["energetic", "talkative", "curious"], energy: "energetic" },
  puppy: { traits: ["playful", "loyal", "friendly"], energy: "playful" },
  dino: { traits: ["brave", "curious", "gentle"], energy: "playful" },
  elephant: { traits: ["calm", "gentle", "wise"], energy: "calm" },
  fox: { traits: ["clever", "curious", "playful"], energy: "playful" },
  panda: { traits: ["calm", "gentle", "friendly"], energy: "calm" },
  butterfly: { traits: ["gentle", "curious", "light"], energy: "playful" },
  lion: { traits: ["brave", "friendly", "warm"], energy: "playful" },
};

export function personalityFor(characterId: CharacterId): PetPersonality {
  return PERSONALITY[characterId] ?? PERSONALITY.teddy!;
}

export function resolvePetIdentity(profile: {
  learnerId?: string | null;
  nickname?: string | null;
  displayName?: string | null;
  companion?: { characterId?: string | null; displayName?: string | null } | null;
} | null | undefined): PetIdentity | null {
  const learnerId = profile?.learnerId?.trim();
  if (!learnerId) return null; // never default-learner, never global pet
  const characterId = asCharacterId(profile?.companion?.characterId ?? undefined, "teddy");
  const def = getCharacterDef(characterId);
  const learnerName = (profile?.nickname || profile?.displayName || "Explorer").trim().slice(0, 20) || "Explorer";
  const petName = (profile?.companion?.displayName || def.name).trim().slice(0, 20) || def.name;
  return {
    learnerId,
    learnerName,
    characterId,
    petName,
    title: `${learnerName}'s ${petName}`,
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Deterministic weighted behavior — same learner+context+tick always agrees.
// Personality influences the pool (energetic → hop/run, calm → sit/look).
export function nextPetState(opts: {
  learnerId: string;
  characterId: CharacterId;
  context: "home" | "game" | "forest" | "reward" | "success" | "incorrect";
  tick: number;
  current: PetState;
}): PetState {
  const energy = personalityFor(opts.characterId).energy;
  if (opts.context === "success" || opts.context === "reward") return "CELEBRATE";
  if (opts.context === "incorrect") return "THINK";
  const pool: PetState[] =
    energy === "energetic"
      ? ["HOP", "RUN", "JUMP", "LOOK", "PLAY", "IDLE"]
      : energy === "playful"
        ? ["WALK", "HOP", "LOOK", "PLAY", "IDLE", "SIT"]
        : ["IDLE", "LOOK", "SIT", "WALK", "REST", "CURIOUS"];
  const h = hashSeed(`${opts.learnerId}:${opts.characterId}:${opts.context}:${opts.tick}`);
  const pick = pool[h % pool.length]!;
  // Avoid repeating the same state twice in a row
  if (pick === opts.current) return pool[(h >> 3) % pool.length]!;
  return pick;
}

export function petStateToCharacterState(s: PetState): CharacterState {
  switch (s) {
    case "CELEBRATE": case "EXCITED": case "SURPRISED": return "celebrating";
    case "THINK": return "thinking";
    case "LOOK": case "CURIOUS": return "curious";
    case "HOP": case "JUMP": case "RUN": case "PLAY": return "happy";
    default: return "idle";
  }
}

// Short, warm, non-repetitive voice lines. Nickname used occasionally by caller.
export function petVoiceLine(state: PetState, petName: string): string {
  switch (state) {
    case "CELEBRATE": return "Yay! We did it!";
    case "THINK": return "Hmm, let's look again!";
    case "JUMP": case "HOP": return "Wheee!";
    case "LOOK": return "Look!";
    case "PLAY": return "Let's go!";
    default: return `Hi from ${petName}!`;
  }
}

// Safe zones per game context — pet may only roam inside these (never over content).
export interface PetSafeZone { left: number; top: number; width: number; height: number }
export function safeZonesFor(context: "home" | "game" | "forest"): PetSafeZone[] {
  if (context === "game") {
    // Dedicated companion corner + bottom strip, away from Q&A/controls
    return [
      { left: 2, top: 78, width: 26, height: 18 },
      { left: 72, top: 78, width: 26, height: 18 },
    ];
  }
  // Home / forest: wide garden strip
  return [{ left: 4, top: 62, width: 92, height: 30 }];
}

export interface PetAssetManifest {
  petId: string;
  species: CharacterId;
  version: string;
  emoji: string;
  states: PetState[];
}

export function assetManifestFor(characterId: CharacterId): PetAssetManifest {
  const def = getCharacterDef(characterId);
  return {
    petId: characterId,
    species: characterId,
    version: "v1-emoji",
    emoji: def.emoji,
    states: ["IDLE", "WALK", "RUN", "HOP", "JUMP", "LOOK", "SIT", "CELEBRATE", "THINK"],
  };
}
