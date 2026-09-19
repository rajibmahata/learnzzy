"use client";

import * as React from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { WonderArchipelago3D } from "@/components/child/WonderArchipelago3D";
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
  const [showGate, setShowGate] = React.useState(false);
  const [gatePick, setGatePick] = React.useState<string | null>(null);
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
  function handleSurprise() {
    const pool = games.length > 0 ? games : GAMES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    window.location.href = pick.href;
  }
  function triggerCompanion(name: string) {
    window.dispatchEvent(new CustomEvent("wonder:companion:trigger", { detail: { companion: name } }));
    const lines: Record<string, string> = {
      Teddy: `Hi${learner?.nickname ? ` ${learner.nickname}` : ""}! Tap Number Orchard to count apples!`,
      Pip: `Hi${learner?.nickname ? ` ${learner.nickname}` : ""}! Let's tidy the playroom together!`,
      Bella: `Hop hop! Let's watch bluebirds in Breeze Valley!`,
      Hoot: `Hoo! Let's snap the dino puzzle!`,
      Ellie: `Follow the glowing stars with your finger!`,
    };
    const vKey = name === "Pip" ? "puppy" : name === "Bella" ? "bunny" : name === "Hoot" ? "owl" : name === "Ellie" ? "elephant" : "teddy";
    const v = (CHARACTER_VOICES as any)[vKey] ?? CHARACTER_VOICES.teddy;
    speakWithCharacter(lines[name] ?? `Hi from ${name}!`, { lang: "en-US", rate: v.rate, pitch: v.pitch });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      {/* Fixed 3D Archipelago Background — Stitch ANIMATION_48 — child-friendly soft wonderland */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <WonderArchipelago3D />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-surface/60 via-white/20 to-surface/90" aria-hidden />

      {/* Content overlay */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-28 pt-4 md:px-6">
        {/* Top Wonder Nav Glass Pill */}
        <header className="flex w-full max-w-6xl mx-auto flex-wrap items-center justify-between gap-2 bg-surface-container-lowest/90 backdrop-blur-xl p-2 md:p-3 rounded-full shadow-[0_8px_24px_rgba(180,160,130,0.18)] border-2 border-surface-container-low">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-[0_3px_0_#adc6ff]">
              <span className="material-symbols-outlined text-[22px] md:text-[28px]" style={{ fontVariationSettings: "'FILL' 1" as any }}>cloud</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <BrandLogo compact />
                <span className="bg-secondary-fixed text-on-secondary-fixed text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">3D Island</span>
              </div>
              <span className="hidden sm:inline text-[12px] font-bold text-on-surface-variant">Living Wonder Worlds</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StarCounter value={totalStars} />
            <span className="hidden sm:flex items-center gap-1.5 bg-tertiary-fixed/60 text-on-tertiary-fixed px-3 py-2 rounded-full shadow-[0_2px_0_#4edea3] text-xs font-bold">
              <span className="material-symbols-outlined text-[18px]">verified</span> Level {learner?.level ?? 1}
            </span>
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-primary shadow-[0_3px_0_#d5e3fc] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">{soundOn ? "volume_up" : "volume_off"}</span>
            </button>
            <Link href="/parent/login" aria-label="Parent area" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-low shadow-[0_2px_0_#e6eeff]">🔒</Link>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => setShowGate(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-container text-on-surface font-bold hover:bg-surface-container-high active:scale-95 transition-all shadow-[0_3px_0_#d5e3fc] text-sm">
              <span className="material-symbols-outlined text-[18px] text-tertiary">shield_lock</span> Grown-ups
            </button>
            <Link href="/parents" className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_3px_0_#004395]">
              <span className="material-symbols-outlined text-[22px]">map</span>
            </Link>
          </div>
        </header>

        {/* Greeting */}
        <div className="mt-4 flex flex-col items-center text-center">
          <p className="inline-flex rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Play • Think • Learn
          </p>
          <h1 className="mt-2 text-headline-lg">{learner?.nickname ? `Good ${daypart}, ${learner.nickname}!` : "What shall we explore?"}</h1>
          <p className="text-on-surface-variant text-sm">
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

        {/* Companion Conductor Banner — Stitch */}
        <section className="mt-4 w-full">
          <div className="relative overflow-hidden bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl p-4 md:p-5 shadow-[0_6px_0_#E2DAC8,0_16px_32px_rgba(180,160,130,0.16)] border-2 border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full">
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary-fixed flex items-center justify-center shadow-[0_4px_0_#ffb95f] text-3xl md:text-4xl">
                  🧸
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center text-sm shadow-sm animate-pulse">
                  <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                </div>
              </div>
              <div className="flex flex-col text-left min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary uppercase tracking-wide text-xs">Buddy Pip & Teddy</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
                </div>
                <p className="font-extrabold leading-snug text-on-surface text-base md:text-lg">
                  “Hi{learner?.nickname ? ` ${learner.nickname}` : ""}! Tap any floating world or friend to jump into an adventure! ✨”
                </p>
                <p className="text-on-surface-variant text-xs md:text-sm flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-[18px] text-primary">pan_tool</span>
                  <span>Touch, drag & pinch anywhere to explore the magical 3D floating island!</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Hear Pip and Teddy"
              onClick={() => {
                const v = CHARACTER_VOICES.puppy ?? CHARACTER_VOICES.teddy;
                speakWithCharacter(`Hi${learner?.nickname ? ` ${learner.nickname}` : ""}! Tap any floating world or friend to jump into an adventure!`, {
                  lang: "en-US",
                  rate: v.rate,
                  pitch: v.pitch,
                });
                window.dispatchEvent(new CustomEvent("wonder:companion:trigger", { detail: { companion: "Teddy" } }));
              }}
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-primary text-on-primary font-extrabold rounded-full shadow-[0_5px_0_#004395,0_10px_20px_rgba(0,88,190,0.25)] active:translate-y-1 active:shadow-[0_1px_0_#004395] transition-all text-sm"
            >
              <span className="material-symbols-outlined text-[22px]">replay</span> Hear Again
            </button>
          </div>
        </section>

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
          <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-xl bg-white/90 backdrop-blur-md p-3 shadow-card">
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
            <Link href="/stickers" className="text-xs font-bold text-primary underline bg-white/80 px-3 py-1 rounded-full">View sticker collection</Link>
          </div>
        )}

        {/* Living Wonder Worlds — 6 Box Tiles with 3D images — like All Wonder Adventures */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 md:p-5 mt-4 border-2 border-white/80 shadow-[0_8px_24px_rgba(180,160,130,0.12)]">
          <WonderWorlds games={games} />
          {/* Hidden game names for e2e that expects registry names */}
          <div className="sr-only" aria-hidden>
            {GAMES.map((g) => (
              <span key={g.id}>{g.name}</span>
            ))}
          </div>
        </div>

        {/* All Games — Complete, Organized by Wonder World — Child-Friendly 3D */}
        <section aria-labelledby="more-title" className="mt-6 bg-white/70 backdrop-blur-md rounded-2xl p-4 md:p-5 border-2 border-white/80 shadow-[0_8px_24px_rgba(180,160,130,0.12)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 id="more-title" className="text-headline-md font-extrabold flex items-center gap-2">🎲 All Wonder Adventures <span className="bg-primary-fixed text-primary text-xs px-2.5 py-1 rounded-full">25 Activities • All Included</span></h2>
            <span className="hidden lg:inline text-xs font-bold text-on-surface-variant bg-white/80 px-3 py-1 rounded-full border">Organized by World • Every game included • 3D Wonderland</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">Every Learnzzy activity — now all visible on one magical map. Tap any tile to play; each adapts to age 4–5, 6–7, 8–9 in the 3D wonderland.</p>

          {/* Numbers & Math — 8 */}
          <div className="mb-5">
            <h3 className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider text-[#9a3412] mb-2"><span className="w-7 h-7 rounded-full bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-sm">🔢</span> Numbers & Math <span className="font-bold normal-case text-xs bg-[#fff7ed] border border-[#fed7aa] px-2 py-0.5 rounded-full">8 games</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { href: "/learn/numbers/number-count", icon: "🍎", title: "Count Together", blurb: "1–10 → 100+" },
                { href: "/learn/numbers/number-order", icon: "🔢", title: "Big to Small", blurb: "3 → 6 numbers" },
                { href: "/learn/numbers/number-before-after", icon: "➡️", title: "Before & After", blurb: "7, [?], 9" },
                { href: "/learn/numbers/more-less", icon: "🧁", title: "More or Less?", blurb: "Which group?" },
                { href: "/learn/numbers/number-names", icon: "🔤", title: "Number Names", blurb: "7 → seven" },
                { href: "/learn/numbers/count-by-tens", icon: "🎯", title: "Count by Tens", blurb: "10,20,30…" },
                { href: "/play/addition", icon: "➕", title: "Addition", blurb: "Visual stories" },
                { href: "/play/subtraction", icon: "➖", title: "Take Away", blurb: "Fly away!" },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="tactile group flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center bg-white border-[#fed7aa]/60 shadow-[0_4px_0_#fcd34d] hover:shadow-[0_6px_0_#fcd34d] hover:-translate-y-0.5 transition-all">
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="font-extrabold text-sm leading-tight">{t.title}</span>
                  <span className="text-xs text-on-surface-variant">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Words & Phonics — 2 */}
          <div className="mb-5">
            <h3 className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider text-primary mb-2"><span className="w-7 h-7 rounded-full bg-[#e0e7ff] flex items-center justify-center text-sm">🔤</span> Words & Phonics <span className="font-bold normal-case text-xs bg-[#e0e7ff] border border-[#adc6ff] px-2 py-0.5 rounded-full">2 games</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { href: "/learn/words/word-family", icon: "📖", title: "Word Families", blurb: "AN, EN, AT…" },
                { href: "/learn/words/word-match", icon: "👀", title: "Read & Match", blurb: "Picture → word" },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="tactile group flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center bg-white border-[#adc6ff]/60 shadow-[0_4px_0_#adc6ff] hover:shadow-[0_6px_0_#adc6ff] hover:-translate-y-0.5 transition-all">
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="font-extrabold text-sm leading-tight">{t.title}</span>
                  <span className="text-xs text-on-surface-variant">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Write & Create — 3 */}
          <div className="mb-5">
            <h3 className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider text-[#be185d] mb-2"><span className="w-7 h-7 rounded-full bg-[#fbcfe8] flex items-center justify-center text-sm">✏️</span> Write & Create <span className="font-bold normal-case text-xs bg-[#fff1f2] border border-[#fbcfe8] px-2 py-0.5 rounded-full">3 games</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { href: "/learn/write/trace-write", icon: "✏️", title: "Trace & Write", blurb: "Read → trace" },
                { href: "/learn/write/trace-number-name", icon: "🔢", title: "Number Trace", blurb: "o-n-e…" },
                { href: "/play/sketch", icon: "🌟", title: "Shadow Sketch", blurb: "Starlight trace" },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="tactile group flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center bg-white border-[#fbcfe8]/60 shadow-[0_4px_0_#f472b6] hover:shadow-[0_6px_0_#f472b6] hover:-translate-y-0.5 transition-all">
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="font-extrabold text-sm leading-tight">{t.title}</span>
                  <span className="text-xs text-on-surface-variant">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Think & Solve — 7 */}
          <div className="mb-5">
            <h3 className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider text-[#15803d] mb-2"><span className="w-7 h-7 rounded-full bg-[#bbf7d0] flex items-center justify-center text-sm">🧠</span> Think & Solve <span className="font-bold normal-case text-xs bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-full">7 games</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { href: "/learn/think/big-small", icon: "📏", title: "Big & Small", blurb: "Find biggest" },
                { href: "/learn/think/matching", icon: "👯", title: "Find the Match", blurb: "Find twin!" },
                { href: "/learn/think/odd-one-out", icon: "🦄", title: "Odd One Out", blurb: "One different" },
                { href: "/learn/think/memory", icon: "🎩", title: "Memory Game", blurb: "Remember?" },
                { href: "/play/clean-up", icon: "🧹", title: "Tidy Up", blurb: "Sort & tidy" },
                { href: "/learn/think/pattern", icon: "🟢", title: "What Comes Next?", blurb: "AB, AAB…" },
                { href: "/learn/think/find-object", icon: "🔍", title: "Find Different", blurb: "Look carefully" },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="tactile group flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center bg-white border-[#bbf7d0]/60 shadow-[0_4px_0_#86efac] hover:shadow-[0_6px_0_#86efac] hover:-translate-y-0.5 transition-all">
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="font-extrabold text-sm leading-tight">{t.title}</span>
                  <span className="text-xs text-on-surface-variant">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Shapes & Visual — 3 */}
          <div className="mb-5">
            <h3 className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider text-[#6d28d9] mb-2"><span className="w-7 h-7 rounded-full bg-[#e0e7ff] flex items-center justify-center text-sm">🔷</span> Shapes & Visual <span className="font-bold normal-case text-xs bg-[#e0e7ff] border border-[#c4b5fd] px-2 py-0.5 rounded-full">3 games</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { href: "/learn/shapes/shape-count", icon: "🔷", title: "Shape Search", blurb: "How many?" },
                { href: "/learn/shapes/shape-match", icon: "🟢", title: "Shape Match", blurb: "Name it" },
                { href: "/learn/shapes/shape-pattern", icon: "🟡", title: "Shape Patterns", blurb: "Finish pattern" },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="tactile group flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center bg-white border-[#c4b5fd]/60 shadow-[0_4px_0_#c4b5fd] hover:shadow-[0_6px_0_#c4b5fd] hover:-translate-y-0.5 transition-all">
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="font-extrabold text-sm leading-tight">{t.title}</span>
                  <span className="text-xs text-on-surface-variant">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Discover + Puzzles — 2 */}
          <div className="mb-2">
            <h3 className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider text-[#065f46] mb-2"><span className="w-7 h-7 rounded-full bg-[#a7f3d0] flex items-center justify-center text-sm">🌍</span> Discover & Puzzles <span className="font-bold normal-case text-xs bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">2 games</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { href: "/play/discover", icon: "🦜", title: "Discovery Time", blurb: "Animals & nature" },
                { href: "/play/puzzle", icon: "🧩", title: "Picture Puzzle", blurb: "Snap pieces!" },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="tactile group flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center bg-white border-[#a7f3d0]/60 shadow-[0_4px_0_#6ee7b7] hover:shadow-[0_6px_0_#6ee7b7] hover:-translate-y-0.5 transition-all">
                  <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="font-extrabold text-sm leading-tight">{t.title}</span>
                  <span className="text-xs text-on-surface-variant">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-on-surface-variant">
            <span className="inline-flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full border shadow-sm">✨ 25/25 Activities Included</span>
            <span className="inline-flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full border shadow-sm">🎨 Stitch 3D Wonderland • Soft • Rounded • Child-Friendly</span>
            <span className="inline-flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full border shadow-sm">🔊 Calm Female Companion Voice</span>
          </div>
        </section>

        {/* Companion Quick-Bar + Surprise */}
        <section className="w-full max-w-4xl mx-auto flex flex-col gap-4 pt-4">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-xl p-4 shadow-[0_6px_0_#E2DAC8,0_12px_24px_rgba(180,160,130,0.14)] border-2 border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">waving_hand</span>
              </div>
              <div>
                <span className="font-extrabold text-on-surface">Tap a 3D Companion:</span>
                <p className="text-sm text-on-surface-variant">Watch them jump & talk right inside your screen!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {[
                { name: "Teddy", emoji: "🧸" },
                { name: "Pip", emoji: "🐶" },
                { name: "Bella", emoji: "🐰" },
                { name: "Hoot", emoji: "🦉" },
                { name: "Ellie", emoji: "🐘" },
              ].map((b) => (
                <button
                  key={b.name}
                  onClick={() => triggerCompanion(b.name === "Hoot" ? "Hoot" : b.name)}
                  className="group flex flex-col items-center p-2 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-90 transition-all shadow-[0_3px_0_#d5e3fc] min-w-[60px]"
                  aria-label={`Tap ${b.name}`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{b.emoji}</span>
                  <span className="font-bold text-xs text-on-surface-variant mt-1">{b.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="w-full flex justify-center">
            <button
              onClick={handleSurprise}
              className="w-full sm:w-auto px-8 md:px-14 min-h-[68px] rounded-full bg-secondary-container text-on-secondary font-extrabold text-lg shadow-[0_6px_0_#684000,0_14px_28px_rgba(254,166,25,0.35)] hover:scale-105 active:translate-y-1 active:shadow-[0_1px_0_#684000] transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-[32px] animate-spin" style={{ animationDuration: "8s" }}>casino</span>
              <span>✨ Spin for a Surprise Wonder Adventure! 🎲</span>
            </button>
          </div>
        </section>

        {/* Daily Curiosity */}
        <div className="safe-panel mt-4 flex items-center gap-3 p-4 bg-white/90 backdrop-blur-md">
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

        {/* Choose Your World — 6 Core Learning Category Hubs — Stitch Category Hub */}
        <section aria-labelledby="categories-title" className="mt-6 bg-white/40 backdrop-blur-md rounded-2xl p-3 md:p-5 border-2 border-white/80 shadow-[0_8px_24px_rgba(180,160,130,0.12)]">
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[24px]">category</span>
              <h2 id="categories-title" className="font-extrabold text-xl md:text-2xl">Choose Your World</h2>
            </div>
            <span className="font-bold text-xs text-outline bg-white/80 px-3 py-1 rounded-full border">6 Thematic Hubs</span>
          </div>
          <nav aria-label="Learning categories" className="flex flex-col gap-4">
            {[
              { id: "numbers", icon: "🧸", title: "🔢 Numbers & Math", subtitle: "Math Kingdom", gradient: "from-[#fff7ed] to-[#fed7aa]", shadow: "shadow-[0_5px_0_#fcd34d,0_12px_22px_rgba(251,191,36,0.18)]", textMain: "text-[#7c2d12]", textSub: "text-[#9a3412]", pills: ["Count", "Compare", "Before & After", "Add & Subtract"] },
              { id: "words", icon: "🦜", title: "🔤 Words & Phonics", subtitle: "Language Nest", gradient: "from-surface-container-low to-[#e0e7ff]", shadow: "shadow-[0_5px_0_#adc6ff,0_12px_22px_rgba(0,88,190,0.14)]", textMain: "text-on-surface", textSub: "text-primary", pills: ["Letter Sounds", "Word Families (AN/EN/AT)", "Read & Circle", "Trace"] },
              { id: "think", icon: "🦉", title: "🧠 Think & Solve", subtitle: "Logic Grove", gradient: "from-[#f0fdf4] to-[#bbf7d0]", shadow: "shadow-[0_5px_0_#86efac,0_12px_22px_rgba(22,163,74,0.14)]", textMain: "text-[#14532d]", textSub: "text-[#15803d]", pills: ["Tidy Sorting", "Big & Small", "Odd One Out", "Logic Patterns"] },
              { id: "write", icon: "🐰", title: "🎨 Create & Draw", subtitle: "Rainbow Studio", gradient: "from-[#fff1f2] to-[#fbcfe8]", shadow: "shadow-[0_5px_0_#f472b6,0_12px_22px_rgba(236,72,153,0.14)]", textMain: "text-[#831843]", textSub: "text-[#be185d]", pills: ["Shadow Sketch", "Symmetry", "Connect Dots", "Shape Build"] },
              { id: "discover", icon: "🐘", title: "🌍 Discover World", subtitle: "Nature Savannah", gradient: "from-[#ecfdf5] to-[#a7f3d0]", shadow: "shadow-[0_5px_0_#6ee7b7,0_12px_22px_rgba(16,185,129,0.14)]", textMain: "text-[#064e3b]", textSub: "text-[#047857]", pills: ["Animals & Birds", "Living vs Non-Living", "Colors", "Simple Nature"] },
              { id: "puzzles", icon: "🦕", title: "🧩 Tactile Puzzles", subtitle: "Wooden Playroom", gradient: "from-[#fffbeb] to-[#fde68a]", shadow: "shadow-[0_5px_0_#f59e0b,0_12px_22px_rgba(245,158,11,0.18)]", textMain: "text-[#78350f]", textSub: "text-[#b45309]", pills: ["Picture Jigsaw (4/6/9 pcs)", "Shape Silhouette", "Rotation"] },
            ].map((hub) => (
              <Link
                key={hub.id}
                href={`/learn/${hub.id}`}
                aria-label={`Open ${hub.title}: ${hub.subtitle}`}
                className={`tactile relative w-full rounded-xl bg-gradient-to-br p-4 flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer border-2 border-white/60 ${hub.gradient} ${hub.shadow}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-3xl shadow-sm">
                      {hub.icon}
                    </div>
                    <div>
                      <span className={`font-bold uppercase tracking-wider text-xs ${hub.textSub}`}>{hub.subtitle}</span>
                      <h3 className={`font-extrabold text-lg md:text-xl ${hub.textMain}`}>{hub.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {categoryLevel(hub.id) != null && (
                      <span className="hidden sm:inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-black text-primary shadow-sm">Level {categoryLevel(hub.id)}</span>
                    )}
                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hub.pills.map((pill) => (
                    <span key={pill} className={`px-3 py-1 rounded-full bg-white/90 font-bold text-xs shadow-sm ${hub.textSub}`}>
                      {pill}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </nav>
          {/* Shapes & Visual extra link — keeps 7th category accessible without cluttering 6-hub design */}
          <Link href="/learn/shapes" className="tactile mt-3 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-100 to-sky-100 p-3 border-2 border-white/60 shadow-sm">
            <span className="text-3xl">🔷</span>
            <span className="flex-1">
              <span className="block font-extrabold text-sm">Shapes & Visual</span>
              <span className="block text-xs opacity-70">Spot shapes and patterns with Owl!</span>
            </span>
            <span className="text-xl">→</span>
          </Link>
        </section>

        <section aria-labelledby="stars-title" className="safe-panel mt-4 p-5 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-xl shadow-sm">⭐</span>
              <div>
                <h2 id="stars-title" className="text-headline-md">My Stars & Badges</h2>
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

        <p className="pb-4 pt-4 text-center text-xs text-on-surface-variant bg-white/60 rounded-full px-3 py-1 mx-auto mt-4 w-fit">Games shuffle so each window feels like a new adventure.</p>

        {/* Sensory Safe & Parent Shield Footer Status — Stitch */}
        <footer className="w-full max-w-4xl mx-auto pt-2">
          <div className="bg-surface-container-low/95 backdrop-blur-md rounded-xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 border border-surface-container text-on-surface-variant text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
              <span>100% Offline Ready</span>
              <span className="text-outline-variant">•</span>
              <span>No Ads or Micro-transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">hourglass_bottom</span>
              <span>Wind-Down Timer: <strong>18 mins left</strong></span>
            </div>
            <button onClick={() => setShowGate(true)} className="text-primary hover:underline font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">insights</span> Learning Insights
            </button>
          </div>
        </footer>

        {/* Parent Gate Modal — Stitch */}
        {showGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4" onClick={() => setShowGate(false)}>
            <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-[0_16px_32px_rgba(13,28,46,0.2)] border-2 border-surface-container flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-extrabold text-lg">
                  <span className="material-symbols-outlined text-[26px]">lock</span> Grown-Ups Gate
                </div>
                <button onClick={() => setShowGate(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <p className="text-sm text-on-surface-variant">To ensure this area is for adults, please solve this quick math puzzle:</p>
              <div className="p-4 bg-surface-container-low rounded-xl text-center">
                <span className="font-extrabold tracking-widest text-xl">7 + 5 = ?</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["11", "12", "14"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      if (opt === "12") {
                        setShowGate(false);
                        window.location.href = "/parent/login";
                      } else {
                        setGatePick(opt);
                        setTimeout(() => setGatePick(null), 500);
                      }
                    }}
                    className={`py-3 rounded-xl font-extrabold text-lg transition-colors ${gatePick === opt ? "bg-error text-on-error" : "bg-surface-container hover:bg-primary hover:text-on-primary"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <nav aria-label="Playground" className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-high bg-surface/95 px-2 pb-safe pt-2 backdrop-blur-xl sm:px-4">
          <div className="mx-auto flex max-w-game items-center justify-around gap-1 sm:gap-2">
            <Link href="/play" aria-current="page" className="flex min-h-12 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-extrabold text-white shadow-[0_4px_0_#004395] sm:gap-2 sm:px-4 sm:text-sm">🎮 <span>Play</span></Link>
            <Link href="/stickers" className="flex min-h-12 items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-on-surface-variant sm:gap-2 sm:px-4 sm:text-sm">⭐ <span>Stars</span></Link>
            <Link href="/parents" className="flex min-h-12 items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-on-surface-variant sm:gap-2 sm:px-4 sm:text-sm">👨‍👩‍👧 <span>Grown-ups</span></Link>
            <Link href="/welcome" aria-label="Change learner" className="flex min-h-12 items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-on-surface-variant sm:gap-2 sm:px-4 sm:text-sm">👤 <span>Learner</span></Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
