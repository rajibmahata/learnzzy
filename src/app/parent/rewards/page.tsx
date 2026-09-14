"use client";

import * as React from "react";
import { ParentShell, ParentCard } from "@/components/parent/ParentShell";
import { parentGet, childLabel, type ChildSummary } from "@/lib/parentApi";

interface ProgressData {
  level: number;
  totalStars: number;
  stickerCount: number;
}

export default function ParentRewardsPage() {
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
    <ParentShell title="Rewards">
      {!rows ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <ParentCard title="No rewards yet"><p className="text-sm text-on-surface-variant">Stars and stickers appear when games are completed. Rewards are earned by playing — never bought.</p></ParentCard>
      ) : (
        rows.map(({ child, progress }) => (
          <ParentCard key={child.learnerId} title={childLabel(child)}>
            <div className="flex gap-2">
              <span className="rounded-full bg-secondary-fixed px-3 py-1.5 text-sm font-black">⭐ {progress.totalStars} stars</span>
              <span className="rounded-full bg-tertiary-fixed px-3 py-1.5 text-sm font-black text-on-tertiary-fixed">🎖 {progress.stickerCount} stickers</span>
              <span className="rounded-full bg-primary-fixed px-3 py-1.5 text-sm font-black text-on-primary-fixed">Level {progress.level}</span>
            </div>
          </ParentCard>
        ))
      )}
    </ParentShell>
  );
}
