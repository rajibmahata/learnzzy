"use client";

export function LevelProgress({ level, max = 5 }: { level: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (level / max) * 100));
  return (
    <div className="w-full rounded-xl bg-white p-3 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Level {level} of {max}</span>
        <span className="rounded-full bg-primary-fixed px-2 py-1 text-xs font-black text-on-primary-fixed">⭐ Next at 80% accuracy</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-high">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary-container transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${i + 1 <= level ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-high text-on-surface-variant"}`}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}
