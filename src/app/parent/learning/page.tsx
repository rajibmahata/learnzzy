"use client";

import * as React from "react";
import { ParentShell, ParentCard, MasteryBar } from "@/components/parent/ParentShell";
import { parentGet, childLabel, type ChildSummary } from "@/lib/parentApi";

interface Insights {
  strengths: string[];
  practiceOpportunities: string[];
  recommendedNext: { gameId: string; level: number; reason: string }[];
  advisoryFocus?: string;
  concepts: { conceptId: string; name: string; masteryPct: number; attempts: number }[];
  discovery?: {
    total: number;
    learned: number;
    mastered: number;
    needsReview: number;
    categories: { category: string; title: string; learned: number; mastered: number; needsReview: number; total: number; avgMasteryPct: number }[];
  };
}

export default function ParentLearningPage() {
  const [rows, setRows] = React.useState<{ child: ChildSummary; insights: Insights }[] | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { children } = await parentGet<{ children: ChildSummary[] }>("/api/parent/children");
        const out = [];
        for (const child of children) {
          const insights = await parentGet<Insights>(`/api/parent/children/${child.learnerId}/insights`).catch(() => null);
          if (insights) out.push({ child, insights });
        }
        setRows(out);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <ParentShell title="Learning">
      {!rows ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <ParentCard title="No learning data yet"><p className="text-sm text-on-surface-variant">Concepts, strengths, and recommendations appear after play.</p></ParentCard>
      ) : (
        rows.map(({ child, insights }) => (
          <ParentCard key={child.learnerId} title={`${childLabel(child)} · Learning journey`}>
            {insights.advisoryFocus ? <p className="rounded-lg bg-tertiary-fixed px-3 py-2 text-sm font-bold text-on-tertiary-fixed">{insights.advisoryFocus}</p> : null}
            {insights.strengths.length > 0 ? <p className="mt-2 text-sm"><strong>Strengths:</strong> {insights.strengths.join(" · ")}</p> : null}
            {insights.practiceOpportunities.length > 0 ? <p className="mt-1 text-sm"><strong>Practice next:</strong> {insights.practiceOpportunities.join(" · ")}</p> : null}
            {insights.discovery && insights.discovery.learned > 0 ? (
              <div className="mt-3 rounded-lg bg-surface-low p-3" aria-label="Discovery world">
                <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
                  Discovery World · {insights.discovery.learned} learned · {insights.discovery.mastered} mastered
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {insights.discovery.categories.slice(0, 6).map((c) => (
                    <li key={c.category} className="flex items-center justify-between gap-2">
                      <span className="font-bold">{c.title}</span>
                      <span className="text-xs text-on-surface-variant">{c.learned}/{c.total} · {c.avgMasteryPct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              {insights.concepts.slice(0, 8).map((c) => (
                <div key={c.conceptId}>
                  <div className="flex items-center justify-between text-sm"><span className="font-bold">{c.name}</span><span>{c.masteryPct}%</span></div>
                  <MasteryBar pct={c.masteryPct} />
                </div>
              ))}
            </div>
            {insights.recommendedNext.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Recommended next</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {insights.recommendedNext.map((r) => (
                    <li key={r.gameId} className="rounded-lg bg-surface-low px-3 py-1.5"><span className="font-bold capitalize">{r.gameId}</span> · Level {r.level}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </ParentCard>
        ))
      )}
    </ParentShell>
  );
}
