"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";

interface AdventureCard {
  activity: { id: string; title: string; icon: string; world: string };
  reason: string;
  href: string;
}

export function DynamicAdventureHome() {
  const [cards, setCards] = React.useState<AdventureCard[] | null>(null);
  const [today, setToday] = React.useState<AdventureCard | null>(null);

  React.useEffect(() => {
    const profile = getCachedProfile();
    const learnerId = profile?.learnerId;
    if (!learnerId) return;
    fetch(`/api/learners/${encodeURIComponent(learnerId)}/next-adventure`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (b?.data?.today) setToday(b.data.today);
        if (Array.isArray(b?.data?.recommended)) setCards(b.data.recommended);
      })
      .catch(() => null);
  }, []);

  if (!cards && !today) return null;

  return (
    <section aria-labelledby="today-adventure" className="w-full max-w-5xl mt-6">
      {today && (
        <div className="rounded-3xl bg-gradient-to-br from-secondary-fixed via-secondary-container to-amber-100 p-5 shadow-[0_8px_0_#ffb95f] border-2 border-white">
          <h2 id="today-adventure" className="text-xl font-black">Today&apos;s Adventure</h2>
          <p className="text-sm font-bold text-on-secondary-fixed mt-1">Rex needs your help!</p>
          <Link href={today.href} className="mt-3 inline-flex min-h-touch items-center gap-2 rounded-full bg-primary px-6 py-3 font-black text-white shadow-[0_4px_0_#004395] active:translate-y-1 active:shadow-none">
            START ADVENTURE — {today.activity.title} {today.activity.icon}
          </Link>
          <p className="text-xs font-bold text-on-secondary-fixed/70 mt-2">{today.reason}</p>
        </div>
      )}
      {cards && cards.length > 0 && (
        <div className="mt-4">
          <h3 className="font-black text-lg">Recommended for you</h3>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cards.map((c) => (
              <Link key={c.activity.id} href={c.href} className="tactile flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-[0_4px_0_#d5e3fc] border-2 border-transparent hover:border-primary">
                <span aria-hidden className="text-3xl">{c.activity.icon}</span>
                <span className="font-extrabold text-sm">{c.activity.title}</span>
                <span className="text-xs text-on-surface-variant capitalize">{c.activity.world}</span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-center text-on-surface-variant mt-2">Discover • Play • Think • Create • Explore</p>
        </div>
      )}
    </section>
  );
}
