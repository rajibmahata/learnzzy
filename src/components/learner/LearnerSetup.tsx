"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setLearnerId, cacheProfile } from "@/lib/learner";
import { useRouter } from "next/navigation";

const AGE_BANDS = [
  { id: "4-5", label: "4–5", title: "Tiny Explorer", emoji: "🐣" },
  { id: "6-7", label: "6–7", title: "Curious Adventurer", emoji: "🐥" },
  { id: "8-9", label: "8–9", title: "Super Thinker", emoji: "🦉" },
] as const;

const AVATARS = [
  { name: "Bunny", emoji: "🐰" },
  { name: "Lion", emoji: "🦁" },
  { name: "Bear", emoji: "🐻" },
  { name: "Rocket", emoji: "🚀" },
  { name: "Star", emoji: "🌟" },
];

export function LearnerSetup() {
  const router = useRouter();
  const [nickname, setNickname] = React.useState("");
  const [ageBand, setAgeBand] = React.useState<"" | "4-5" | "6-7" | "8-9">("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(selectedAgeBand = ageBand) {
    if (!selectedAgeBand) {
      setError("Pick your age band to get the right level.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Bounded request: a hanging API must surface an error instead of
      // leaving the child stuck on "Preparing..." forever.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      let res: Response;
      try {
        res = await fetch("/api/learners", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nickname: nickname.trim() || undefined, ageBand: selectedAgeBand }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? "Could not create profile.");
      const learner = body.data as { learnerId: string; nickname?: string; ageBand: string; level: number };
      setLearnerId(learner.learnerId);
      cacheProfile({ learnerId: learner.learnerId, nickname: learner.nickname, ageBand: learner.ageBand as "4-5" | "6-7" | "8-9", level: learner.level });
      // Queue learner_started event (deterministic, no PII)
      try {
        const sid = localStorage.getItem("learnzzy.sessionId") || learner.learnerId;
        await fetch("/api/game-events/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: sid, events: [{ event: "learner_started", gameId: "system", metadata: { ageBand, level: learner.level } }] }),
        }).catch(() => null);
      } catch {}
      router.push("/play");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(
        message.includes("abort") || message.includes("Abort")
          ? "Could not reach Learnzzy. Check your connection and try again."
          : message
      );
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    // Anonymous learner — keep a safe default age band for deterministic leveling.
    submit(ageBand || "6-7");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col gap-4 px-4 py-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-surface-high text-5xl shadow-card">🌈<span className="absolute right-1 top-1 text-xl">⭐</span></div>
        <p className="mt-3 inline-flex rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary">🧸 Play • Think • Learn</p>
        <h1 className="mt-2 text-headline-lg">Welcome to Learnzzy!</h1>
        <p className="text-sm text-on-surface-variant">Let&apos;s get ready for your big quest.</p>
      </div>

      <section className="safe-panel p-5" aria-labelledby="nickname-title">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-black text-white">1</span>
          <div><h2 id="nickname-title" className="text-instruction">What should we call you?</h2><p className="text-xs text-on-surface-variant">Type a name or pick an explorer buddy.</p></div>
        </div>
        <Input placeholder="e.g. Captain Leo..." value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} className="mt-3 h-14 w-full rounded-full bg-surface-low pl-5 text-lg" aria-label="Nickname" />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {AVATARS.map((avatar) => (
            <button key={avatar.name} type="button" onClick={() => setNickname(avatar.name)} className={`tactile flex min-h-16 flex-col items-center justify-center rounded-2xl p-2 text-xs font-bold ${nickname === avatar.name ? "bg-surface-high text-primary" : "bg-surface-low text-on-surface"}`}>
              <span aria-hidden className="text-2xl">{avatar.emoji}</span><span>{avatar.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-on-surface-variant">Optional. You can also play as a secret explorer.</p>
      </section>

      <section className="safe-panel p-5" aria-labelledby="age-title">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-sm font-black text-on-secondary-fixed">2</span>
          <div><h2 id="age-title" className="text-instruction">How old are you?</h2><p className="text-xs text-on-surface-variant">We make the games just right for your brain.</p></div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {AGE_BANDS.map((a) => (
            <button key={a.id} type="button" onClick={() => setAgeBand(a.id)} aria-pressed={ageBand === a.id} className={`tactile relative flex min-h-28 flex-col items-center justify-center rounded-2xl p-3 text-center ${ageBand === a.id ? "bg-primary-container text-white shadow-[0_6px_0_#004395]" : "bg-surface-low text-on-surface shadow-sm"}`}>
              <span aria-hidden className="text-3xl">{a.emoji}</span><span className="mt-1 text-headline-md font-black">{a.label}</span><span className="mt-1 text-[10px] font-bold opacity-90">{a.title}</span>
              {ageBand === a.id ? <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-xs text-on-secondary-fixed">✓</span> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-surface-low p-5 shadow-pillow" aria-labelledby="link-title">
        <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-sm font-black text-white">3</span><div><h2 id="link-title" className="text-instruction">Connect with a grown-up</h2><p className="text-xs text-on-surface-variant">Save stickers and share rewards safely.</p></div><span className="ml-auto text-2xl">👨‍👩‍👧</span></div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-inner"><p className="text-xs text-on-surface-variant">Have a family code?</p><Link href="/link" className="tactile rounded-full bg-surface-high px-4 py-2 text-xs font-black text-primary">Link device</Link></div>
        <p className="mt-3 text-xs text-on-surface-variant">Grown-up not nearby? You can skip and play now.</p>
      </section>

      {error ? <p role="alert" className="rounded-2xl bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">{error}</p> : null}
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <Button aria-label="Let's Play — Start My Adventure" size="xl" className="tactile-button w-full" onClick={() => submit()} disabled={busy || !ageBand}>{busy ? "Preparing..." : "Start My Adventure! 🚀"}</Button>
        <button type="button" onClick={skip} disabled={busy} className="min-h-12 rounded-full text-sm font-black text-primary underline">Skip &amp; play right now</button>
        <p className="text-center text-xs text-tertiary">🔒 100% kid safe • Zero ads • No passwords needed</p>
      </div>
    </div>
  );
}
