export type AgeBand = "4-5" | "6-7" | "8-9";

export type JourneyLevelStatus = "completed" | "current" | "locked";

export interface TrackDefinition {
  id: "numbers" | "creative" | "visual" | "words" | "nature";
  title: string;
  description: string;
  icon: string;
  gameIds: string[];
}

export interface JourneyLevel {
  level: number;
  status: JourneyLevelStatus;
  playable: boolean;
  label: string;
  gameIds: string[];
}

export interface LearningTrackJourney extends TrackDefinition {
  levels: JourneyLevel[];
}

export interface LearningJourney {
  learnerId: string;
  ageBand: AgeBand;
  currentLevel: number;
  nextLevel: number | null;
  tracks: LearningTrackJourney[];
}

export const TRACKS: TrackDefinition[] = [
  {
    id: "numbers",
    title: "Numbers Adventure",
    description: "Count, add, and take away.",
    icon: "🔢",
    gameIds: ["addition", "subtraction"],
  },
  {
    id: "creative",
    title: "Creative Explorer",
    description: "Trace, draw, and discover the world.",
    icon: "✏️",
    gameIds: ["sketch", "discover"],
  },
  {
    id: "visual",
    title: "Visual Discoverer",
    description: "Spot, sort, and solve pictures.",
    icon: "🧩",
    gameIds: ["clean-up", "puzzle"],
  },
  {
    id: "words",
    title: "Words & Letters",
    description: "Pop balloons, build words, read!",
    icon: "🔤",
    gameIds: ["balloon-words", "balloon-animals"],
  },
  {
    id: "nature",
    title: "Nature Explorer",
    description: "Colors, animals, and gardens!",
    icon: "🌈",
    gameIds: ["color-detective", "animal-safari", "butterfly-garden"],
  },
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildLearningJourney(input: {
  learnerId: string;
  ageBand: AgeBand;
  level: number;
}): LearningJourney {
  const currentLevel = Math.max(1, Math.min(100, Math.floor(input.level)));
  // Personalized shuffle — child to child is different, same child is stable.
  // Uses learnerId as seed so every child sees a different order, but it is deterministic per child.
  const seed = hashSeed(input.learnerId || "guest");
  const rand = mulberry32(seed);
  const shuffledTracks = [...TRACKS];
  for (let i = shuffledTracks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffledTracks[i]!;
    shuffledTracks[i] = shuffledTracks[j]!;
    shuffledTracks[j] = tmp;
  }
  // Also shuffle gameIds inside each track for variety
  const personalizedTracks = shuffledTracks.map((track) => {
    const shuffledGameIds = [...track.gameIds];
    for (let i = shuffledGameIds.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = shuffledGameIds[i]!;
      shuffledGameIds[i] = shuffledGameIds[j]!;
      shuffledGameIds[j] = tmp;
    }
    return { ...track, gameIds: shuffledGameIds };
  });

  // Show a 5-level window centered on currentLevel for 100-level journey
  const levels = (gameIds: string[]): JourneyLevel[] => {
    const start = Math.max(1, Math.min(96, currentLevel - 2));
    return Array.from({ length: 5 }, (_, index) => {
      const level = start + index;
      const status: JourneyLevelStatus = level < currentLevel ? "completed" : level === currentLevel ? "current" : "locked";
      return {
        level,
        status,
        playable: status !== "locked" && level <= 100,
        label: status === "completed" ? "Completed" : status === "current" ? "Play now" : "Coming next",
        gameIds,
      };
    });
  };

  return {
    learnerId: input.learnerId,
    ageBand: input.ageBand,
    currentLevel,
    nextLevel: currentLevel < 100 ? currentLevel + 1 : null,
    tracks: personalizedTracks.map((track) => ({ ...track, levels: levels(track.gameIds) })),
  };
}

export function isLevelUnlocked(currentLevel: number, requestedLevel: number): boolean {
  // Allow the immediate next level to be explored for progression — “Continue → Next Level” should never show LockedAdventure
  return requestedLevel >= 1 && requestedLevel <= Math.max(1, Math.min(100, Math.floor(currentLevel) + 1));
}
