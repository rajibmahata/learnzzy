"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { parentGet, type ParentMe } from "@/lib/parentApi";

const NAV = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/children", label: "Children" },
  { href: "/parent/activity", label: "Activity" },
  { href: "/parent/progress", label: "Progress" },
  { href: "/parent/rewards", label: "Rewards" },
  { href: "/parent/learning", label: "Learning" },
  { href: "/parent/settings", label: "Settings" },
  { href: "/parent/help", label: "Help" },
];

export function ParentShell({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = React.useState<ParentMe | null>(null);

  React.useEffect(() => {
    parentGet<ParentMe>("/api/parent/auth/me")
      .then((data) => {
        if (!data.authenticated) router.replace("/parent/login");
        else setMe(data);
      })
      .catch(() => router.replace("/parent/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/parent/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/parent/login");
  }

  if (!me) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game flex-col items-center justify-center bg-surface px-4">
        <p className="text-sm text-on-surface-variant">Checking sign-in…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col bg-surface px-4 pb-8 pt-2">
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-2 bg-surface/90 px-4 py-3 backdrop-blur-xl">
        <BrandLogo compact />
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[140px] truncate text-xs font-bold text-on-surface-variant sm:inline">{me.parent?.email}</span>
          <button onClick={logout} className="tactile min-h-11 rounded-full bg-surface-low px-3 py-1.5 text-xs font-bold shadow-[0_2px_0_#d5e3fc]">Sign out</button>
        </div>
      </header>
      <nav aria-label="Parent" className="mt-3 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-pillow">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/parent" && pathname?.startsWith(n.href));
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-black ${active ? "bg-primary text-white shadow-[0_3px_0_#004395]" : "text-on-surface-variant"}`}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <h1 className="mt-5 text-headline-lg">{title}</h1>
      <div className="mt-3 flex flex-col gap-4 pb-10">{children}</div>
    </div>
  );
}

export function ParentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="safe-panel p-5">
      <h2 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function MasteryBar({ pct }: { pct: number }) {
  return (
    <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-highest p-0.5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary-container" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}
