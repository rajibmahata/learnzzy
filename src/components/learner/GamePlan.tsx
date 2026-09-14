"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";

export function GamePlan() {
  const [plan, setPlan] = React.useState<{ items: { gameId: string; level: number; reason: string }[] } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const p = getCachedProfile();
    if (!p) { setLoading(false); return; }
    fetch(`/api/learners/${p.learnerId}/plan`).then((r) => r.json()).then((b) => {
      if (b.success) setPlan(b.data);
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-xl bg-white p-4 shadow-card text-center text-sm">Building your plan…</div>;
  if (!plan) return <div className="rounded-xl bg-white p-4 shadow-card text-center text-sm">Start playing to get a personalized plan. <Link href="/welcome" className="text-primary underline">Set up</Link></div>;

  const icons: Record<string, string> = { addition: "🔢", subtraction: "🐦", "clean-up": "🧹", puzzle: "🧩", sketch: "✏️" };
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <h3 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">Your Next Games</h3>
      <p className="text-xs text-on-surface-variant">Balanced for interest + need + variety</p>
      <ol className="mt-3 space-y-2">
        {plan.items.map((it) => (
          <li key={it.gameId} className="flex items-center gap-3 rounded-lg bg-surface-low px-3 py-2">
            <span aria-hidden className="text-xl">{icons[it.gameId] ?? "🎮"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black capitalize">{it.gameId} • Level {it.level}</p>
              <p className="text-xs text-on-surface-variant">{it.reason === "interest" ? "Because you love it" : it.reason === "need-practice" ? "Extra practice" : "Variety"}</p>
            </div>
            <Link href={`/play/${it.gameId}`} className="rounded-full bg-primary px-3 py-1 text-xs font-black text-white">Play</Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
