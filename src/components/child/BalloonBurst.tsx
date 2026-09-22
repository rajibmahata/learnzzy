"use client";

import * as React from "react";

// Lightweight celebration burst: emoji balloons float up and fade (~1.2s,
// one-shot). CSS-only, aria-hidden, pointer-transparent. Renders nothing under
// prefers-reduced-motion (the global CSS rule neutralizes motion too).
// Mount fresh each time ({cond && <BalloonBurst />}) so the rise replays.

const BALLOONS = ["🎈", "🎈", "✨", "⭐", "🎈", "✨", "🎈", "🌟"];

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      return undefined;
    }
  }, []);
  return reduced;
}

export function BalloonBurst({ count = 7 }: { count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BALLOONS.slice(0, Math.max(3, Math.min(8, count))).map((b, i) => (
        <span
          key={i}
          className="balloon-rise absolute bottom-0 text-3xl"
          style={{
            left: `${6 + i * 12}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${1 + (i % 3) * 0.22}s`,
          }}
        >
          {b}
        </span>
      ))}
    </div>
  );
}
