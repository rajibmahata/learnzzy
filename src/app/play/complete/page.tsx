"use client";

import Link from "next/link";
import { useRewards } from "@/lib/rewards";
import { getCachedProfile } from "@/lib/learner";

// Shared celebration landing (docs/UI_UX.md §49 `/play/complete`).
// Games may redirect here after a full set; in-game Celebration remains the
// primary close, this route is the consistent "after the party" screen.
export default function PlayCompletePage() {
  const { totalStars, stickers } = useRewards();
  const profile = getCachedProfile();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 px-6 py-10 text-center">
      <p aria-hidden className="text-6xl animate-pulse">
        🎉
      </p>
      <h1 className="text-headline-lg font-extrabold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
        YOU DID IT!
      </h1>
      <p className="max-w-sm text-base font-bold text-on-surface-variant">
        {profile?.nickname ? `Amazing work, ${profile.nickname}!` : "Amazing work!"} Every game makes your brain stronger.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-full bg-white px-4 py-2 text-sm font-black shadow-card">
          ⭐ {totalStars} stars
        </span>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-black shadow-card">
          🏷️ {stickers.length} stickers
        </span>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/play"
          className="tactile-button flex min-h-touch-lg items-center justify-center rounded-full bg-primary px-6 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#004395]"
        >
          🎮 Play more
        </Link>
        <Link
          href="/stickers"
          className="tactile-button flex min-h-touch items-center justify-center rounded-full bg-white px-6 py-3 font-extrabold shadow-[0_4px_0_#d5e3fc]"
        >
          ⭐ My stickers
        </Link>
        <Link href="/play" className="text-sm font-bold text-on-surface-variant underline">
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
