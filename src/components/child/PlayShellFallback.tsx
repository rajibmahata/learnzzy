// Lightweight route-level fallback for child areas (loading.tsx sibling).
export function PlayShellFallback({ label = "Getting your game ready… ✨" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-4 text-center">
      <p aria-hidden className="text-4xl animate-pulse">
        ✨
      </p>
      <p className="safe-panel px-5 py-4 text-base font-extrabold text-on-surface">{label}</p>
    </div>
  );
}
