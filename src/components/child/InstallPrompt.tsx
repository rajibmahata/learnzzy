"use client";

import * as React from "react";

// Guided PWA install prompt (beforeinstallprompt). Shows once per browser
// session on the child home; dismiss is remembered for 7 days.
const DISMISS_KEY = "learnzzy.installDismissedAt";
const SEEN_KEY = "learnzzy.installPromptSeen";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      try {
        const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
        const seen = localStorage.getItem(SEEN_KEY) === "1";
        // Show at most once until dismissed for a week.
        if (dismissed && Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;
        if (seen && !dismissed) return;
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      setDeferred(ev);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !visible || !deferred) return null;

  return (
    <div
      role="region"
      aria-label="Install Learnzzy"
      className="mx-auto mt-3 flex w-full max-w-xl flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-primary-fixed bg-white/95 px-4 py-3 shadow-card backdrop-blur"
    >
      <p className="text-sm font-extrabold text-on-surface">
        📲 Add Learnzzy to your home screen — works offline!
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="tactile min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_#004395]"
          onClick={async () => {
            setVisible(false);
            try {
              await deferred.prompt();
              const choice = await deferred.userChoice;
              if (choice.outcome === "dismissed") {
                try {
                  localStorage.setItem(DISMISS_KEY, String(Date.now()));
                } catch {}
              }
            } catch {}
            setDeferred(null);
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="tactile min-h-11 rounded-full bg-surface-high px-4 py-2 text-sm font-black text-on-surface-variant"
          onClick={() => {
            setVisible(false);
            try {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
            } catch {}
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
