import Link from "next/link";

export interface GameInfo {
  id: string;
  name: string;
  tagline: string;
  label: string;
  icon: string;
  href: string;
  theme: string;
  disabled?: boolean;
}

export function GameCard({ game, compact = false }: { game: GameInfo; compact?: boolean }) {
  const inner = (
    <div
      className={`play-card tactile flex flex-col text-left ${compact ? "p-4" : "p-5"} ${game.theme} ${
        game.disabled ? "opacity-60" : ""
      }`}
    >
      <div className={`${compact ? "mb-2" : "mb-3"} flex items-start justify-between gap-2`}>
        <span className={`inline-flex items-center gap-1 rounded-full bg-white/90 ${compact ? "px-2 py-0.5" : "px-3 py-1"} text-xs font-bold shadow-sm`}>
          ⭐ {game.label}
        </span>
        <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
          ▶
        </span>
      </div>
      <div className={`flex ${compact ? "flex-col" : "items-center"} justify-between gap-4`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{game.name}</p>
          <h2 className={`${compact ? "text-instruction" : "text-headline-md"} font-black`}>{game.tagline}</h2>
          <p className="mt-0.5 text-sm opacity-90">{game.label.replace(/\s+(Learn|Spot & Clean|Logic|Create)$/, "")}</p>
        </div>
        <div aria-hidden className={`flex shrink-0 items-center justify-center rounded-2xl bg-white/40 ${compact ? "h-24 w-full text-4xl" : "h-24 w-24 text-5xl"}`}>
          {game.icon}
        </div>
      </div>
    </div>
  );

  if (game.disabled) {
    return (
      <div aria-disabled className="cursor-not-allowed">
        {inner}
      </div>
    );
  }
  return (
    <Link href={game.href} aria-label={`Play ${game.tagline}`}>
      {inner}
    </Link>
  );
}
