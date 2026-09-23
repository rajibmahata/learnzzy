import Link from "next/link";

// Child-safe 404 (docs/UI_UX.md §24–25 / §37 empty states).
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
      <p aria-hidden className="text-6xl">
        🌈
      </p>
      <h1 className="text-headline-md font-extrabold text-on-surface">Let&apos;s try another adventure!</h1>
      <p className="max-w-sm text-base font-bold text-on-surface-variant">
        This page wandered off. Your games are still here.
      </p>
      <Link
        href="/play"
        className="tactile-button flex min-h-touch-lg items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#004395]"
      >
        🎮 Play now
      </Link>
    </div>
  );
}
