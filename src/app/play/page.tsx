"use client";

import * as React from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { GameCard } from "@/components/child/GameCard";
import { StarCounter } from "@/components/child/StarCounter";
import { GAMES } from "@/games/registry";
import { shuffledForWindow } from "@/lib/windowSeed";
import { useRewards } from "@/lib/rewards";
import { getCachedProfile } from "@/lib/learner";
import { LevelProgress } from "@/components/learner/LevelProgress";
import { GamePlan } from "@/components/learner/GamePlan";
import Link from "next/link";

export default function PlayHome() {
  const { totalStars, stickers } = useRewards();
  const [games, setGames] = React.useState(GAMES);
  const [learner, setLearner] = React.useState<{ nickname?: string; ageBand?: string; level?: number } | null>(null);
  React.useEffect(() => {
    setGames(shuffledForWindow(GAMES));
    setLearner(getCachedProfile());
  }, []);
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-4">
      <header className="flex items-center justify-between">
        <BrandLogo compact />
        <StarCounter value={totalStars} />
      </header>

      <div className="mt-2 flex flex-col items-center text-center">
        <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Play • Think • Learn
        </p>
        <h1 className="mt-2 text-headline-lg">{learner?.nickname ? `Hi, ${learner.nickname}!` : "What shall we play?"}</h1>
        <p className="text-on-surface-variant">
          {learner ? (
            <>
              Level {learner.level ?? 1} • {learner.ageBand ?? "6-7"} • <Link href="/welcome" className="underline">Change</Link>
            </>
          ) : (
            <>
              <Link href="/welcome" className="font-bold text-primary underline">Set up</Link> your learning journey — or just play!
            </>
          )}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3 shadow-card">
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-2xl text-white">
          🐾
        </span>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-extrabold">Pip says: “Touch any game to start!”</p>
          <p className="text-xs font-bold text-primary">Tap a game below 🎵</p>
        </div>
      </div>

      {learner ? (
        <div className="mt-3">
          <LevelProgress level={learner.level ?? 1} />
        </div>
      ) : null}

      {learner ? (
        <div className="mt-3">
          <GamePlan />
        </div>
      ) : null}

      {stickers.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-xl bg-white p-3 shadow-card">
          <span className="shrink-0 text-xs font-black uppercase tracking-wide text-on-surface-variant">Stickers:</span>
          {stickers.slice(-8).map((s) => (
            <span key={s.id} aria-label={s.name} title={s.name} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-lg">
              {s.emoji}
            </span>
          ))}
          <Link href="/stickers" className="ml-auto shrink-0 rounded-full bg-tertiary-fixed px-2 py-1 text-xs font-black text-on-tertiary-fixed">⭐ {totalStars} • View all</Link>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <Link href="/stickers" className="text-xs font-bold text-primary underline">View sticker collection</Link>
        </div>
      )}

      <nav aria-label="Games" className="mt-4 flex flex-col gap-4 pb-8">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </nav>
      <p className="pb-4 text-center text-xs text-on-surface-variant">Open a new window — games shuffle so each window is different!</p>
    </div>
  );
}
