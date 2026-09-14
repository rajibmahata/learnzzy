"use client";
import { ReactNode, useState } from "react";

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div role="tablist" className="flex gap-2 border-b border-outline">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => setActive(t.id)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${active === t.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`}>{t.label}</button>
        ))}
      </div>
      <div className="pt-4">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
