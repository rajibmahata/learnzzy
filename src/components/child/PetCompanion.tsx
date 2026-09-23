"use client";

import * as React from "react";
import { getCachedProfile } from "@/lib/learner";
import { getCharacterDef } from "@/lib/characters";
import { speakWithCharacter } from "@/lib/audio";
import { queueEvent } from "@/lib/events";
import {
  resolvePetIdentity,
  nextPetState,
  petStateToCharacterState,
  petVoiceLine,
  safeZonesFor,
  type PetState,
} from "@/lib/petCompanion";

// Persistent animated personal pet — resolves from current learner only.
// Ambient, contextual, non-blocking; roams only inside safe zones.
export function PetCompanion({
  context = "home",
  size = "md",
}: {
  context?: "home" | "game" | "forest" | "reward";
  size?: "sm" | "md" | "lg";
}) {
  const [identity, setIdentity] = React.useState(() => {
    try {
      const p = getCachedProfile() as { learnerId?: string; nickname?: string; displayName?: string; companion?: { characterId?: string; displayName?: string } } | null;
      return resolvePetIdentity(p);
    } catch { return null; }
  });
  const [state, setState] = React.useState<PetState>("IDLE");
  const [pos, setPos] = React.useState({ x: 20, y: 50 });
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [saidHi, setSaidHi] = React.useState(false);
  const tick = React.useRef(0);

  const reduced = React.useMemo(() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  }, []);

  // Re-resolve if learner switches (multi-child isolation)
  React.useEffect(() => {
    const onStorage = () => {
      try {
        const p = getCachedProfile() as never;
        setIdentity(resolvePetIdentity(p));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, []);

  // PetRoamingController: gentle roam inside safe zones + occasional run event
  React.useEffect(() => {
    if (!identity || reduced) return;
    queueEvent({ event: "petShown", gameId: `pet:${context}`, metadata: { pet: identity.characterId } });
    const id = setInterval(() => {
      tick.current += 1;
      const zones = safeZonesFor(context === "reward" ? "home" : context === "forest" ? "forest" : context === "game" ? "game" : "home");
      const zone = zones[tick.current % zones.length]!;
      const next = nextPetState({ learnerId: identity.learnerId, characterId: identity.characterId, context: context === "reward" ? "reward" : context, tick: tick.current, current: state });
      setState(next);
      // Move within zone (depth-scaled hop/run)
      const nx = zone.left + ((tick.current * 37 + identity.learnerId.length * 13) % Math.max(10, zone.width));
      const ny = zone.top + ((tick.current * 23) % Math.max(8, zone.height));
      setDir(nx >= pos.x ? 1 : -1);
      setPos({ x: nx, y: ny });
      if (next === "CELEBRATE") queueEvent({ event: "petCelebration", gameId: `pet:${context}`, metadata: { pet: identity.characterId } });
    }, 3200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.learnerId, identity?.characterId, context, reduced]);

  if (!identity) return null;
  const def = getCharacterDef(identity.characterId);
  const fontSize = size === "sm" ? "1.6rem" : size === "lg" ? "2.6rem" : "2rem";
  const moving = state === "RUN" || state === "WALK" || state === "HOP" || state === "JUMP" || state === "FOLLOW";

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden={false}>
      <button
        type="button"
        aria-label={`${identity.title}, ${petStateToCharacterState(state)}`}
        title={identity.title}
        onClick={() => {
          queueEvent({ event: "petInteraction", gameId: `pet:${context}`, metadata: { pet: identity.characterId, state } });
          setState("EXCITED");
          try {
            speakWithCharacter(petVoiceLine("EXCITED", identity.petName), { lang: "en-US", rate: 1.1, pitch: 1.18, characterId: identity.characterId });
          } catch {}
          setTimeout(() => setState("IDLE"), 1200);
        }}
        className="pointer-events-auto absolute flex flex-col items-center select-none active:scale-95 transition-transform"
        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `translate(-50%,-50%) scaleX(${dir === -1 ? -1 : 1})`, zIndex: 13 }}
      >
        <span aria-hidden className={moving && !reduced ? "animate-bounce" : ""} style={{ fontSize, animationDuration: "1.4s" }}>
          {def.emoji}
        </span>
        <span aria-hidden className="block rounded-full bg-black/15 blur-[2px]" style={{ width: 30, height: 6 }} />
        <span className="mt-0.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black shadow">{identity.title}</span>
        {!saidHi && context === "home" && (
          <span className="absolute -top-8 whitespace-nowrap rounded-2xl bg-white px-3 py-1 text-xs font-bold shadow-card">
            Ready for an adventure, {identity.learnerName}?
          </span>
        )}
      </button>
      <span
        className="sr-only"
        ref={(el) => {
          // Greet once per mount, occasionally (non-repetitive)
          if (el && !saidHi && identity) {
            setSaidHi(true);
          }
        }}
      />
    </div>
  );
}
