"use client";

import * as React from "react";
import Link from "next/link";
import { ParentShell, ParentCard } from "@/components/parent/ParentShell";
import { parentGet, childLabel, type ChildSummary } from "@/lib/parentApi";

export default function ParentChildrenPage() {
  const [children, setChildren] = React.useState<ChildSummary[] | null>(null);

  React.useEffect(() => {
    parentGet<{ children: ChildSummary[] }>("/api/parent/children").then((d) => setChildren(d.children)).catch(() => setChildren([]));
  }, []);

  return (
    <ParentShell title="Children">
      <ParentCard title="Linked learners">
        {!children ? (
          <p className="text-sm text-on-surface-variant">Loading…</p>
        ) : children.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No linked learners. <Link href="/parent" className="font-bold text-primary underline">Link a device</Link> to get started.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {children.map((c) => (
              <li key={c.learnerId} className="rounded-lg bg-surface-low px-3 py-2">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="text-2xl">🧒</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black">{childLabel(c)}</p>
                    <p className="text-xs text-on-surface-variant">Age {c.ageBand} · Level {c.level} · ⭐ {c.totalStars} · 🎖 {c.stickerCount}</p>
                  </div>
                  <Link href={`/parent/children/${c.learnerId}`} className="rounded-full bg-primary px-3 py-1.5 text-xs font-black text-white">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ParentCard>
    </ParentShell>
  );
}
