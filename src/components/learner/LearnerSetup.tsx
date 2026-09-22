"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setLearnerId, cacheProfile, upsertDeviceLearner } from "@/lib/learner";
import { adoptLegacyStore } from "@/lib/rewards";
import { speakWithCharacter } from "@/lib/audio";
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

// Quick name ideas for children who prefer tapping to typing.
const NAME_IDEAS = ["Aarvi", "Rohan", "Leo", "Mia", "Zara", "Arjun", "Diya", "Kabir"];

export function LearnerSetup({ next = "/play" }: { next?: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  // Explorer buddy is separate from the name: picking a character never
  // overwrites what the child typed.
  const [buddy, setBuddy] = React.useState("🌟");
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
          body: JSON.stringify({
            displayName: displayName.trim() || undefined,
            nickname: nickname.trim() || undefined,
            avatar: buddy,
            ageBand: selectedAgeBand,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? "Could not create profile.");
      const learner = body.data as { learnerId: string; displayName?: string; nickname?: string; avatar?: string; ageBand: string; level: number };
      persistLocal({
        learnerId: learner.learnerId,
        displayName: learner.displayName ?? (displayName.trim() || undefined),
        nickname: learner.nickname ?? (nickname.trim() || undefined),
        avatar: learner.avatar ?? buddy,
        ageBand: learner.ageBand as "4-5" | "6-7" | "8-9",
        level: learner.level,
      });
      router.push(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      // Connection refused / server not running → graceful offline fallback
      // so child can still play (deterministic local content, BR-221).
      const isNetworkError =
        message.includes("Failed to fetch") ||
        message.includes("ERR_CONNECTION_REFUSED") ||
        message.includes("NetworkError") ||
        message.includes("Load failed");
      if (isNetworkError) {
        try {
          const fallbackId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? `learner_${(crypto as { randomUUID: () => string }).randomUUID()}`
              : `learner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
          persistLocal({
            learnerId: fallbackId,
            displayName: displayName.trim() || undefined,
            nickname: nickname.trim() || undefined,
            avatar: buddy,
            ageBand: selectedAgeBand as "4-5" | "6-7" | "8-9",
            level: 1,
          });
          // also store session for offline event queue
          try {
            localStorage.setItem("learnzzy.sessionId", fallbackId);
          } catch {}
          router.push(next);
          return;
        } catch {
          // fall through to error display if fallback also fails
        }
      }
      setError(
        message.includes("abort") || message.includes("Abort")
          ? "Could not reach Learnzzy. Check your connection and try again. If the server is not running, run `npm run dev` or `docker compose up -d` and refresh."
          : isNetworkError
            ? "Could not reach Learnzzy server at localhost:3000 (ERR_CONNECTION_REFUSED). Start the server with `npm run dev` (or `run.bat dev` on Windows) or `docker compose up -d`, then try again. Offline play will start automatically."
            : message
      );
    } finally {
      setBusy(false);
    }
  }

  function persistLocal(learner: { learnerId: string; displayName?: string; nickname?: string; avatar?: string; ageBand: "4-5" | "6-7" | "8-9"; level: number }) {
    setLearnerId(learner.learnerId);
    cacheProfile({ ...learner });
    upsertDeviceLearner({ ...learner, addedAt: new Date().toISOString() });
    adoptLegacyStore(learner.learnerId);
    // Fire-and-forget: mark onboarding done, claim the one-time welcome
    // sticker, and queue the learner_started event. Never blocks play.
    void (async () => {
      try {
        const id = encodeURIComponent(learner.learnerId);
        await fetch(`/api/learners/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ onboardingCompleted: true }),
        }).catch(() => null);
        await fetch(`/api/learners/${id}/rewards/claim`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ gameId: "welcome", claimId: `welcome-${learner.learnerId}` }),
        }).catch(() => null);
        const sid = localStorage.getItem("learnzzy.sessionId") || learner.learnerId;
        await fetch("/api/game-events/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: sid, learnerId: learner.learnerId, events: [{ event: "learner_started", gameId: "system", metadata: { ageBand: learner.ageBand, level: learner.level } }] }),
        }).catch(() => null);
      } catch {}
    })();
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

      <section className="safe-panel p-5" aria-labelledby="name-title">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-black text-white">👋</span>
          <div className="min-w-0 flex-1">
            <h2 id="name-title" className="text-instruction">What is your name?</h2>
            <p className="text-xs text-on-surface-variant">Just your first name — it helps us cheer for you.</p>
          </div>
          <button
            type="button"
            aria-label="Hear the wonder guide say hello"
            onClick={() => speakWithCharacter("Hi! I am Teddy, your wonder guide. What is your name?", { lang: "en-US" })}
            className="tactile flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-lg text-primary shadow-[0_3px_0_#adc6ff]"
          >
            🔊
          </button>
        </div>
        <Input placeholder="e.g. Aarvi" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={20} className="mt-3 h-14 w-full rounded-full bg-surface-low pl-5 text-lg" aria-label="Child name" />
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Name ideas">
          {NAME_IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setDisplayName(idea)}
              aria-pressed={displayName === idea}
              className={`tactile min-h-11 rounded-full px-4 py-2 text-sm font-extrabold ${displayName === idea ? "bg-primary text-white" : "bg-surface-low text-on-surface"}`}
            >
              {idea}
            </button>
          ))}
        </div>
      </section>

      <section className="safe-panel p-5" aria-labelledby="nickname-title">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-black text-white">1</span>
          <div className="min-w-0 flex-1"><h2 id="nickname-title" className="text-instruction">What should we call you?</h2><p className="text-xs text-on-surface-variant">Type a nickname or pick an explorer buddy below.</p></div>
        </div>
        <Input placeholder="e.g. Captain Leo..." value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} className="mt-3 h-14 w-full rounded-full bg-surface-low pl-5 text-lg" aria-label="Nickname" />
        <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="Explorer buddy choices">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.name}
              type="button"
              onClick={() => setBuddy(avatar.emoji)}
              aria-pressed={buddy === avatar.emoji}
              aria-label={`Buddy ${avatar.name}`}
              className={`tactile relative flex min-h-16 flex-col items-center justify-center rounded-2xl p-2 text-xs font-bold ${buddy === avatar.emoji ? "bg-surface-high text-primary ring-4 ring-primary-fixed" : "bg-surface-low text-on-surface"}`}
            >
              <span aria-hidden className="text-2xl">{avatar.emoji}</span><span>{avatar.name}</span>
              {buddy === avatar.emoji ? <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-xs text-on-secondary-fixed">✓</span> : null}
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
        <div className="flex items-center justify-center gap-2 text-[11px] font-black text-on-surface-variant" aria-label="Safety promises">
          <span className="rounded-full bg-surface-low px-2.5 py-1">100% Ad-Free</span>
          <span className="rounded-full bg-surface-low px-2.5 py-1">Zero Ads</span>
          <span className="rounded-full bg-surface-low px-2.5 py-1">No Personal Data Needed</span>
        </div>
      </div>
    </div>
  );
}
