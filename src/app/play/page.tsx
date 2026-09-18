"use client";

import * as React from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { WonderWorlds } from "@/components/child/WonderWorlds";
import { CATEGORIES } from "@/lib/categories";
import { StarCounter } from "@/components/child/StarCounter";
import { GAMES } from "@/games/registry";
import { shuffledForWindow } from "@/lib/windowSeed";
import { useRewards } from "@/lib/rewards";
import { getCachedProfile } from "@/lib/learner";
import { LearningJourney } from "@/components/learner/LearningJourney";
import { GamePlan } from "@/components/learner/GamePlan";
import { ContinueLearning } from "@/components/learner/ContinueLearning";
import { isSoundMuted, setSoundMuted, speakWithCharacter, CHARACTER_VOICES } from "@/lib/audio";
import Link from "next/link";
import { artForGame } from "@/lib/worlds";

// Category → plan games: per-category level pills reuse the learner plan
// (max skill level of the category's games). Real plan data only — no pill
// renders until the plan loads, never a guessed number.
const CATEGORY_GAMES: Record<string, string[]> = {
  numbers: ["addition", "subtraction"],
  words: ["discover"],
  write: ["sketch"],
  think: ["clean-up"],
  shapes: ["puzzle"],
  discover: ["discover"],
  puzzles: ["puzzle"],
};

