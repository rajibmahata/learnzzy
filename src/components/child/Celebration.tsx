import * as React from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import type { Sticker } from "@/lib/rewards";
import { CharacterGuide } from "./CharacterGuide";
import type { CharacterId } from "@/lib/characters";
import { speakWithCharacter } from "@/lib/audio";
import { BalloonBurst, useReducedMotion } from "./BalloonBurst";
import { praiseFor } from "@/lib/companion";

export interface CelebrationMilestone {
  emoji: string;
  name: string;
  message: string;
}

export function Celebration({
  title = "AWESOME!",
  stars = 3,
  sticker,
  character,
  milestone,
  stickerCount,
  voiceLine,
  levelProgress,
  onReplay,
}: {
  title?: string;
  stars?: number;
  sticker?: Sticker | null;
  /** Optional celebrating guide (§8). Absent → unchanged rendering. */
  character?: CharacterId;
  milestone?: CelebrationMilestone | null;
  stickerCount?: number;
  /** Override the spoken praise line. Voice never blocks gameplay. */
  voiceLine?: string;
  levelProgress?: { from: number; to: number; promoted: boolean; gameName?: string } | null;
  onReplay?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const spokenRef = React.useRef(false);
  // Spoken praise rotates with the collection count, so consecutive
  // celebrations never sound like the same recording.
  const fallback = praiseFor({
    characterId: character ?? "teddy",
    moment: "celebration",
    count: stickerCount ?? 0,
    salt: "celebration",
  });
  React.useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    const line = voiceLine ?? fallback.line;
    // Gentle pause feel: speak after the visual lands. Failures continue silently.
    const timer = setTimeout(() => {
      try {
        speakWithCharacter(line, { lang: "en-US", rate: fallback.rate, pitch: fallback.pitch, characterId: character ?? "teddy" });
      } catch {}
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, voiceLine]);

  return (
    <section
      aria-live="polite"
      aria-label="Celebration"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 p-4 text-center"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/30 via-transparent to-amber-200/30" aria-hidden />
      <BalloonBurst />
      {/* Magical confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {!reducedMotion &&
          Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-bounce text-xl"
              style={{
                left: `${8 + i * 7}%`,
                top: `${-5 + (i % 3) * 8}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${1.2 + (i % 3) * 0.4}s`,
              }}
            >
              {["✨", "🌟", "💫", "⭐"][i % 4]}
            </span>
          ))}
      </div>
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-2xl border-2 border-white">
        <p aria-hidden className="text-4xl animate-pulse">
          ✨ 🎉 ✨
        </p>
        {character ? (
          <div className="mt-3">
            <CharacterGuide character={character} state="celebrating" compact={false} />
          </div>
        ) : null}
        <h2 className="mt-3 text-headline-lg bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">{title}</h2>
        {levelProgress ? (
          <div role="status" aria-label="Level progression" className="mt-3 w-full rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary-fixed/30 via-white to-secondary-fixed/20 p-3 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Level {levelProgress.from} ✓ Completed</p>
            <p aria-hidden className="text-lg">↓</p>
            {levelProgress.promoted ? (
              <p className="text-sm font-extrabold">Level {levelProgress.to} <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-xs">★ Next</span></p>
            ) : (
              <p className="text-sm font-bold text-on-surface-variant">Level {levelProgress.from} — keep practicing</p>
            )}
            {levelProgress.gameName ? <p className="mt-1 text-xs text-on-surface-variant">{levelProgress.gameName}</p> : null}
          </div>
        ) : null}
        {sticker ? (
          <div className="mt-4 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 blur-xl opacity-60 animate-pulse" aria-hidden />
              <div
                className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-200 to-orange-300 text-6xl shadow-[0_8px_0_#ffb95f] border-4 border-white ${reducedMotion ? "" : "animate-bounce"}`}
                style={{ animationDuration: "1.4s" }}
              >
                <span aria-hidden className={reducedMotion ? "" : "animate-spin"} style={{ animationDuration: "3s" }}>
                  {sticker.emoji}
                </span>
              </div>
              <span aria-hidden className="absolute -top-2 -right-2 text-2xl animate-bounce">
                ✨
              </span>
              <span aria-hidden className="absolute -bottom-1 -left-1 text-xl animate-ping">
                💫
              </span>
            </div>
            <p className="mt-3 rounded-full bg-gradient-to-r from-tertiary to-emerald-400 px-4 py-1.5 text-sm font-black text-white shadow-md">
              🎉 New Sticker: {sticker.name}!
            </p>
            <p className="mt-1 text-xs font-bold text-tertiary">Added to your magical collection ✨</p>
          </div>
        ) : null}
        {milestone ? (
          <p role="status" className="mt-3 rounded-full bg-gradient-to-r from-secondary-fixed to-secondary-container px-4 py-1.5 text-sm font-black">
            {milestone.emoji} {milestone.name}! {milestone.message}
          </p>
        ) : null}
        <p className="mt-4 font-black text-sunny text-lg">⭐ +{stars} Stars!</p>
        {typeof stickerCount === "number" ? <p className="text-xs font-bold text-on-surface-variant">⭐ Stickers: {stickerCount} • Keep exploring!</p> : null}
        <div className="mt-5 flex w-full flex-col gap-3">
          {onReplay ? (
            <Button size="xl" className="w-full shadow-lg" onClick={onReplay}>
              PLAY AGAIN ✨
            </Button>
          ) : null}
          <Link href="/play" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              🏠 Home
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
