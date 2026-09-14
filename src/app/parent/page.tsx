"use client";

import * as React from "react";
import Link from "next/link";
import { ParentShell, ParentCard } from "@/components/parent/ParentShell";
import { parentGet, parentPost, childLabel, type ChildSummary } from "@/lib/parentApi";

interface ChildrenData {
  children: ChildSummary[];
  pending: string[];
}

export default function ParentDashboardPage() {
  const [data, setData] = React.useState<ChildrenData | null>(null);
  const [code, setCode] = React.useState<{ code: string; expiresAt: string } | null>(null);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(() => {
    parentGet<ChildrenData>("/api/parent/children").then(setData).catch((e) => setMessage(e.message));
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  async function createCode() {
    setBusy(true);
    setMessage("");
    try {
      const c = await parentPost<{ code: string; expiresAt: string }>("/api/parent/pairing", {});
      setCode(c);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not create code.");
    } finally {
      setBusy(false);
    }
  }

  async function approve(learnerId: string) {
    setMessage("");
    try {
      await parentPost("/api/parent/pairing", { action: "approve", learnerId });
      setMessage("Link approved.");
      refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Approval failed.");
    }
  }

  return (
    <ParentShell title="Dashboard">
      {message ? <p role="status" className="rounded-lg bg-surface-high px-3 py-2 text-sm font-bold">{message}</p> : null}
      <ParentCard title="Your children">
        {!data ? (
          <p className="text-sm text-on-surface-variant">Loading…</p>
        ) : data.children.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No linked learners yet. Create a pairing code below, enter it on the child device, then approve.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.children.map((c) => (
              <li key={c.learnerId} className="flex items-center gap-3 rounded-lg bg-surface-low px-3 py-2">
                <span aria-hidden className="text-2xl">🧒</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{childLabel(c)} · Level {c.level}</p>
                  <p className="text-xs text-on-surface-variant">⭐ {c.totalStars} · 🎖 {c.stickerCount} stickers</p>
                </div>
                <Link href={`/parent/children/${c.learnerId}`} className="rounded-full bg-primary px-3 py-1.5 text-xs font-black text-white">View</Link>
              </li>
            ))}
          </ul>
        )}
        {data && data.pending.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Waiting for approval</p>
            {data.pending.map((id) => (
              <div key={id} className="mt-1 flex items-center gap-2 rounded-lg bg-secondary-fixed px-3 py-2">
                <span className="flex-1 truncate text-xs font-bold">Learner …{id.slice(-4)}</span>
                <button onClick={() => approve(id)} className="rounded-full bg-primary px-3 py-1 text-xs font-black text-white">Approve</button>
              </div>
            ))}
          </div>
        ) : null}
      </ParentCard>
      <ParentCard title="Link a child device">
        <p className="text-sm text-on-surface-variant">Create a one-time code (expires in 15 minutes). On the child device open <strong>/link</strong> and enter it, then approve above.</p>
        <button onClick={createCode} disabled={busy} className="mt-2 rounded-full bg-tertiary-container px-4 py-2 text-sm font-black text-on-tertiary-fixed">
          {busy ? "Creating…" : "Create pairing code"}
        </button>
        {code ? (
          <p className="mt-2 rounded-lg bg-surface-low p-3 text-center text-2xl font-black tracking-widest" aria-live="polite">{code.code}</p>
        ) : null}
      </ParentCard>
    </ParentShell>
  );
}
