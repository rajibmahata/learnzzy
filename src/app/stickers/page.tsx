"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StarCounter } from "@/components/child/StarCounter";
import { getActiveLearnerId, getCachedProfile } from "@/lib/learner";
import { hydrateFromServer } from "@/lib/rewards";
import {
  ACTIVE_STICKERS,
  MILESTONES,
  STICKER_CATEGORIES,
  milestoneFor,
  type StickerDef,
} from "@/lib/stickers";
import { LivingForest } from "@/components/forest/LivingForest";

interface ServerCollection {
  totalStars: number;
  stickers: StickerDef[];
  stickerCount: number;
  catalogSize: number;
}

export default function StickersPage() {
  const [collection, setCollection] = React.useState<ServerCollection | null>(null);
  const [learnerName, setLearnerName] = React.useState<string | null>(null);
  const [level, setLevel] = React.useState<number | null>(null);

  React.useEffect(() => {
    const profile = getCachedProfile();
    const learnerId = profile?.learnerId ?? getActiveLearnerId();
    setLearnerName(profile?.nickname ?? null);
    setLevel(typeof profile?.level === "number" ? profile.level : null);
    if (!learnerId) return;
    let cancelled = false;
    fetch(`/api/learners/${encodeURIComponent(learnerId)}/rewards`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (cancelled || !b?.success || !b.data) return;
        const data = b.data as ServerCollection;
        setCollection(data);
        try {
          hydrateFromServer({ totalStars: data.totalStars, stickerIds: data.stickers.map((s) => s.id) }, learnerId);
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const owned = React.useMemo(() => new Set((collection?.stickers ?? []).map((s) => s.id)), [collection]);
  const count = collection?.stickerCount ?? 0;
  const catalogSize = collection?.catalogSize ?? ACTIVE_STICKERS.length;
  const milestone = milestoneFor(count);

  const forestStickers = React.useMemo(() => (collection?.stickers ?? []) as StickerDef[], [collection]);
  const [activeLearnerId, setActiveLearnerId] = React.useState<string | null>(null);
  React.useEffect(() => { setActiveLearnerId(getActiveLearnerId()); }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-4">
      <header className="flex items-center justify-between">
        <BrandLogo compact />
        <StarCounter value={collection?.totalStars ?? 0} />
      </header>

      <div className="mt-2 flex flex-col items-center text-center">
        <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          🌳 My Living Forest
        </p>
        <h1 className="mt-2 text-headline-lg">{learnerName ? `${learnerName}'s Living Forest` : "My Living Forest"} 🌳</h1>
        <p className="text-on-surface-variant text-sm">Every reward you earn comes alive here!</p>
        <p className="text-on-surface-variant text-xs mt-1">
          {count === 0
            ? "Finish a game to grow your forest!"
            : `${count} / ${catalogSize} friends • ⭐ ${collection?.totalStars ?? 0} stars${level ? ` • Level ${level}` : ""}`}
        </p>
        {milestone ? (
          <p role="status" className="mt-2 rounded-full bg-secondary-fixed px-3 py-1 text-xs font-black uppercase tracking-wide">
            {milestone.emoji} {milestone.name}!
          </p>
        ) : null}
      </div>

      {count === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-card">
          <p aria-hidden className="text-5xl">🌱</p>
          <p className="mt-3 font-bold">Your forest is a tiny seedling</p>
          <p className="mt-1 text-sm text-on-surface-variant">Play any game to the end to earn your first creature and grow a tree!</p>
          <Link href="/play" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-black text-white">
            ▶ Play Now
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 pb-4">
          {/* Living Forest — primary UI, not a sticker grid */}
          <section aria-label="My Living Forest" className="rounded-xl bg-white p-2 shadow-card">
            <div className="h-[420px] w-full">
              <LivingForest stickers={forestStickers} learnerId={activeLearnerId} />
            </div>
            <p className="mt-2 text-center text-xs text-on-surface-variant">Tap a creature — it looks at you ✨ • Your forest grows because you learn 🌳</p>
          </section>

          {/* My Friends — secondary, still inspectable */}
          <details className="rounded-xl bg-white p-4 shadow-card">
            <summary className="text-sm font-black cursor-pointer">👥 My Friends — {count} / {catalogSize}</summary>
            <div className="mt-3 flex flex-col gap-3">
              {STICKER_CATEGORIES.map((cat) => {
                const inCat = ACTIVE_STICKERS.filter((s) => s.category === cat.id);
                if (inCat.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h3 className="text-xs font-black">
                      <span aria-hidden>{cat.icon} </span>
                      {cat.name}
                      <span className="ml-2 rounded-full bg-surface-high px-2 py-0.5 text-xs">
                        {inCat.filter((s) => owned.has(s.id)).length}/{inCat.length}
                      </span>
                    </h3>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {inCat.map((s) =>
                        owned.has(s.id) ? (
                          <div key={s.id} className="flex flex-col items-center rounded-lg bg-surface-low p-2">
                            <span aria-hidden className="text-2xl">{s.emoji}</span>
                            <span className="mt-1 text-center text-[10px] font-bold leading-tight">{s.name}</span>
                          </div>
                        ) : (
                          <div key={s.id} className="flex flex-col items-center rounded-lg bg-surface-low/50 p-2 opacity-60" aria-label="Undiscovered sticker">
                            <span aria-hidden className="text-2xl">?</span>
                            <span className="mt-1 text-center text-[10px] font-bold leading-tight text-on-surface-variant">???</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>

          <section aria-label="Milestones" className="rounded-xl bg-white p-4 shadow-card">
            <h2 className="text-sm font-black">🏆 Collection milestones</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {MILESTONES.map((m) => (
                <li key={m.count} className={`flex items-center gap-2 ${count >= m.count ? "font-bold" : "text-on-surface-variant"}`}>
                  <span aria-hidden>{count >= m.count ? m.emoji : "🔒"}</span>
                  <span>{m.count} stickers — {m.name}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <nav className="flex gap-3 pb-8">
        <Link href="/play" className="flex-1 rounded-full bg-primary px-4 py-3 text-center font-black text-white">
          🎮 Games
        </Link>
        <Link href="/welcome" className="flex-1 rounded-full bg-surface-high px-4 py-3 text-center font-black">
          👤 Players
        </Link>
      </nav>
    </div>
  );
}
