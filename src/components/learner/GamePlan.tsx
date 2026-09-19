"use client";

import * as React from "react";
import Link from "next/link";
import { getCachedProfile } from "@/lib/learner";
import { WORLDS, artForGame } from "@/lib/worlds";
import { getCharacterDef, characterForGame } from "@/lib/characters";

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

  if (loading) return <div className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(180,160,130,0.12)] text-center text-sm border-2 border-white">Building your magical plan… ✨</div>;
  if (!plan) return <div className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(180,160,130,0.12)] text-center text-sm border-2 border-white">Start playing to get a personalized plan. <Link href="/welcome" className="text-primary underline font-bold">Set up</Link></div>;

  const globalLevel = plan.items[0]?.level ?? 1;
  // Personalized order, but show ALL 6 games attractively with 3D images
  const orderedIds = plan.items.map((it) => it.gameId);
  const allWorlds = [...WORLDS].sort((a, b) => {
    const ia = orderedIds.indexOf(a.gameId);
    const ib = orderedIds.indexOf(b.gameId);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const reasonLabel = (r: string) => r === "interest" ? "Because you love it 💛" : r === "need-practice" ? "Extra practice 🌱" : r === "discovery" ? "New discovery 🔍" : "Fresh fun 🎲";
  const reasonColor: Record<string, string> = {
    interest: "bg-amber-100 text-amber-800 border-amber-200",
    "need-practice": "bg-emerald-100 text-emerald-800 border-emerald-200",
    discovery: "bg-violet-100 text-violet-800 border-violet-200",
    variety: "bg-sky-100 text-sky-800 border-sky-200",
  };

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-md p-4 md:p-5 shadow-[0_8px_24px_rgba(180,160,130,0.14)] border-2 border-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">🎯 Your Next Games • Global Level {globalLevel}<span className="hidden sm:inline-flex bg-primary-fixed text-primary text-[11px] px-2 py-0.5 rounded-full">3D Wonder • All 6 Worlds</span></h3>
          <p className="text-xs text-on-surface-variant mt-1">Personalized order — same level, every world adapts to YOU with 3D magic ✨</p>
        </div>
        <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-secondary-fixed text-lg">🌟</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allWorlds.map((w) => {
          const planItem = plan.items.find((it) => it.gameId === w.gameId);
          const reason = planItem?.reason ?? "variety";
          const guide = getCharacterDef(characterForGame(w.gameId));
          const art = artForGame(w.gameId);
          const isTop = orderedIds[0] === w.gameId;
          return (
            <Link
              key={w.gameId}
              href={`/play/${w.gameId}`}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left shadow-[0_6px_0_rgba(180,160,130,0.15)] hover:shadow-[0_8px_0_rgba(180,160,130,0.2)] hover:-translate-y-1 transition-all ${isTop ? "ring-2 ring-primary border-primary/20" : "border-white"} ${w.dark ? "bg-[#1c2450]" : ""}`}
            >
              {isTop && <span className="absolute left-2 top-2 z-10 rounded-full bg-primary text-white text-[11px] font-black px-2.5 py-1 shadow">⭐ Next Up</span>}
              <div className={`relative h-32 overflow-hidden ${w.dark ? "bg-[#1c2450]" : `bg-gradient-to-br ${w.gradient}`}`}>
                {art ? (
                  <img src={art} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center text-6xl">{w.islandTag.split(" ")[0]}</span>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black shadow-sm">{w.islandTag}</span>
                <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black text-secondary shadow-sm">⭐ {w.spark}</span>
                <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black shadow-sm max-w-[55%] truncate">{w.host}</span>
                <span aria-hidden className="absolute bottom-2 right-2 text-2xl drop-shadow">{guide.emoji}</span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h4 className={`text-[15px] font-black leading-tight ${w.dark ? "text-white" : "text-on-surface"}`}>{w.world}</h4>
                <p className={`mt-1 line-clamp-2 text-xs leading-snug ${w.dark ? "text-white/80" : "text-on-surface-variant"}`}>{w.tagline}</p>
                <span className={`mt-2 inline-flex w-fit rounded-full border px-2 py-1 text-[11px] font-bold ${reasonColor[reason] ?? reasonColor.variety}`}>{reasonLabel(reason)}</span>
                <span className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">Tap to play →</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-black">▶</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-on-surface-variant">All 6 worlds included • 3D images • Child-friendly wonderland 🎨</p>
    </div>
  );
}
