"use client";
import { createContext, ReactNode, useContext, useState, useCallback } from "react";

type Toast = { id: string; message: string };
const Ctx = createContext<{ push: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white shadow-lg">{t.message}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("ToastProvider missing");
  return c;
}
