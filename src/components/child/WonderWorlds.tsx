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
    <section aria-labelledby="worlds-title" className="mt-4">
      <div className="flex items-center justify-center gap-2 text-center">
        <h2 id="worlds-title" className="text-headline-md">
          ✨ Living Wonder Worlds
        </h2>
        <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-black text-primary">
          {WORLDS.filter((w) => byId.has(w.gameId)).length} Worlds
        </span>
      </div>
      <p className="mt-1 text-center text-sm text-on-surface-variant">Tap an enchanted world to jump in!</p>
      <nav aria-label="Wonder worlds" className="mt-3 flex flex-col gap-4 pb-4">
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
              className={`play-card tactile flex flex-col p-3 text-left ${dark ? "bg-[#1c2450] text-white" : "bg-white"}`}
            >
              <span className={`relative block h-44 overflow-hidden rounded-2xl bg-gradient-to-br ${w.gradient}`}>
                {art ? (
                  <img src={art} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center text-8xl">
                    {w.islandTag.split(" ")[0]}
                  </span>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-on-surface shadow-sm">
                  {w.islandTag}
                </span>
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-secondary shadow-sm">
                  ⭐ {w.spark}
                </span>
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-on-surface shadow-sm">
                  {w.host}
                </span>
                <span aria-hidden className="char char-idle absolute bottom-2 right-2 text-4xl leading-none drop-shadow">
                  {guide.emoji}
                </span>
              </span>
              <span className="flex items-center justify-between gap-3 px-1 pb-1 pt-3">
                <span className="min-w-0">
                  <span className={`block text-xl font-black leading-tight ${dark ? "text-white" : "text-on-surface"}`}>{w.world}</span>
                  <span className={`mt-0.5 block text-sm ${dark ? "text-white/85" : "text-on-surface-variant"}`}>{w.tagline}</span>
                </span>
                <span
                  aria-hidden
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black ${ARROW_BG[w.gameId] ?? ARROW_BG.addition}`}
                >
                  →
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
