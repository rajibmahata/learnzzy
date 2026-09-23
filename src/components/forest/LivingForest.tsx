"use client";

import * as React from "react";
import type { StickerDef } from "@/lib/stickers";
import {
  stickerToCreature,
  forestLevel,
  hashSeed,
  depthScaleFor,
  expandRabbitPopulation,
  type LivingCreature,
  type FlockBird,
  type AmbientEventKind,
  type WowMomentKind,
  initialCreatureState,
} from "@/lib/livingForest";
import { speakWithCharacter } from "@/lib/audio";
import { PetCompanion } from "@/components/child/PetCompanion";

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

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function LivingForest({ stickers, learnerId, onCreatureTap }: { stickers: StickerDef[]; learnerId: string | null; onCreatureTap?: (c: LivingCreature) => void }) {
  const reducedMotion = useReducedMotion();
  const isMuted = useIsSoundMuted();
  const learner = learnerId ?? "guest";

  const [creatures, setCreatures] = React.useState<LivingCreature[]>(() => {
    return stickers.map((s) => {
      const base = stickerToCreature(s);
      const h = hashSeed(`${learner}:${s.id}`);
      const x = 10 + (h % 80);
      const y = base.habitat === "canopy" ? 20 + (h % 20) : base.habitat === "pond" ? 72 + (h % 15) : base.habitat === "flower-garden" ? 65 + (h % 20) : 45 + (h % 25);
      return {
        ...base,
        learnerId: learner,
        stickerId: s.id,
        unlockedAt: new Date().toISOString(),
        state: initialCreatureState(learner, s.id),
        x: Math.max(5, Math.min(95, x)),
        y,
        direction: (h % 2 ? 1 : -1) as 1 | -1,
      };
    });
  });

  // Persist forest state best-effort (Mongo authoritative when available, local fallback preserved)
  React.useEffect(() => {
    if (!learnerId) return;
    fetch(`/api/learners/${encodeURIComponent(learnerId)}/forest`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ favoriteIds: [] }),
    }).catch(() => undefined);
  }, [stickers.length, learnerId]);

  // Keep creatures in sync when stickers change (new unlock) — preserved behavior
  React.useEffect(() => {
    setCreatures((prev) => {
      const prevIds = new Set(prev.map((c) => c.stickerId.split("#")[0]));
      const next = [...prev];
      for (const s of stickers) {
        if (!prevIds.has(s.id)) {
          const base = stickerToCreature(s);
          next.push({
            ...base,
            learnerId: learner,
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
  }, [stickers, learner]);

  // Expanded population: one rabbit sticker → 3 rabbits with individual variation
  const visibleCreatures = React.useMemo(() => {
    const out: LivingCreature[] = [];
    for (const c of creatures) {
      if (c.species === "rabbit") out.push(...expandRabbitPopulation(c, learner));
      else out.push(c);
    }
    const cap = typeof window !== "undefined" && window.innerWidth < 640 ? 8 : typeof window !== "undefined" && window.innerWidth < 1024 ? 12 : 22;
    return out.slice(0, cap);
  }, [creatures, learner]);

  const level = forestLevel(stickers.length);

  // --- Bird flock system (earned birds + ambient flock) ---
  const [flock, setFlock] = React.useState<FlockBird[]>([]);
  const [flockActive, setFlockActive] = React.useState(false);

  // --- Foreground crossing (rabbit hops close to viewer) ---
  const [foreground, setForeground] = React.useState<{ x: number; dir: 1 | -1 } | null>(null);

  // --- Ambient butterflies (curved Bezier-like drift) ---
  const [butterflies, setButterflies] = React.useState<{ x: number; y: number; p: number }[]>(() => [
    { x: 20, y: 70, p: 0 },
    { x: 70, y: 66, p: 2 },
  ]);

  // --- Ambient event director + WOW moments + lighting cycle ---
  const [ambient, setAmbient] = React.useState<AmbientEventKind | null>(null);
  const [wow, setWow] = React.useState<WowMomentKind | null>(null);
  const [lighting, setLighting] = React.useState<"morning" | "day" | "evening">("day");

  // Lighting: deterministic Learnzzy world-time cycle (not child location)
  React.useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setLighting((l) => (l === "morning" ? "day" : l === "day" ? "evening" : "morning"));
    }, 45000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // Ambient event director: comfortable rhythm 8–20s, never continuous
  React.useEffect(() => {
    if (reducedMotion) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const events: AmbientEventKind[] = ["rabbit-cross", "bird-flock", "butterfly-pass", "leaves-wind", "fish-jump", "fireflies", "squirrel-branch"];
    const rand = mulberry(hashSeed(`${learner}:ambient`));
    const schedule = () => {
      const wait = 8000 + rand() * 12000;
      timer = setTimeout(() => {
        if (!alive) return;
        const next = events[Math.floor(rand() * events.length)]!;
        if (next === "bird-flock") {
          // Trigger flock fly-across
          const dir = rand() < 0.5 ? 1 : -1;
          const n = 3 + Math.floor(rand() * 2);
          setFlock(
            Array.from({ length: n }, (_, i) => ({
              id: `flock-${Date.now()}-${i}`,
              x: dir === 1 ? -8 - i * 6 : 108 + i * 6,
              y: 12 + i * 3 + rand() * 4,
              vx: dir * (1.1 + rand() * 0.5),
              state: "FLYING" as const,
              timer: 0,
              size: 0.8 + rand() * 0.4,
            }))
          );
          setFlockActive(true);
        } else {
          setAmbient(next);
          setTimeout(() => alive && setAmbient(null), 3500);
        }
        schedule();
      }, wait);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reducedMotion, learner]);

  // WOW moments: rare (~60s), short, skippable
  React.useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      const r = Math.random();
      if (r < 0.35) {
        const pool: WowMomentKind[] = ["butterfly-swarm", "bird-wave", "rainbow", "firefly-wave", "pond-splash"];
        setWow(pool[Math.floor(Math.random() * pool.length)]!);
        setTimeout(() => setWow(null), 5000);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // Foreground crossing: rabbit hops toward viewer occasionally
  React.useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      if (Math.random() < 0.3 && !foreground) setForeground({ x: -12, dir: 1 });
    }, 25000);
    return () => clearInterval(id);
  }, [reducedMotion, foreground]);

  // Single simulation tick: creatures + flock + butterflies + foreground
  React.useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      const t = Date.now();
      setCreatures((prev) =>
        prev.map((c) => {
          const r = Math.random();
          // Reaction: flock overhead → rabbits look up
          if (flockActive && c.species === "rabbit" && c.state === "WALKING" && r < 0.06) {
            return { ...c, state: "LOOKING" as const };
          }
          if (c.state === "WALKING" && r < 0.07) return { ...c, state: "LOOKING" as const };
          if (c.state === "LOOKING" && r < 0.14) return { ...c, state: "WALKING" as const, direction: (Math.random() < 0.5 ? 1 : -1) as 1 | -1 };
          if (c.state === "RESTING" && r < 0.1) return { ...c, state: "WALKING" as const };
          if (c.state === "WALKING" || c.state === "HOPPING") {
            // Depth-aware speed: foreground faster, background slower
            const depth = depthScaleFor(c.y);
            const nx = c.x + c.direction * (c.movement === "fly" || c.movement === "flutter" ? 0.55 * depth : 0.32 * depth);
            if (nx > 96 || nx < 4) return { ...c, direction: (-c.direction as 1 | -1), x: Math.max(4, Math.min(96, nx)) };
            return { ...c, x: nx };
          }
          if (c.state === "FLYING") {
            const nx = c.x + c.direction * 0.8;
            const ny = c.y + Math.sin(t / 800 + c.x) * 0.15;
            if (nx > 98 || nx < 2) return { ...c, direction: (-c.direction as 1 | -1) };
            return { ...c, x: nx, y: Math.max(15, Math.min(85, ny)) };
          }
          return c;
        })
      );
      // Flock update: fly across, occasionally land (perch) then take off
      setFlock((prev) => {
        if (prev.length === 0) return prev;
        let allGone = true;
        const next = prev.map((b) => {
          let nb = { ...b, timer: b.timer + 1 };
          if (nb.state === "FLYING") {
            nb.x += nb.vx;
            nb.y += Math.sin(t / 900 + nb.x / 8) * 0.2;
            if ((nb.vx > 0 && nb.x > 108) || (nb.vx < 0 && nb.x < -8)) nb.state = "DISAPPEARING";
            else {
              allGone = false;
              // Occasionally land on branch zone
              if (nb.timer > 40 && Math.random() < 0.02) nb.state = "LANDING";
            }
          } else if (nb.state === "LANDING") {
            nb.y += 0.4;
            if (nb.y >= 30) nb.state = "PERCHED";
            allGone = false;
          } else if (nb.state === "PERCHED") {
            allGone = false;
            if (nb.timer > 90 && Math.random() < 0.08) nb.state = "TAKING_OFF";
          } else if (nb.state === "TAKING_OFF") {
            nb.y -= 0.6;
            nb.x += nb.vx * 0.6;
            if (nb.y < 14) nb.state = "FLYING";
            allGone = false;
          } else {
            allGone = false;
          }
          return nb;
        });
        if (allGone) {
          setFlockActive(false);
          return [];
        }
        return next.filter((b) => b.state !== "DISAPPEARING");
      });
      // Foreground crossing update
      setForeground((f) => {
        if (!f) return f;
        const nx = f.x + f.dir * 1.4;
        if (nx > 115) return null;
        return { ...f, x: nx };
      });
      // Butterfly curved drift (Bezier-like + noise)
      setButterflies((prev) =>
        prev.map((b, i) => ({
          x: (b.x + 0.35 + Math.sin((t / 1600) * 1 + b.p) * 0.25 + 100) % 100,
          y: b.y + Math.cos(t / 1200 + b.p + i) * 0.12,
          p: b.p,
        }))
      );
    }, 130);
    return () => clearInterval(id);
  }, [reducedMotion, flockActive]);

  const lightingOverlay =
    lighting === "morning"
      ? "bg-amber-100/20"
      : lighting === "evening"
        ? "bg-orange-300/25"
        : "bg-white/0";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-2 border-white shadow-xl bg-gradient-to-b from-sky-200 via-emerald-50 to-amber-50" style={{ minHeight: 420 }}>
      {/* L1 Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50" aria-hidden style={{ zIndex: 0 }} />
      {/* L2 Clouds — slow drift */}
      <div className="absolute top-6 left-1/4 w-32 h-16 bg-white/60 rounded-full blur-[1px]" aria-hidden style={{ zIndex: 1 }} />
      <div className="absolute top-10 right-1/4 w-24 h-10 bg-white/50 rounded-full blur-[1px]" aria-hidden style={{ zIndex: 1 }} />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-amber-300 text-sm animate-pulse" aria-hidden style={{ zIndex: 1 }}>☀️</div>
      {/* L3 Mountains (distant) */}
      <div className="absolute top-14 left-0 right-0 text-center text-3xl opacity-40 select-none" aria-hidden style={{ zIndex: 2 }}>⛰️ ⛰️</div>
      {/* L4 Distant trees */}
      <div className="absolute top-28 left-0 right-0 flex justify-between px-6 opacity-60 text-2xl" aria-hidden style={{ zIndex: 3 }}>
        <span>🌲</span><span>🌲</span><span>🌲</span>
      </div>
      {/* L5 Birds layer — flock + distant silhouettes */}
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none" aria-hidden style={{ zIndex: 4 }}>
        {flock.map((b) => (
          <span
            key={b.id}
            className="absolute"
            style={{ left: `${b.x}%`, top: `${b.y}%`, fontSize: `${b.size}rem`, opacity: b.state === "PERCHED" ? 1 : 0.92 }}
          >
            🐦
          </span>
        ))}
        {/* Distant ambient silhouettes (always, tiny) */}
        {!reducedMotion && (
          <>
            <span className="absolute text-[10px] opacity-50 animate-pulse" style={{ left: "18%", top: "55%" }}>🐦</span>
            <span className="absolute text-[8px] opacity-40" style={{ left: "72%", top: "35%" }}>🐦</span>
          </>
        )}
      </div>
      {/* L6 Large trees / canopy */}
      <div className="absolute bottom-20 left-0 right-0 h-32 flex items-end justify-between px-2 gap-1" aria-hidden style={{ zIndex: 5 }}>
        <span className="text-5xl">🌳</span>
        <span className="text-4xl hidden sm:inline">🌲</span>
        <span className="text-5xl">🌳</span>
        <span className="text-3xl">🪨</span>
        <span className="text-4xl">🌳</span>
      </div>
      {/* Pond zone (L7 animals render above) */}
      {level.unlockedHabitats.includes("pond") && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-20 rounded-t-[50%] bg-gradient-to-b from-sky-300/60 to-blue-200/60 border-t-2 border-white/60" aria-hidden style={{ zIndex: 5 }}>
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-blue-500/40 text-xs">〜〜〜 water ripples 〜〜〜</span>
          {ambient === "fish-jump" && <span className="absolute left-1/2 -translate-x-1/2 -top-4 text-2xl animate-bounce">🐟</span>}
        </div>
      )}
      {/* Flower garden zone */}
      {level.unlockedHabitats.includes("flower-garden") && (
        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2" aria-hidden style={{ zIndex: 6 }}>
          <span>🌸</span><span>🌼</span><span>🌷</span><span>🌸</span><span>🌼</span>
        </div>
      )}
      {/* L7 Animals — earned creatures with depth scale + shadows */}
      {visibleCreatures.map((c) => {
        const depth = depthScaleFor(c.y);
        const base = c.rarity === "rare" ? 2.2 : c.rarity === "special" ? 1.9 : 1.6;
        return (
          <button
            key={c.stickerId}
            type="button"
            aria-label={`${c.displayName} ${c.state.toLowerCase()} near ${c.habitat}`}
            onClick={() => {
              setCreatures((prev) => prev.map((p) => (p.stickerId.split("#")[0] === c.stickerId.split("#")[0] ? { ...p, state: "LOOKING" as const } : p)));
              if (!isMuted) {
                const sounds: Record<string, string> = { elephant: "Trump! 💫", bird: "Chirp! ✨", butterfly: "Flutter 💫", lion: "Roar ✨", bear: "Hello! 🌟", rabbit: "Hop hop! ✨", frog: "Ribbit! 💧" };
                speakWithCharacter(sounds[c.species] ?? `Hello from ${c.displayName}!`, { lang: "en-US", rate: 1.1, pitch: 1.15, characterId: "teddy" });
              }
              onCreatureTap?.(c);
              setTimeout(() => setCreatures((prev) => prev.map((p) => (p.stickerId === c.stickerId ? { ...p, state: "WALKING" as const } : p))), 900);
            }}
            className="absolute flex flex-col items-center justify-center select-none active:scale-95 transition-transform"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `translate(-50%, -50%) scaleX(${c.direction === -1 ? -1 : 1})`, zIndex: 7 }}
          >
            <span aria-hidden className={`${(c.state === "WALKING" || c.state === "HOPPING") && !reducedMotion ? "animate-bounce" : ""}`} style={{ animationDuration: c.movement === "fly" ? "1.2s" : "1.6s" as never, fontSize: `${base * depth}rem` }}>
              {c.emoji}
            </span>
            {/* Soft shadow — size by depth */}
            <span aria-hidden className="block rounded-full bg-black/15 blur-[2px]" style={{ width: `${28 * depth}px`, height: 6 }} />
            {c.state === "LOOKING" && <span className="absolute -top-3 text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded-full shadow">👀</span>}
            {c.state === "DRINKING" && <span className="absolute -bottom-2 text-xs">💧</span>}
          </button>
        );
      })}
      {/* Ambient butterflies — depth layers, curved paths */}
      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ zIndex: 7 }}>
          {butterflies.map((b, i) => (
            <span key={i} className="absolute" style={{ left: `${b.x}%`, top: `${b.y}%`, fontSize: i === 0 ? "1.4rem" : "0.9rem", opacity: i === 0 ? 1 : 0.7 }}>
              🦋
            </span>
          ))}
        </div>
      )}
      {/* L8 Grass */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-emerald-200/60 via-emerald-100/40 to-transparent" aria-hidden style={{ zIndex: 8 }} />
      {/* L9 Flowers (foreground row) */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-3 text-sm" aria-hidden style={{ zIndex: 9 }}>
        <span>🌼</span><span>🌸</span><span>🌷</span>
      </div>
      {/* Foreground crossing — rabbit comes close (Whoa!) */}
      {foreground && !reducedMotion && (
        <div className="pointer-events-none absolute bottom-8" aria-hidden style={{ left: `${foreground.x}%`, zIndex: 9, fontSize: "3.2rem" }}>
          🐇
          <span className="block mx-auto rounded-full bg-black/20 blur-[3px]" style={{ width: 48, height: 8 }} />
        </div>
      )}
      {/* L10 Foreground leaves */}
      {!reducedMotion && ambient === "leaves-wind" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden style={{ zIndex: 10 }}>
          <span className="absolute left-[10%] top-[40%] text-lg animate-pulse">🍃</span>
          <span className="absolute left-[45%] top-[55%] text-base animate-bounce">🍂</span>
          <span className="absolute left-[75%] top-[45%] text-lg animate-pulse">🍃</span>
        </div>
      )}
      {/* L11 Particles + lighting */}
      <div className={`pointer-events-none absolute inset-0 ${lightingOverlay}`} aria-hidden style={{ zIndex: 11 }} />
      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ zIndex: 11 }}>
          <span className="absolute left-1/4 top-1/3 text-amber-300/60 text-xs animate-pulse">✦</span>
          <span className="absolute right-1/3 top-1/4 text-amber-200/50 text-[10px] animate-bounce">🍃</span>
          {(lighting === "evening" || ambient === "fireflies" || wow === "firefly-wave") && (
            <>
              <span className="absolute left-[30%] top-[60%] text-yellow-200 text-xs animate-pulse">✦</span>
              <span className="absolute right-[25%] top-[55%] text-yellow-100 text-[10px] animate-pulse">✦</span>
            </>
          )}
          {wow === "rainbow" && <span className="absolute left-1/2 top-8 -translate-x-1/2 text-4xl">🌈</span>}
          {wow === "butterfly-swarm" && (
            <>
              <span className="absolute left-[20%] top-[50%] text-xl animate-bounce">🦋</span>
              <span className="absolute left-[45%] top-[45%] text-lg animate-pulse">🦋</span>
              <span className="absolute left-[65%] top-[52%] text-xl animate-bounce">🦋</span>
            </>
          )}
        </div>
      )}
      {/* Personal pet — primary companion alongside earned creatures */}
      <PetCompanion context="forest" size="md" />
      {/* Forest level badge + UI */}
      <div className="absolute left-2 top-2 rounded-full bg-white/95 px-3 py-1 text-xs font-black shadow" style={{ zIndex: 12 }}>🌳 {level.title} • {stickers.length} friends</div>
      <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow" style={{ zIndex: 12 }}>Level {level.level}</div>
      {wow && (
        <button type="button" onClick={() => setWow(null)} aria-label="Skip magical moment" className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold shadow" style={{ zIndex: 12 }}>
          Skip ✨
        </button>
      )}
    </div>
  );
}
