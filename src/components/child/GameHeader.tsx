import Link from "next/link";
import { IconButton } from "../ui/IconButton";
import { StarCounter } from "./StarCounter";

export function GameHeader({
  title,
  stars,
  soundOn,
  onToggleSound,
  /** Optional round progress (UI_UX § ProgressIndicator): current 1-based, total. */
  progress,
  /** Optional global level badge shown mid-header. */
  level,
}: {
  title: string;
  stars: number;
  soundOn: boolean;
  onToggleSound: () => void;
  progress?: { current: number; total: number };
  level?: number;
}) {
  const pct =
    progress && progress.total > 0
      ? Math.max(0, Math.min(1, (progress.current - 1) / progress.total))
      : null;

  return (
    <header className="sticky top-0 z-20 -mx-4 flex w-[calc(100%+2rem)] flex-col gap-1 bg-surface/90 px-4 py-2 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/play" aria-label="Back to home">
            <IconButton label="Back to home">
              <span aria-hidden>🏠</span>
            </IconButton>
          </Link>
          <h1 className="max-w-[140px] truncate rounded-full bg-surface-high px-3 py-1.5 text-base font-extrabold sm:max-w-[220px]">
            {title}
          </h1>
          {typeof level === "number" ? (
            <span
              aria-label={`Level ${level}`}
              className="hidden rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-white shadow-[0_3px_0_#004395] sm:inline-flex"
            >
              LV {level}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <StarCounter value={stars} />
          <IconButton label={soundOn ? "Mute sound" : "Unmute sound"} onClick={onToggleSound}>
            <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
          </IconButton>
        </div>
      </div>
      {progress && progress.total > 1 ? (
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-label="Round progress"
          aria-valuemin={1}
          aria-valuemax={progress.total}
          aria-valuenow={progress.current}
          aria-valuetext={`Round ${progress.current} of ${progress.total}`}
        >
          <span className="sr-only">
            Round {progress.current} of {progress.total}
          </span>
          {Array.from({ length: progress.total }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < progress.current - 1
                  ? "bg-tertiary"
                  : i === progress.current - 1
                    ? "bg-primary"
                    : "bg-surface-container"
              }`}
              style={pct !== null && i === progress.current - 1 ? { minWidth: 12 } : undefined}
            />
          ))}
          <span aria-hidden className="ml-1 shrink-0 text-[11px] font-black text-on-surface-variant">
            {progress.current}/{progress.total}
          </span>
        </div>
      ) : null}
    </header>
  );
}
