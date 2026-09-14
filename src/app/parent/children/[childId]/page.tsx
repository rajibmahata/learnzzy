"use client";

import * as React from "react";
import { ParentShell, ParentCard, MasteryBar } from "@/components/parent/ParentShell";
import { parentGet, childLabel } from "@/lib/parentApi";

interface Detail {
  summary: {
    learnerId: string;
    nickname?: string;
    ageBand: string;
    level: number;
    totalStars: number;
    stickerCount: number;
    concepts: { conceptId: string; name: string; masteryPct: number; attempts: number }[];
    strengths: string[];
    practiceOpportunities: string[];
    recommendedNext: { gameId: string; level: number; reason: string }[];
    advisoryFocus?: string;
  };
  activity: { event: string; gameId?: string; serverTimestamp: string }[];
}

const GAME_ICONS: Record<string, string> = { addition: "🔢", subtraction: "🐦", "clean-up": "🧹", puzzle: "🧩", sketch: "✏️" };

export default function ParentChildPage({ params }: { params: { childId: string } }) {
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    parentGet<Detail>(`/api/parent/children/${params.childId}`).then(setDetail).catch((e) => setError(e.message));
  }, [params.childId]);

  if (error) {
    return (
      <ParentShell title="Learner">
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">{error}</p>
      </ParentShell>
    );
  }
  if (!detail) {
    return (
      <ParentShell title="Learner">
        <p className="text-sm text-on-surface-variant">Loading…</p>
      </ParentShell>
    );
  }
  const s = detail.summary;
  return (
    <ParentShell title={childLabel(s)}>
      <ParentCard title={`Level ${s.level} · Age ${s.ageBand} · ⭐ ${s.totalStars} · 🎖 ${s.stickerCount}`}>
        {s.advisoryFocus ? <p className="rounded-lg bg-tertiary-fixed px-3 py-2 text-sm font-bold text-on-tertiary-fixed">{s.advisoryFocus}</p> : null}
        {s.strengths.length > 0 ? <p className="mt-2 text-sm"><strong>Strengths:</strong> {s.strengths.join(" · ")}</p> : null}
        {s.practiceOpportunities.length > 0 ? <p className="mt-1 text-sm"><strong>Practice next:</strong> {s.practiceOpportunities.join(" · ")}</p> : null}
      </ParentCard>
      <ParentCard title="Concepts">
        {s.concepts.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No gameplay yet — concepts appear after your child plays.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {s.concepts.map((c) => (
              <li key={c.conceptId}>
                <div className="flex items-center justify-between text-sm"><span className="font-bold">{c.name}</span><span>{c.masteryPct}%</span></div>
                <MasteryBar pct={c.masteryPct} />
              </li>
            ))}
          </ul>
        )}
      </ParentCard>
      <ParentCard title="Recommended next">
        {s.recommendedNext.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Play more to unlock recommendations.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {s.recommendedNext.map((r) => (
              <li key={r.gameId} className="flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 text-sm">
                <span aria-hidden>{GAME_ICONS[r.gameId] ?? "🎮"}</span>
                <span className="font-bold capitalize">{r.gameId}</span>
                <span className="text-xs text-on-surface-variant">Level {r.level} · {r.reason === "need-practice" ? "Extra practice" : r.reason === "interest" ? "Loved activity" : "Variety"}</span>
              </li>
            ))}
          </ul>
        )}
      </ParentCard>
      <ParentCard title="Recent activity">
        {detail.activity.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No recent activity.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {detail.activity.slice(0, 15).map((a, i) => (
              <li key={i} className="flex justify-between gap-2 border-b border-surface-high py-1 last:border-0">
                <span>{a.event.replace(/_/g, " ")}{a.gameId ? ` · ${a.gameId}` : ""}</span>
                <span className="text-xs text-on-surface-variant">{new Date(a.serverTimestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </ParentCard>
    </ParentShell>
  );
}
