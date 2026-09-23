// Child-safe loading state (docs/UI_UX.md §24 — no generic spinners).
export default function RootLoading() {
  return (
    <div
      role="status"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-surface px-6 text-center"
    >
      <p aria-hidden className="text-5xl animate-pulse">
        🌈
      </p>
      <p className="text-lg font-extrabold text-on-surface">A little adventure is loading…</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
