"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StarCounter } from "@/components/child/StarCounter";
import { useRewards } from "@/lib/rewards";
import { getCachedProfile } from "@/lib/learner";

const GAME_NAMES: Record<string, { name: string; icon: string }> = {
  addition: { name: "Number Adventure", icon: "🔢" },
  subtraction: { name: "Fly Away", icon: "🐦" },
  "clean-up": { name: "Clean Up", icon: "🧹" },
  puzzle: { name: "Picture Puzzle", icon: "🧩" },
  sketch: { name: "Shadow Sketch", icon: "✏️" },
};

export default function StickersPage() {
  const { totalStars, stickers } = useRewards();
  const [learner, setLearner] = React.useState<{ level?: number } | null>(null);
  React.useEffect(() => {
    setLearner(getCachedProfile());
  }, []);

  const byGame = React.useMemo(() => {
    const map = new Map<string, typeof stickers>();
    for (const s of stickers) {
      const g = (s as { gameId?: string }).gameId ?? "addition";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(s);
    }
    return map;
  }, [stickers]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-4">
      <header className="flex items-center justify-between">
        <BrandLogo compact />
        <StarCounter value={totalStars} />
      </header>

      <div className="mt-2 flex flex-col items-center text-center">
        <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Rewards
        </p>
        <h1 className="mt-2 text-headline-lg">My Stickers 🌟</h1>
        <p className="text-on-surface-variant">
          {stickers.length === 0
            ? "Finish a game to earn your first sticker!"
            : `${stickers.length} sticker${stickers.length === 1 ? "" : "s"} • ⭐ ${totalStars} stars${learner?.level ? ` • Level ${learner.level}` : ""}`}
        </p>
      </div>

      {stickers.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-card">
          <p aria-hidden className="text-5xl">🎒</p>
          <p className="mt-3 font-bold">Your collection is empty</p>
          <p className="mt-1 text-sm text-on-surface-variant">Play any game to the end to earn stars and stickers.</p>
          <Link href="/play" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-black text-white">
            ▶ Play Now
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 pb-4">
          {[...byGame.entries()].map(([gameId, list]) => (
            <section key={gameId} aria-label={`${GAME_NAMES[gameId]?.name ?? gameId} stickers`} className="rounded-xl bg-white p-4 shadow-card">
              <h2 className="text-sm font-black">
                <span aria-hidden>{GAME_NAMES[gameId]?.icon ?? "🎮"} </span>
                {GAME_NAMES[gameId]?.name ?? gameId}
                <span className="ml-2 rounded-full bg-surface-high px-2 py-0.5 text-xs">{list.length}</span>
              </h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {list.slice(-12).map((s) => (
                  <div key={s.id} className="flex flex-col items-center rounded-lg bg-surface-low p-2">
                    <span aria-hidden className="text-3xl">{s.emoji}</span>
                    <span className="mt-1 text-center text-[10px] font-bold leading-tight">{s.name}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <nav className="flex gap-3 pb-8">
        <Link href="/play" className="flex-1 rounded-full bg-primary px-4 py-3 text-center font-black text-white">
          🎮 Games
        </Link>
        <Link href="/welcome" className="flex-1 rounded-full bg-surface-high px-4 py-3 text-center font-black">
          👤 Profile
        </Link>
      </nav>
    </div>
  );
}
