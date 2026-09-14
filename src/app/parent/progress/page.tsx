"use client";

import * as React from "react";
import { ParentShell, ParentCard, MasteryBar } from "@/components/parent/ParentShell";
import { parentGet, childLabel, type ChildSummary } from "@/lib/parentApi";

interface ProgressData {
  level: number;
  totalStars: number;
  stickerCount: number;
  perGame: { gameId: string; name: string; completions: number; bestAccuracyPct: number }[];
  concepts: { conceptId: string; name: string; masteryPct: number; attempts: number }[];
}

export default function ParentProgressPage() {
  const [rows, setRows] = React.useState<{ child: ChildSummary; progress: ProgressData }[] | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { children } = await parentGet<{ children: ChildSummary[] }>("/api/parent/children");
        const out = [];
        for (const child of children) {
          const progress = await parentGet<ProgressData>(`/api/parent/children/${child.learnerId}/progress`).catch(() => null);
          if (progress) out.push({ child, progress });
        }
        setRows(out);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <ParentShell title="Progress">
      {!rows ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <ParentCard title="No progress yet"><p className="text-sm text-on-surface-variant">Progress appears after your child completes games.</p></ParentCard>
      ) : (
        rows.map(({ child, progress }) => (
          <ParentCard key={child.learnerId} title={`${childLabel(child)} · Level ${progress.level}`}>
            {progress.perGame.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No completed games yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {progress.perGame.map((g) => (
                  <li key={g.gameId}>
                    <div className="flex items-center justify-between text-sm"><span className="font-bold">{g.name}</span><span>{g.completions} plays · {g.bestAccuracyPct}% best</span></div>
                    <MasteryBar pct={g.bestAccuracyPct} />
                  </li>
                ))}
              </ul>
            )}
          </ParentCard>
        ))
      )}
    </ParentShell>
  );
}
