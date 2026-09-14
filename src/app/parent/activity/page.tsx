"use client";

import * as React from "react";
import { ParentShell, ParentCard } from "@/components/parent/ParentShell";
import { parentGet, childLabel, type ChildSummary } from "@/lib/parentApi";

interface ActivityRow {
  event: string;
  gameId?: string;
  serverTimestamp: string;
}

export default function ParentActivityPage() {
  const [rows, setRows] = React.useState<{ child: ChildSummary; activity: ActivityRow[] }[] | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { children } = await parentGet<{ children: ChildSummary[] }>("/api/parent/children");
        const out = [];
        for (const child of children) {
          const activity = await parentGet<ActivityRow[]>(`/api/parent/children/${child.learnerId}/activity`).catch(() => []);
          out.push({ child, activity });
        }
        setRows(out);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <ParentShell title="Activity">
      {!rows ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <ParentCard title="No activity yet"><p className="text-sm text-on-surface-variant">Link a child and activity will appear here.</p></ParentCard>
      ) : (
        rows.map(({ child, activity }) => (
          <ParentCard key={child.learnerId} title={childLabel(child)}>
            {activity.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No recent activity.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {activity.slice(0, 15).map((a, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-surface-high py-1 last:border-0">
                    <span>{a.event.replace(/_/g, " ")}{a.gameId ? ` · ${a.gameId}` : ""}</span>
                    <span className="text-xs text-on-surface-variant">{new Date(a.serverTimestamp).toLocaleString()}</span>
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
