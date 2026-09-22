"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cacheProfile, greetingName, setActiveLearnerId, type DeviceLearner } from "@/lib/learner";
import { companionCallName, companionEmoji } from "@/lib/identity";
import { speakWithCharacter } from "@/lib/audio";

function initialFor(name?: string): string {
  const ch = (name ?? "").trim().charAt(0);
  return ch ? ch.toUpperCase() : "🌟";
}

export function ChildSelector({
  learners,
  activeId,
  next,
  onAdd,
}: {
  learners: DeviceLearner[];
  activeId: string | null;
  next: string;
  onAdd: () => void;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  async function select(learner: DeviceLearner) {
    setBusyId(learner.learnerId);
    setError("");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      let res: Response;
      try {
        res = await fetch(`/api/learners/${encodeURIComponent(learner.learnerId)}`, { cache: "no-store", signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) throw new Error("Profile unavailable");
      const body = await res.json();
      const doc = body.data as { learnerId: string; displayName?: string; nickname?: string; avatar?: string; companion?: { characterId: string; displayName?: string }; ageBand: "4-5" | "6-7" | "8-9"; level: number; totalStars?: number };
      setActiveLearnerId(doc.learnerId);
      cacheProfile({ learnerId: doc.learnerId, displayName: doc.displayName ?? learner.displayName, nickname: doc.nickname ?? learner.nickname, avatar: doc.avatar ?? learner.avatar, companion: doc.companion ?? learner.companion, ageBand: doc.ageBand, level: doc.level, totalStars: doc.totalStars });
      router.push(next);
    } catch {
      setError("Could not load that profile. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col gap-4 px-4 py-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-surface-high text-5xl shadow-card">
          🌈<span className="absolute right-1 top-1 text-xl">⭐</span>
        </div>
        <p className="mt-3 inline-flex rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary">🧸 Play • Think • Learn</p>
        <h1 className="mt-2 text-headline-lg">Who&apos;s playing today?</h1>
        <p className="text-sm text-on-surface-variant">Pick your name to continue your own adventure.</p>
      </div>

      <div className="flex flex-col gap-3" role="list" aria-label="Players on this device">
        {learners.map((learner) => {
          const isActive = learner.learnerId === activeId;
          return (
            <button
              key={learner.learnerId}
              type="button"
              disabled={busyId !== null}
              onClick={() => select(learner)}
              className={`tactile flex items-center gap-3 rounded-3xl border-2 p-4 text-left shadow-pillow disabled:opacity-60 ${
                isActive ? "border-primary bg-primary-fixed/40" : "border-surface-high bg-white"
              }`}
            >
              <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-high text-3xl">
                {learner.companion || learner.avatar ? companionEmoji(learner) : initialFor(greetingName(learner))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-extrabold">{greetingName(learner) === "Explorer" ? "Secret Explorer" : greetingName(learner)}</span>
                <span className="block text-xs font-bold text-on-surface-variant">{learner.companion ? `${companionCallName(learner)} • ` : ""}Ages {learner.ageBand}{isActive ? " • last playing" : ""}</span>
              </span>
              <span className="tactile-button shrink-0 bg-primary px-5 py-2 text-sm text-white">
                {busyId === learner.learnerId ? "Loading…" : isActive ? "Welcome back! 👋" : "Continue →"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          try {
            speakWithCharacter("Who is playing today?", { lang: "en-US" });
          } catch {}
          onAdd();
        }}
        className="tactile flex min-h-16 items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-outline bg-white/60 text-base font-extrabold text-primary"
      >
        + Add another player
      </button>

      {error ? <p role="alert" className="rounded-2xl bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">{error}</p> : null}

      <p className="mt-auto text-center text-[11px] font-black text-on-surface-variant">Names stay on this device • Progress is saved per player</p>
    </div>
  );
}
