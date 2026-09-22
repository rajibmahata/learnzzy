"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";
import type { LearningTrackJourney, JourneyLevel } from "@/lib/learningJourney";
import { WORLDS, artForGame } from "@/lib/worlds";
import { getCharacterDef, characterForGame } from "@/lib/characters";

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

  if (loading) return <div className="rounded-2xl bg-white/80 backdrop-blur-md p-6 text-center text-sm shadow-[0_8px_24px_rgba(180,160,130,0.12)] border-2 border-white" role="status">Loading your magical journey… ✨</div>;
  if (!journey) return null;

  // Main journey header should be tappable like every other game box — same Welcome→Play flow
  const headerHref = (() => {
    const firstPlayable = journey.tracks.flatMap((t) => t.levels).find((l) => l.playable);
    if (firstPlayable) {
      const track = journey.tracks.find((t) => t.levels.includes(firstPlayable));
      const gid = track?.gameIds[0] ?? "addition";
      return `/play/${gid}?level=${firstPlayable.level}`;
    }
    return "/play";
  })();

  return (
    <section aria-labelledby="learning-journey-title" className="rounded-2xl bg-white/80 backdrop-blur-md p-4 md:p-5 shadow-[0_8px_24px_rgba(180,160,130,0.14)] border-2 border-white overflow-hidden">
      <Link href={headerHref} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 via-amber-50 to-emerald-50 p-4 border-2 border-white block hover:shadow-md hover:-translate-y-0.5 transition-all group" aria-label={`My learning journey Global Level ${journey.currentLevel} — Level ${journey.currentLevel} is your next 3D adventure, tap to play`}>
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl" aria-hidden />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-sky-200/40 rounded-full blur-xl" aria-hidden />
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary flex items-center gap-1">🌟 My learning journey • Global Level {journey.currentLevel} <span aria-hidden className="hidden group-hover:inline text-primary">→</span></p>
            <h2 id="learning-journey-title" className="mt-1 text-xl md:text-2xl font-black leading-tight group-hover:text-primary">Level {journey.currentLevel} is your next 3D adventure!</h2>
            <p className="text-xs text-on-surface-variant mt-1">Every world grows with you — 3D magic adapts ✨</p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-[0_4px_0_rgba(180,160,130,0.2)]">🏆</span>
            {journey.nextLevel ? <span className="rounded-full bg-primary text-white px-3 py-1 text-xs font-black">Next {journey.nextLevel}</span> : <span className="rounded-full bg-tertiary text-white px-3 py-1 text-xs font-black">Master!</span>}
          </div>
        </div>
        <div className="mt-3 hidden md:flex items-center gap-2 text-xs font-bold text-on-surface-variant">
          <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-full">3D Islands</span>
          <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-full">All {journey.tracks.length} Worlds • {journey.tracks.reduce((s, t) => s + t.gameIds.length, 0)} Games</span>
          <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-full">Shuffled for you ✨</span>
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {journey.tracks.map((track) => (
          <TrackPath key={track.id} track={track} currentLevel={journey.currentLevel} />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-on-surface-variant">Your {journey.tracks.length} worlds • {journey.tracks.reduce((s, t) => s + t.gameIds.length, 0)} games • shuffled just for you ✨ — Global Level {journey.currentLevel}</p>
    </section>
  );
}

function TrackPath({ track, currentLevel }: { track: LearningTrackJourney; currentLevel: number }) {
  const primaryGame = track.gameIds[0];
  const world = WORLDS.find((w) => w.gameId === primaryGame);
  const art = world ? artForGame(world.gameId) : null;
  const guide = getCharacterDef(characterForGame(primaryGame));
  const bg = world?.gradient ?? "from-sky-100 to-emerald-50";
  const trackHref = `/play/${primaryGame}?level=${currentLevel}`;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Play ${track.title} Global Level ${currentLevel} — tap image or title to play`}
      onClick={() => (window.location.href = trackHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = trackHref;
        }
      }}
      className={`rounded-2xl overflow-hidden border-2 border-white shadow-[0_6px_0_rgba(180,160,130,0.15)] bg-gradient-to-br ${bg} group cursor-pointer hover:shadow-[0_8px_0_rgba(180,160,130,0.2)] hover:-translate-y-0.5 transition-all`}
    >
      <div className="relative h-24 overflow-hidden">
        {art ? <img src={art} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl">{track.icon}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" aria-hidden />
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black shadow-sm">{world?.islandTag ?? track.title}</span>
        <span aria-hidden className="absolute bottom-2 right-2 text-2xl drop-shadow">{guide.emoji}</span>
        <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black shadow-sm">Global L{currentLevel}</span>
      </div>
      <div className="bg-white p-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">{track.icon}</span>
          <div>
            <h3 className="text-sm font-black leading-tight group-hover:text-primary group-hover:underline">{track.title}</h3>
            <p className="text-xs text-on-surface-variant line-clamp-1">{track.description}</p>
          </div>
        </div>
        <ol aria-label={`${track.title} levels`} className="mt-3 grid grid-cols-5 gap-1">
          {track.levels.map((level, index) => (
            <li key={level.level} className="relative flex min-w-0 flex-col items-center">
              {index > 0 ? <span aria-hidden className="absolute right-1/2 top-4 -z-0 h-1 w-full bg-outline-variant" /> : null}
              <JourneyNode level={level} gameId={primaryGame} trackTitle={track.title} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function JourneyNode({ level, gameId, trackTitle }: { level: JourneyLevel; gameId: string; trackTitle: string }) {
  const node = (
    <span
      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-3 text-sm font-black shadow-sm ${
        level.status === "completed"
          ? "border-tertiary bg-tertiary text-white"
          : level.status === "current"
            ? "border-primary bg-primary text-white ring-4 ring-primary/20 animate-pulse"
            : "border-outline-variant bg-surface-high text-on-surface-variant"
      }`}
    >
      {level.status === "completed" ? "✓" : level.status === "current" ? "★" : "🔒"}
    </span>
  );

  return level.playable ? (
    <Link
      href={`/play/${gameId}?level=${level.level}`}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col items-center text-center group"
      aria-label={`${trackTitle} Level ${level.level} ${level.label}`}
    >
      {node}
      <span className="mt-1 text-[11px] font-black group-hover:text-primary">L{level.level}</span>
      <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full ${level.status === "current" ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`}>
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
