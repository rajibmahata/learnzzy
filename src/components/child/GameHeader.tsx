import Link from "next/link";
import { IconButton } from "../ui/IconButton";
import { StarCounter } from "./StarCounter";

export function GameHeader({
  title,
  stars,
  soundOn,
  onToggleSound,
}: {
  title: string;
  stars: number;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  return (
    <header className="flex w-full items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2">
        <Link href="/play" aria-label="Back to home">
          <IconButton label="Back to home">
            <span aria-hidden>🏠</span>
          </IconButton>
        </Link>
        <h1 className="rounded-full bg-surface-high px-3 py-1.5 text-base font-extrabold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <StarCounter value={stars} />
        <IconButton label={soundOn ? "Mute sound" : "Unmute sound"} onClick={onToggleSound}>
          <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
        </IconButton>
      </div>
    </header>
  );
}
