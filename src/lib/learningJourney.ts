export type AgeBand = "4-5" | "6-7" | "8-9";

export type JourneyLevelStatus = "completed" | "current" | "locked";

export interface TrackDefinition {
  id: "numbers" | "creative" | "visual";
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
];

export function buildLearningJourney(input: {
  learnerId: string;
  ageBand: AgeBand;
  level: number;
}): LearningJourney {
  const currentLevel = Math.max(1, Math.min(5, Math.floor(input.level)));
  const levels = (gameIds: string[]): JourneyLevel[] =>
    Array.from({ length: 5 }, (_, index) => {
      const level = index + 1;
      const status: JourneyLevelStatus = level < currentLevel ? "completed" : level === currentLevel ? "current" : "locked";
      return {
        level,
        status,
        playable: status !== "locked",
        label: status === "completed" ? "Completed" : status === "current" ? "Play now" : "Coming next",
        gameIds,
      };
    });

  return {
    learnerId: input.learnerId,
    ageBand: input.ageBand,
    currentLevel,
    nextLevel: currentLevel < 5 ? currentLevel + 1 : null,
    tracks: TRACKS.map((track) => ({ ...track, levels: levels(track.gameIds) })),
  };
}

export function isLevelUnlocked(currentLevel: number, requestedLevel: number): boolean {
  return requestedLevel >= 1 && requestedLevel <= Math.max(1, Math.min(5, Math.floor(currentLevel)));
}
