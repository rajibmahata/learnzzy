"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";

export function HomeContinue() {
  const [next, setNext] = React.useState<{ gameId: string; level: number; reason: string } | null>(null);
  const [nickname, setNickname] = React.useState<string | null>(null);
  React.useEffect(() => {
    const p = getCachedProfile();
    if (!p?.learnerId) return;
    setNickname(p.nickname ?? null);
    fetch(`/api/learners/${p.learnerId}/plan`).then((r) => r.json()).then((b) => {
      if (b.success && Array.isArray(b.data?.items) && b.data.items.length > 0) setNext(b.data.items[0]);
    }).catch(() => null);
  }, []);
  if (!next) return null;
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return (
    <section aria-labelledby="continue-title" className="w-full max-w-5xl">
      <p className="text-center font-bold text-on-surface-variant">Good {daypart}{nickname ? `, ${nickname}` : ""}! Ready to explore?</p>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-surface-high bg-white p-4 shadow-pillow">
        <span aria-hidden className="text-4xl">⭐</span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Continue learning • Global Level {next.level}</p>
          <p className="truncate font-extrabold capitalize">Let&apos;s practice {next.gameId}!</p>
          <p className="text-sm text-on-surface-variant truncate">{next.reason === "need-practice" ? "Extra practice, just for you" : next.reason === "interest" ? "Because you love it" : next.reason === "discovery" ? "New discovery" : "Something new to discover"} • complexity adapts to you</p>
        </div>
        <Link href={`/play/${next.gameId}`} className="tactile-button shrink-0 bg-primary px-5 py-2 text-white">Go →</Link>
      </div>
    </section>
  );
}
