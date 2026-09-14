"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ParentShell, ParentCard } from "@/components/parent/ParentShell";
import { parentGet, type ParentMe } from "@/lib/parentApi";

export default function ParentSettingsPage() {
  const router = useRouter();
  const [me, setMe] = React.useState<ParentMe["parent"] | null>(null);

  React.useEffect(() => {
    parentGet<ParentMe>("/api/parent/auth/me").then((d) => setMe(d.parent)).catch(() => null);
  }, []);

  async function logoutEverywhere() {
    await fetch("/api/parent/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/parent/login");
  }

  return (
    <ParentShell title="Settings">
      <ParentCard title="Account">
        <p className="text-sm"><strong>Email:</strong> {me?.email ?? "…"}</p>
        {me?.name ? <p className="mt-1 text-sm"><strong>Name:</strong> {me.name}</p> : null}
        <p className="mt-2 text-xs text-on-surface-variant">Password changes and data export are handled by support in this version. Linked learner data stays on your linked devices only.</p>
      </ParentCard>
      <ParentCard title="Session">
        <button onClick={logoutEverywhere} className="rounded-full bg-surface-high px-4 py-2 text-sm font-bold">Sign out</button>
      </ParentCard>
    </ParentShell>
  );
}
