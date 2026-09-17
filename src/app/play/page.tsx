"use client";

import * as React from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { GameCard } from "@/components/child/GameCard";
import { StarCounter } from "@/components/child/StarCounter";
import { GAMES } from "@/games/registry";
import { shuffledForWindow } from "@/lib/windowSeed";
import { useRewards } from "@/lib/rewards";
import { getCachedProfile } from "@/lib/learner";
import { LearningJourney } from "@/components/learner/LearningJourney";
import { GamePlan } from "@/components/learner/GamePlan";
import Link from "next/link";

export default function PlayHome() {
  const { totalStars, stickers } = useRewards();
  const [games, setGames] = React.useState(GAMES);
  const [learner, setLearner] = React.useState<{ nickname?: string; ageBand?: string; level?: number } | null>(null);
  const [soundOn, setSoundOn] = React.useState(true);
  React.useEffect(() => {
    setGames(shuffledForWindow(GAMES));
    setLearner(getCachedProfile());
  }, []);
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 pb-24 pt-4">
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-2 bg-surface/90 px-4 py-2 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo compact />
          <span className="hidden truncate text-xs font-bold text-on-surface-variant sm:inline">Play Garden</span>
        </div>
        <div className="flex items-center gap-2">
          <StarCounter value={totalStars} />
          <button
            type="button"
            aria-label={soundOn ? "Mute sound" : "Turn sound on"}
            aria-pressed={soundOn}
            onClick={() => setSoundOn((value) => !value)}
            className="tactile flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-lg text-primary shadow-[0_2px_0_#d5e3fc]"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <Link href="/parent/login" aria-label="Parent area" className="tactile flex h-11 w-11 items-center justify-center rounded-full bg-surface-low text-lg shadow-[0_2px_0_#e6eeff]">🔒</Link>
        </div>
      </header>

      <div className="mt-4 flex flex-col items-center text-center">
        <p className="inline-flex rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
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

      <div className="safe-panel mt-4 flex items-center gap-3 p-3">
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-2xl text-white">
          🐾
        </span>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-extrabold">Pip says: “Touch any game to start!”</p>
          <p className="text-xs font-bold text-primary">Tap a game below or hear me again 🎵</p>
        </div>
        <button type="button" aria-label="Hear Pip again" className="tactile ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-lg text-primary shadow-[0_3px_0_#adc6ff]">🔊</button>
      </div>

      {learner ? <div className="mt-3"><LearningJourney /></div> : null}

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

      <nav aria-label="Games" className="mt-4 flex flex-col gap-4 pb-4">
        {games.map((g, index) => (
          <GameCard key={g.id} game={g} compact={index > 2} />
        ))}
      </nav>
      <section aria-labelledby="stars-title" className="safe-panel mt-1 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-xl shadow-sm">⭐</span>
            <div>
              <h2 id="stars-title" className="text-headline-md">My Stars &amp; Badges</h2>
              <p className="text-xs text-on-surface-variant">{totalStars} golden stars earned</p>
            </div>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1.5 text-answer text-on-secondary-fixed shadow-[0_3px_0_#855300]">{totalStars} ⭐</span>
        </div>
        <div className="mt-4 rounded-2xl bg-surface-low p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Next reward</span>
            <span className="text-secondary">{Math.max(0, 3 - (totalStars % 3)) || 3} more stars</span>
          </div>
          <div className="quest-stones mt-3" aria-label="Star reward progress">
            <span className={`quest-stone ${totalStars > 0 ? "complete" : "locked"}`}>★</span>
            <span className={`quest-stone ${totalStars > 1 ? "complete" : totalStars === 1 ? "current" : "locked"}`}>★</span>
            <span className={`quest-stone ${totalStars > 2 ? "complete" : totalStars === 2 ? "current" : "locked"}`}>★</span>
            <span className="quest-stone locked">🔒</span>
          </div>
          <p className="mt-2 text-center text-xs text-on-surface-variant">Keep exploring to unlock your next badge.</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[{ icon: "🔢", name: "Early Counter" }, { icon: "🧹", name: "Clean Master" }, { icon: "🎨", name: "Star Artist" }].map((badge, index) => (
            <div key={badge.name} className={`flex flex-col items-center rounded-2xl p-3 text-center ${["bg-error-container/40", "bg-tertiary-fixed/40", "bg-primary-fixed/40"][index]}`}>
              <span className="text-2xl">{badge.icon}</span>
              <span className="mt-1 text-[11px] font-bold leading-tight">{badge.name}</span>
              <span className="mt-0.5 text-[10px] font-bold text-tertiary">{stickers[index] ? "Unlocked!" : "Keep playing"}</span>
            </div>
          ))}
        </div>
      </section>
      <Link href={games[0]?.href ?? "/play/addition"} className="tactile-button mt-4 flex items-center justify-center gap-3 bg-primary px-6 py-3 text-answer text-white">
        <span aria-hidden>🔀</span> Surprise Me &amp; Play!
      </Link>
      <p className="pb-4 pt-4 text-center text-xs text-on-surface-variant">Games shuffle so each window feels like a new adventure.</p>
      <nav aria-label="Playground" className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-high bg-surface/95 px-4 pb-safe pt-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-game items-center justify-around gap-2">
          <Link href="/play" aria-current="page" className="flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-[0_4px_0_#004395]">🎮 <span>Play</span></Link>
          <Link href="/stickers" className="flex min-h-12 items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold text-on-surface-variant">⭐ <span>Stars</span></Link>
          <Link href="/parents" className="flex min-h-12 items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold text-on-surface-variant">👨‍👩‍👧 <span>Grown-ups</span></Link>
        </div>
      </nav>
    </div>
  );
}