export default function PlayHome() {
  const { totalStars, stickers } = useRewards();
  const [games, setGames] = React.useState(GAMES);
  const [learner, setLearner] = React.useState<{ learnerId?: string; nickname?: string; ageBand?: string; level?: number } | null>(null);
  const [planLevels, setPlanLevels] = React.useState<Record<string, number>>({});
  const [soundOn, setSoundOn] = React.useState(true);
  React.useEffect(() => {
    setGames(shuffledForWindow(GAMES));
    const profile = getCachedProfile();
    setLearner(profile);
    setSoundOn(!isSoundMuted());
    if (profile?.learnerId) {
      fetch(`/api/learners/${profile.learnerId}/plan`).then((r) => r.json()).then((b) => {
        if (b.success && Array.isArray(b.data?.items)) {
          const levels: Record<string, number> = {};
          for (const it of b.data.items) {
            if (it?.gameId && typeof it.level === "number") levels[it.gameId] = it.level;
          }
          setPlanLevels(levels);
        }
      }).catch(() => null);
    }
  }, []);
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  function categoryLevel(id: string): number | null {
    const levels = (CATEGORY_GAMES[id] ?? []).map((g) => planLevels[g]).filter((n) => typeof n === "number");
    return levels.length > 0 ? Math.max(...levels) : null;
  }
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
            onClick={() => {
              setSoundOn((value) => {
                setSoundMuted(value);
                return !value;
              });
            }}
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
        <h1 className="mt-2 text-headline-lg">{learner?.nickname ? `Good ${daypart}, ${learner.nickname}!` : "What shall we explore?"}</h1>
        <p className="text-on-surface-variant">
          {learner ? (
            <>
              <span className="mr-1 inline-flex rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-black text-primary">
                Age {learner.ageBand ?? "6-7"} • Level {learner.level ?? 1}
              </span>{" "}
              Ready to explore today? <Link href="/welcome" className="underline">Change</Link>
            </>
          ) : (
            <>
              <Link href="/welcome" className="font-bold text-primary underline">Set up</Link> your learning journey — or just play!
            </>
          )}
        </p>
      </div>

      {/* Buddy Pip greeting (Stitch living-wonder-worlds): fetched puppy art,
          invite line, and a Listen button in Pip's voice. */}
      <div className="safe-panel mt-4 flex items-center gap-3 p-3">
        <span aria-hidden className="char char-idle shrink-0">
          <img
            src={artForGame("clean-up") ?? undefined}
            alt=""
            loading="lazy"
            className="h-14 w-14 rounded-full border-2 border-amber-300 object-cover shadow-card"
          />
        </span>
        <div className="min-w-0 text-left">
          <p className="text-[11px] font-black uppercase tracking-wider text-primary">Buddy Pip • Tap to play!</p>
          <p className="truncate text-sm font-extrabold">“Hi{learner?.nickname ? ` ${learner.nickname}` : ""}! Tap an enchanted world to jump in! ✨”</p>
        </div>
        <button
          type="button"
          aria-label="Hear Pip's greeting"
          onClick={() => {
            const v = CHARACTER_VOICES.puppy ?? CHARACTER_VOICES.teddy;
            speakWithCharacter(`Hi${learner?.nickname ? ` ${learner.nickname}` : ""}! Tap an enchanted world to jump in!`, {
              lang: "en-US",
              rate: v.rate,
              pitch: v.pitch,
            });
          }}
          className="tactile ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-lg text-primary shadow-[0_3px_0_#adc6ff]"
        >
          🔊
        </button>
      </div>

      {learner ? <div className="mt-3"><LearningJourney /></div> : null}

      {learner ? (
        <div className="mt-3">
          <ContinueLearning />
          <div className="mt-3">
            <GamePlan />
          </div>
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

      <WonderWorlds games={games} />
      {/* Daily Curiosity (Stitch category-hub): a real discovery invite —
          Ellie the Elephant lives in Discovery World, one tap away. */}
      <div className="safe-panel mt-4 flex items-center gap-3 p-4">
        <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-4xl">🐘</span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[11px] font-black uppercase tracking-wider text-tertiary">Daily Curiosity</p>
          <p className="truncate text-sm font-extrabold">Meet Ellie the Elephant!</p>
          <p className="truncate text-xs text-on-surface-variant">A new friend is waiting in Discovery World.</p>
        </div>
        <button
          type="button"
          aria-label="Hear about Ellie the Elephant"
          onClick={() => speakWithCharacter("Meet Ellie the Elephant! An elephant has a long trunk. Come say hello in Discovery World!", { lang: "en-US" })}
          className="tactile flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-lg text-primary shadow-[0_3px_0_#adc6ff]"
        >
          🔊
        </button>
        <Link
          href="/play/discover"
          aria-label="Meet Ellie in Discovery World"
          className="tactile-button shrink-0 bg-tertiary-container px-4 py-2 text-sm font-extrabold text-white"
        >
          Meet Ellie
        </Link>
      </div>
      <section aria-labelledby="categories-title" className="mt-1">
        <h2 id="categories-title" className="text-center text-headline-md">🌳 Learning World</h2>
        <p className="mt-1 text-center text-sm text-on-surface-variant">Choose a land, then pick an activity inside!</p>
        <nav aria-label="Learning categories" className="mt-3 grid grid-cols-1 gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/learn/${c.id}`}
              aria-label={`Open ${c.name}: ${c.tagline}`}
              className={`tactile flex items-center gap-3 rounded-3xl bg-gradient-to-br p-4 text-left shadow-card ${c.gradient}`}
            >
              <span aria-hidden className="text-4xl">{c.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{c.name}</span>
                <span className="block truncate text-sm opacity-80">{c.skillsLine}</span>
              </span>
              {categoryLevel(c.id) != null ? (
                <span className="shrink-0 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-primary shadow-sm">
                  Level {categoryLevel(c.id)}
                </span>
              ) : null}
              <span aria-hidden className="text-xl">→</span>
            </Link>
          ))}
        </nav>
      </section>
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
      <Link href={games[0]?.href ?? "/play/addition"} className="tactile-button mt-4 flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-answer text-amber-950">
        <span aria-hidden>✨</span> Spin for a Wonder Adventure!
      </Link>
      <p className="pb-4 pt-4 text-center text-xs text-on-surface-variant">Games shuffle so each window feels like a new adventure.</p>
      <nav aria-label="Playground" className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-high bg-surface/95 px-2 pb-safe pt-2 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex max-w-game items-center justify-around gap-1 sm:gap-2">
          <Link href="/play" aria-current="page" className="flex min-h-12 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-extrabold text-white shadow-[0_4px_0_#004395] sm:gap-2 sm:px-4 sm:text-sm">🎮 <span>Play</span></Link>
          <Link href="/stickers" className="flex min-h-12 items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-on-surface-variant sm:gap-2 sm:px-4 sm:text-sm">⭐ <span>Stars</span></Link>
          <Link href="/parents" className="flex min-h-12 items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-on-surface-variant sm:gap-2 sm:px-4 sm:text-sm">👨‍👩‍👧 <span>Grown-ups</span></Link>
          <Link href="/welcome" aria-label="Change learner" className="flex min-h-12 items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-on-surface-variant sm:gap-2 sm:px-4 sm:text-sm">👤 <span>Learner</span></Link>
        </div>
      </nav>
    </div>
  );
}
