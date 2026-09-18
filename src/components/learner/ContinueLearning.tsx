"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";

// Continue Learning (spec §37): the home page opens with a personal pick —
// the first item of the learner's deterministic plan (interest + need +
// variety) — instead of a random list. No new API: reuses the learner plan.
const ICONS: Record<string, string> = {
  addition: "🔢", subtraction: "🐦", "clean-up": "🧹",
  puzzle: "🧩", sketch: "✏️", discover: "🧭",
};

export function ContinueLearning() {
  const [next, setNext] = React.useState<{ gameId: string; level: number; reason: string } | null>(null);
  const [nickname, setNickname] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    const p = getCachedProfile();
    if (!p) return;
    setNickname(p.nickname);
    fetch(`/api/learners/${p.learnerId}/plan`).then((r) => r.json()).then((b) => {
      if (b.success && Array.isArray(b.data?.items) && b.data.items.length > 0) setNext(b.data.items[0]);
    }).catch(() => null);
  }, []);
  if (!next) return null;
  return (
    <section aria-labelledby="continue-title" className="safe-panel tactile mt-3 block p-4 text-left">
      <p className="text-[11px] font-black uppercase tracking-wider text-primary">
        ⭐ Continue learning{nickname ? `, ${nickname}` : ""}
      </p>
      <div className="mt-1 flex items-center gap-3">
        <span aria-hidden className="text-4xl">{ICONS[next.gameId] ?? "🎮"}</span>
        <div className="min-w-0 flex-1">
          <h2 id="continue-title" className="truncate font-extrabold capitalize">
            Let&apos;s practice {next.gameId}!
          </h2>
          <p className="text-sm text-on-surface-variant">
            Level {next.level} • {next.reason === "interest" ? "Because you love it" : next.reason === "need-practice" ? "Extra practice" : "Something new"}
          </p>
        </div>
        <Link
          href={`/play/${next.gameId}`}
          className="tactile-button shrink-0 bg-primary px-5 py-2 text-white"
          aria-label={`Continue learning with ${next.gameId}`}
        >
          Go →
        </Link>
      </div>
    </section>
  );
}
