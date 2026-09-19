import Link from "next/link";
import type { GameInfo } from "./GameCard";
import { WORLDS, artForGame } from "@/lib/worlds";
import { getCharacterDef, characterForGame } from "@/lib/characters";

// Living Wonder Worlds (Stitch e738ae27…): the selector feels like entering
// places, not opening a menu. Each world card carries a scene banner — a
// fetched Stitch art postcard where one exists, otherwise a gradient sky
// with the place emoji — overlaid with the island tag, spark badge, host,
// and a round arrow button. Registry entries (href/level/locking) untouched.

const ARROW_BG: Record<string, string> = {
  addition: "bg-primary text-white shadow-[0_4px_0_#004395]",
  subtraction: "bg-primary text-white shadow-[0_4px_0_#004395]",
  "clean-up": "bg-secondary-container text-on-secondary-fixed shadow-[0_4px_0_#ffb95f]",
  puzzle: "bg-tertiary-container text-white shadow-[0_4px_0_#047857]",
  sketch: "bg-secondary-container text-on-secondary-fixed shadow-[0_4px_0_#ffb95f]",
  discover: "bg-primary text-white shadow-[0_4px_0_#004395]",
};

export function WonderWorlds({ games }: { games: GameInfo[] }) {
  const byId = new Map(games.map((g) => [g.id, g]));
  return (
    <section aria-labelledby="worlds-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="worlds-title" className="text-headline-md font-extrabold flex items-center gap-2">✨ Featured Wonder Worlds</h2>
        <span className="rounded-full bg-primary-fixed text-primary text-xs font-black px-3 py-1 hidden sm:inline-flex">
          {WORLDS.filter((w) => byId.has(w.gameId)).length} Worlds • Tap to Play
        </span>
      </div>
      <p className="mt-1 text-sm text-on-surface-variant">Magical 3D islands — every world adapts to age 4–5, 6–7, 8–9</p>
      <nav aria-label="Wonder worlds" className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {WORLDS.map((w) => {
          const game = byId.get(w.gameId);
          if (!game) return null;
          const guide = getCharacterDef(characterForGame(w.gameId));
          const art = artForGame(w.gameId);
          const dark = w.dark;
          return (
            <Link
              key={w.gameId}
              href={game.href}
              aria-label={`Enter ${w.world}: ${w.tagline}`}
              className={`tactile group flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left shadow-[0_4px_0_rgba(180,160,130,0.18)] hover:shadow-[0_6px_0_rgba(180,160,130,0.22)] hover:-translate-y-1 transition-all ${dark ? "border-[#232a55] bg-[#1c2450] text-white" : "border-white"}`}
            >
              <span className={`relative block h-36 sm:h-40 overflow-hidden ${dark ? "bg-[#1c2450]" : `bg-gradient-to-br ${w.gradient}`}`}>
                {art ? (
                  <img src={art} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center text-7xl">
                    {w.islandTag.split(" ")[0]}
                  </span>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-on-surface shadow-sm">
                  {w.islandTag}
                </span>
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black text-secondary shadow-sm">
                  ⭐ {w.spark}
                </span>
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-black text-on-surface shadow-sm max-w-[60%] truncate">
                  {w.host}
                </span>
                <span aria-hidden className="absolute bottom-2 right-2 text-3xl leading-none drop-shadow char char-idle">
                  {guide.emoji}
                </span>
              </span>
              <span className="flex flex-col p-3 text-left flex-1">
                <span className={`block text-[15px] font-black leading-tight ${dark ? "text-white" : "text-on-surface"}`}>{w.world}</span>
                <span className={`mt-1 line-clamp-2 text-xs leading-snug ${dark ? "text-white/80" : "text-on-surface-variant"}`}>{w.tagline}</span>
                <span className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-surface-container-low border text-on-surface-variant">Tap to Play</span>
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-black ${ARROW_BG[w.gameId] ?? ARROW_BG.addition}`}
                  >
                    →
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
