"use client";

import * as React from "react";
import type { StickerDef } from "@/lib/stickers";
import { stickerToCreature, forestLevel, type LivingCreature, initialCreatureState } from "@/lib/livingForest";
import { speakWithCharacter } from "@/lib/audio";
import { useRewards } from "@/lib/rewards";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch { return undefined; }
  }, []);
  return reduced;
}

function useIsSoundMuted(): boolean {
  const [muted, setMuted] = React.useState(false);
  React.useEffect(() => {
    try {
      setMuted(localStorage.getItem("learnzzy.soundMuted.v1") === "true");
      const h = () => setMuted(localStorage.getItem("learnzzy.soundMuted.v1") === "true");
      window.addEventListener("storage", h);
      return () => window.removeEventListener("storage", h);
    } catch { return undefined; }
  }, []);
  return muted;
}

export function LivingForest({ stickers, learnerId, onCreatureTap }: { stickers: StickerDef[]; learnerId: string | null; onCreatureTap?: (c: LivingCreature) => void }) {
  const reducedMotion = useReducedMotion();
  const isMuted = useIsSoundMuted();
  const [creatures, setCreatures] = React.useState<LivingCreature[]>(() => {
    return stickers.map((s, i) => {
      const base = stickerToCreature(s);
      // Deterministic initial position per learner+sticker
      let h = 2166136261;
      const seed = `${learnerId ?? "guest"}:${s.id}`;
      for (let k = 0; k < seed.length; k++) h = Math.imul(h ^ seed.charCodeAt(k), 16777619);
      const x = 10 + (h % 80);
      const y = base.habitat === "canopy" ? 20 + (h % 20) : base.habitat === "pond" ? 72 + (h % 15) : base.habitat === "flower-garden" ? 65 + (h % 20) : 45 + (h % 25);
      return {
        ...base,
        learnerId: learnerId ?? "guest",
        stickerId: s.id,
        unlockedAt: new Date().toISOString(),
        state: initialCreatureState(learnerId ?? "guest", s.id),
        x: Math.max(5, Math.min(95, x)),
        y,
        direction: (h % 2 ? 1 : -1) as 1 | -1,
      };
    });
  });

  // Keep creatures in sync when stickers change (new unlock)
  React.useEffect(() => {
    setCreatures((prev) => {
      const prevIds = new Set(prev.map((c) => c.stickerId));
      const next = [...prev];
      for (const s of stickers) {
        if (!prevIds.has(s.id)) {
          const base = stickerToCreature(s);
          let h = 2166136261;
          const seed = `${learnerId ?? "guest"}:${s.id}:new`;
          for (let k = 0; k < seed.length; k++) h = Math.imul(h ^ seed.charCodeAt(k), 16777619);
          next.push({
            ...base,
            learnerId: learnerId ?? "guest",
            stickerId: s.id,
            unlockedAt: new Date().toISOString(),
            state: "WALKING",
            x: 105,
            y: base.habitat === "canopy" ? 25 : base.habitat === "pond" ? 78 : 50,
            direction: -1,
          });
        }
      }
      return next;
    });
  }, [stickers, learnerId]);

  // Natural behavior loop — deterministic, lightweight
  React.useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setCreatures((prev) =>
        prev.map((c) => {
          // Simple state machine: WALKING → LOOKING → RESTING → WALKING
          const r = Math.random();
          if (c.state === "WALKING" && r < 0.08) return { ...c, state: "LOOKING" as const };
          if (c.state === "LOOKING" && r < 0.15) return { ...c, state: "WALKING" as const, direction: (Math.random() < 0.5 ? 1 : -1) as 1 | -1 };
          if (c.state === "WALKING") {
            const nx = c.x + c.direction * (c.movement === "fly" ? 0.6 : 0.35);
            if (nx > 96 || nx < 4) return { ...c, direction: (-c.direction as 1 | -1), x: Math.max(4, Math.min(96, nx)) };
            return { ...c, x: nx };
          }
          if (c.state === "FLYING") {
            const nx = c.x + c.direction * 0.8;
            const ny = c.y + Math.sin(Date.now() / 800 + c.x) * 0.15;
            if (nx > 98 || nx < 2) return { ...c, direction: (-c.direction as 1 | -1) };
            return { ...c, x: nx, y: Math.max(15, Math.min(85, ny)) };
          }
          return c;
        })
      );
    }, 120);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const level = forestLevel(stickers.length);

  // Performance: cap visible creatures by viewport
  const visible = React.useMemo(() => {
    const cap = typeof window !== "undefined" && window.innerWidth < 640 ? 8 : window.innerWidth < 1024 ? 12 : 22;
    return creatures.slice(0, cap);
  }, [creatures]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-2 border-white shadow-xl bg-gradient-to-b from-sky-200 via-emerald-50 to-amber-50">
      {/* Background — mountains, sky, clouds (parallax) */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50" aria-hidden />
      <div className="absolute top-6 left-1/4 w-32 h-16 bg-white/60 rounded-full blur-[1px]" aria-hidden />
      <div className="absolute top-10 right-1/4 w-24 h-10 bg-white/50 rounded-full blur-[1px]" aria-hidden />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-amber-300 text-sm animate-pulse" aria-hidden>☀️</div>
      {/* Midground — large trees, pond */}
      <div className="absolute bottom-20 left-0 right-0 h-32 flex items-end justify-between px-2 gap-1" aria-hidden>
        <span className="text-5xl">🌳</span>
        <span className="text-4xl hidden sm:inline">🌲</span>
        <span className="text-5xl">🌳</span>
        <span className="text-3xl">🪨</span>
        <span className="text-4xl">🌳</span>
      </div>
      {/* Pond zone */}
      {level.unlockedHabitats.includes("pond") && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-20 rounded-t-[50%] bg-gradient-to-b from-sky-300/60 to-blue-200/60 border-t-2 border-white/60" aria-hidden>
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-blue-500/40 text-xs">〜〜〜 water ripples 〜〜〜</span>
          <span className="absolute bottom-2 left-8 text-xl">🪨</span>
          <span className="absolute bottom-3 right-10 text-lg">🌷</span>
        </div>
      )}
      {/* Flower garden zone */}
      {level.unlockedHabitats.includes("flower-garden") && (
        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2" aria-hidden>
          <span>🌸</span><span>🌼</span><span>🌷</span><span>🌸</span><span>🌼</span>
        </div>
      )}
      {/* Grass foreground */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-emerald-200/60 via-emerald-100/40 to-transparent" aria-hidden />
      {/* Creatures */}
      {visible.map((c) => (
        <button
          key={c.stickerId}
          type="button"
          aria-label={`${c.displayName} ${c.state.toLowerCase()} near ${c.habitat}`}
          onClick={() => {
            // Lightweight interaction — look toward child + sound + sparkle
            setCreatures((prev) => prev.map((p) => (p.stickerId === c.stickerId ? { ...p, state: "LOOKING" as const } : p)));
            if (!isMuted) {
              const sounds: Record<string, string> = { elephant: "Trump! 💫", bird: "Chirp! ✨", butterfly: "Flutter 💫", lion: "Roar ✨", bear: "Hello! 🌟" };
              speakWithCharacter(sounds[c.species] ?? `Hello from ${c.displayName}!`, { lang: "en-US", rate: 1.1, pitch: 1.15, characterId: "teddy" });
            }
            onCreatureTap?.(c);
            setTimeout(() => setCreatures((prev) => prev.map((p) => (p.stickerId === c.stickerId ? { ...p, state: "WALKING" as const } : p))), 900);
          }}
          className={`absolute flex flex-col items-center justify-center select-none active:scale-95 transition-transform ${c.state === "RESTING" ? "opacity-90" : ""}`}
          style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `translate(-50%, -50%) scaleX(${c.direction === -1 ? -1 : 1})`, fontSize: `${c.rarity === "rare" ? 2.2 : c.rarity === "special" ? 1.9 : 1.6}rem` }}
        >
          <span aria-hidden className={`${c.state === "WALKING" && !reducedMotion ? "animate-bounce" : ""}`} style={{ animationDuration: c.movement === "fly" ? "1.2s" : "1.6s" as any }}>
            {c.emoji}
          </span>
          {c.state === "LOOKING" && <span className="absolute -top-3 text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded-full shadow">👀</span>}
          {c.state === "DRINKING" && <span className="absolute -bottom-2 text-xs">💧</span>}
        </button>
      ))}
      {/* Forest level badge */}
      <div className="absolute left-2 top-2 rounded-full bg-white/95 px-3 py-1 text-xs font-black shadow">🌳 {level.title} • {stickers.length} friends</div>
      <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow">Level {level.level}</div>
      {/* Ambient particles — fireflies, leaves */}
      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute left-1/4 top-1/3 text-amber-300/60 text-xs animate-pulse">✦</span>
          <span className="absolute right-1/3 top-1/4 text-amber-200/50 text-[10px] animate-bounce">🍃</span>
          <span className="absolute left-1/3 bottom-1/4 text-white/40 text-xs animate-pulse">✦</span>
        </div>
      )}
    </div>
  );
}
