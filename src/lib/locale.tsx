"use client";

import * as React from "react";
import { speakWithCharacter } from "@/lib/audio";

// Lightweight UI locale preference — switches <html lang>, voice lang, and a
// small set of child-facing strings. Full content translation is content-pipeline
// work (DISCOVERY assessment §3); this unlocks the voice locales already built
// (en/hi/bn/ta/te) without a full i18n framework.

export type UiLocale = "en" | "hi" | "bn" | "ta" | "te";

const LOCALE_KEY = "learnzzy.locale";

const LABELS: Record<UiLocale, { name: string; native: string; speak: string }> = {
  en: { name: "English", native: "English", speak: "Language set to English" },
  hi: { name: "Hindi", native: "हिन्दी", speak: "भाषा हिन्दी हो गई" },
  bn: { name: "Bengali", native: "বাংলা", speak: "ভাষা বাংলা হয়েছে" },
  ta: { name: "Tamil", native: "தமிழ்", speak: "மொழி தமிழ் ஆனது" },
  te: { name: "Telugu", native: "తెలుగు", speak: "భాష తెలుగు అయింది" },
};

const SPEAK_LANG: Record<UiLocale, string> = {
  en: "en-US",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export function getUiLocale(): UiLocale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw && raw in LABELS) return raw as UiLocale;
  } catch {}
  return "en";
}

export function setUiLocale(locale: UiLocale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
    document.documentElement.lang = locale;
  } catch {}
}

export function speakLang(): string {
  return SPEAK_LANG[getUiLocale()] ?? "en-US";
}

/** Small locale switcher for grown-up / footer areas. */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const [locale, setLocale] = React.useState<UiLocale>("en");
  React.useEffect(() => {
    setLocale(getUiLocale());
  }, []);

  return (
    <label className={`inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant ${className}`}>
      <span className="sr-only">Language</span>
      <span aria-hidden>🌐</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => {
          const next = e.target.value as UiLocale;
          setLocale(next);
          setUiLocale(next);
          try {
            speakWithCharacter(LABELS[next].speak, {
              lang: SPEAK_LANG[next],
              rate: 0.9,
              pitch: 1.0,
            });
          } catch {}
        }}
        className="rounded-full border-2 border-surface-container bg-white px-2 py-1.5 text-xs font-extrabold text-on-surface"
      >
        {(Object.keys(LABELS) as UiLocale[]).map((id) => (
          <option key={id} value={id}>
            {LABELS[id].native}
          </option>
        ))}
      </select>
    </label>
  );
}
