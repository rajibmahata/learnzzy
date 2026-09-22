"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile, greetingName } from "@/lib/learner";
import { companionCallName, companionEmoji } from "@/lib/identity";

export function HomeContinue() {
  const [next, setNext] = React.useState<{ gameId: string; level: number; reason: string } | null>(null);
  const [who, setWho] = React.useState<{ name: string | null; buddy: string | null; buddyName: string | null }>({ name: null, buddy: null, buddyName: null });
  React.useEffect(() => {
    const p = getCachedProfile();
    if (!p?.learnerId) return;
    const name = greetingName(p);
    setWho({
      name: name === "Explorer" ? null : name,
      buddy: p.companion || p.avatar ? companionEmoji(p) : null,
      buddyName: p.companion ? companionCallName(p) : null,
    });
    fetch(`/api/learners/${p.learnerId}/plan`).then((r) => r.json()).then((b) => {
      if (b.success && Array.isArray(b.data?.items) && b.data.items.length > 0) setNext(b.data.items[0]);
    }).catch(() => null);
  }, []);
  if (!next) {
    if (!who.name) return null;
    return (
      <section aria-labelledby="welcome-back-title" className="w-full max-w-5xl">
        <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-surface-high bg-white p-4 shadow-pillow">
          <span aria-hidden className="text-4xl">{who.buddy ?? "🌟"}</span>
          <div className="min-w-0 flex-1 text-left">
            <h2 id="welcome-back-title" className="font-extrabold">Welcome back, {who.name}! 🌟</h2>
            <p className="text-sm text-on-surface-variant">{who.buddyName ? `${who.buddyName} is waiting! ` : ""}Ready for your next adventure?</p>
          </div>
          <Link href="/welcome?next=/play" className="tactile-button shrink-0 bg-primary px-5 py-2 text-white">Continue Adventure →</Link>
        </div>
      </section>
    );
  }
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const helloName = who.name ? `, ${who.name}` : "";
  return (
    <section aria-labelledby="continue-title" className="w-full max-w-5xl">
      <p className="text-center font-bold text-on-surface-variant">Good {daypart}{helloName}! Ready to explore?{who.buddyName ? ` ${who.buddyName} is waiting!` : ""}</p>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-surface-high bg-white p-4 shadow-pillow">
        <span aria-hidden className="text-4xl">⭐</span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Continue learning • Global Level {next.level}</p>
          <p className="truncate font-extrabold capitalize">Let&apos;s practice {next.gameId}!</p>
          <p className="text-sm text-on-surface-variant truncate">{next.reason === "need-practice" ? "Extra practice, just for you" : next.reason === "interest" ? "Because you love it" : next.reason === "discovery" ? "New discovery" : "Something new to discover"} • complexity adapts to you</p>
        </div>
        <Link href={`/welcome?next=/play/${next.gameId}`} className="tactile-button shrink-0 bg-primary px-5 py-2 text-white">Go →</Link>
      </div>
    </section>
  );
}
