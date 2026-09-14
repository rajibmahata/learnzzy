"use client";
import { ReactNode, useEffect } from "react";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-3">{children}</div>
        <button onClick={onClose} className="mt-4 rounded-full bg-surface-high px-4 py-2 text-sm font-bold">Close</button>
      </div>
    </div>
  );
}
