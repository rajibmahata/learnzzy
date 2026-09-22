"use client";

import * as React from "react";
import Link from "next/link";
import { getLearnerId } from "@/lib/learner";

interface AdventureMission {
  missionId: string;
  title: string;
  description: string;
  primarySkill: string;
  estimatedMinutes: number;
  steps: unknown[];
}

export function TodaysAdventure() {
  const [missions, setMissions] = React.useState<AdventureMission[]>([]);
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    const learnerId = getLearnerId();
    const query = learnerId ? `?learnerId=${encodeURIComponent(learnerId)}` : "";
    fetch(`/api/missions${query}`, { signal: AbortSignal.timeout(5000) })
      .then((response) => response.json())
      .then((body) => setMissions((body?.data?.missions ?? []).map((item: { mission: AdventureMission }) => item.mission)))
      .catch(() => setMissions([]));
    if (learnerId) {
      fetch(`/api/learners/${encodeURIComponent(learnerId)}/mission-progress`, { signal: AbortSignal.timeout(5000) })
        .then((response) => response.json())
        .then((body) => setCompletedIds(new Set((body?.data?.missions ?? []).filter((m: { completedAt: string | null }) => m.completedAt).map((m: { missionId: string }) => m.missionId))))
        .catch(() => setCompletedIds(new Set()));
    }
  }, []);

  if (missions.length === 0) return null;
  return (
    <section aria-labelledby="todays-adventure-title" className="mt-8 w-full max-w-5xl rounded-3xl border-2 border-secondary-fixed bg-gradient-to-br from-secondary-fixed/50 via-white to-primary-fixed/40 p-5 shadow-[0_6px_0_#ffddb8]">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-secondary">LEARNZZY LEARNING ADVENTURE</p>
          <h2 id="todays-adventure-title" className="mt-1 text-2xl font-extrabold">Today&apos;s Adventure</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Small missions, big thinking. Pick one to begin.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">{missions.length} missions · 3–10 min</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {missions.map((mission, index) => (
          <Link key={mission.missionId} href={`/missions/${encodeURIComponent(mission.missionId)}`} className="tactile flex min-h-32 flex-col justify-between rounded-2xl border-2 border-white bg-white p-4 text-left shadow-[0_4px_0_#d5e3fc]">
            <div className="flex items-start justify-between gap-2"><span className="text-2xl" aria-hidden>{["🧠", "🌈", "🔤", "🔍"][index % 4]}</span><span className="text-xs font-black text-primary">MISSION {index + 1}</span></div>
            <div><span className="block font-extrabold">{completedIds.has(mission.missionId) ? `✅ ${mission.title}` : mission.title}</span><span className="mt-1 block text-xs text-on-surface-variant">{mission.primarySkill} · {mission.estimatedMinutes} min · {mission.steps.length} steps{completedIds.has(mission.missionId) ? " · done" : ""}</span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
