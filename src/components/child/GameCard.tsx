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

export function GameCard({ game }: { game: GameInfo }) {
  const inner = (
    <div
      className={`tactile flex flex-col rounded-xl p-5 text-left ${game.theme} ${
        game.disabled ? "opacity-60" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm">
          ⭐ {game.label}
        </span>
        <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          ▶
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{game.name}</p>
          <h2 className="text-headline-md">{game.tagline}</h2>
          <p className="mt-0.5 text-sm opacity-90">{game.label}</p>
        </div>
        <div aria-hidden className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/40 text-5xl">
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
