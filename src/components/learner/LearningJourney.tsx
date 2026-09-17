"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";
import type { LearningTrackJourney, JourneyLevel } from "@/lib/learningJourney";

interface JourneyResponse {
  currentLevel: number;
  nextLevel: number | null;
  tracks: LearningTrackJourney[];
}

export function LearningJourney() {
  const [journey, setJourney] = React.useState<JourneyResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const profile = getCachedProfile();
    if (!profile) {
      setLoading(false);
      return;
    }
    fetch(`/api/learners/${profile.learnerId}/journey`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { success?: boolean; data?: JourneyResponse }) => {
        if (body.success && body.data) setJourney(body.data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-2xl bg-white p-4 text-center text-sm shadow-card" role="status">Loading your adventure path...</div>;
  if (!journey) return null;

  return (
    <section aria-labelledby="learning-journey-title" className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">🌟 My learning journey</p>
          <h2 id="learning-journey-title" className="mt-1 text-headline-md">Level {journey.currentLevel} is your next adventure</h2>
        </div>
        {journey.nextLevel ? <span className="shrink-0 rounded-full bg-primary-fixed px-3 py-1 text-xs font-black text-on-primary-fixed">Next {journey.nextLevel}</span> : null}
      </div>

      <div className="mt-4 space-y-4">
        {journey.tracks.map((track) => (
          <TrackPath key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}

function TrackPath({ track }: { track: LearningTrackJourney }) {
  const primaryGame = track.gameIds[0];
  return (
    <div className="rounded-xl bg-surface-low p-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-2xl">{track.icon}</span>
        <div>
          <h3 className="text-sm font-black">{track.title}</h3>
          <p className="text-xs text-on-surface-variant">{track.description}</p>
        </div>
      </div>
      <ol aria-label={`${track.title} levels`} className="mt-3 grid grid-cols-5 gap-1">
        {track.levels.map((level, index) => (
          <li key={level.level} className="relative flex min-w-0 flex-col items-center">
            {index > 0 ? <span aria-hidden className="absolute right-1/2 top-5 -z-0 h-1 w-full bg-outline-variant" /> : null}
            <JourneyNode level={level} gameId={primaryGame} trackTitle={track.title} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function JourneyNode({ level, gameId, trackTitle }: { level: JourneyLevel; gameId: string; trackTitle: string }) {
  const node = (
    <span
      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 text-sm font-black shadow-card ${
        level.status === "completed"
          ? "border-tertiary-container bg-tertiary-container text-on-tertiary-container"
          : level.status === "current"
            ? "border-primary bg-primary text-white ring-4 ring-primary-fixed"
            : "border-outline-variant bg-surface-high text-on-surface-variant"
      }`}
    >
      {level.status === "completed" ? "✓" : level.status === "current" ? "★" : "🔒"}
    </span>
  );

  return level.playable ? (
    <Link href={`/play/${gameId}?level=${level.level}`} className="flex flex-col items-center text-center" aria-label={`${trackTitle} Level ${level.level} ${level.label}`}>
      {node}
      <span className="mt-1 text-[11px] font-black">L{level.level}</span>
      <span className={`text-[10px] font-bold ${level.status === "current" ? "text-primary" : "text-on-surface-variant"}`}>
        {level.label}
      </span>
    </Link>
  ) : (
    <div className="flex flex-col items-center text-center" aria-label={`${trackTitle} Level ${level.level} locked`}>
      {node}
      <span className="mt-1 text-[11px] font-black">L{level.level}</span>
      <span className="text-[10px] font-bold text-on-surface-variant">Locked</span>
    </div>
  );
}
