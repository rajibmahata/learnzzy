"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setLearnerId, cacheProfile } from "@/lib/learner";
import { useRouter } from "next/navigation";

const AGE_BANDS = [
  { id: "4-5", label: "4–5", emoji: "🐣" },
  { id: "6-7", label: "6–7", emoji: "🐥" },
  { id: "8-9", label: "8–9", emoji: "🦉" },
] as const;

export function LearnerSetup() {
  const router = useRouter();
  const [nickname, setNickname] = React.useState("");
  const [ageBand, setAgeBand] = React.useState<"" | "4-5" | "6-7" | "8-9">("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit() {
    if (!ageBand) {
      setError("Pick your age band to get the right level.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() || undefined, ageBand }),
      });
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
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    // Anonymous learner — no nickname, still need ageBand for leveling
    if (!ageBand) {
      setError("Pick an age band, or tap Skip to start at Level 1 anyway.");
      // Allow anonymous with default 6-7 if still none
      setAgeBand("6-7");
      return;
    }
    submit();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <div className="mt-4 flex flex-col items-center text-center">
        <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Welcome to Learnzzy</p>
        <h1 className="mt-3 text-headline-lg">What should we call you?</h1>
        <p className="text-sm text-on-surface-variant">You can use any fun name — or skip.</p>
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-card">
        <label className="block text-xs font-black uppercase tracking-wide text-on-surface-variant">Nickname (optional)</label>
        <Input placeholder="Raj" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} className="mt-2 w-full text-lg" aria-label="Nickname" />
        <p className="mt-1 text-xs text-on-surface-variant">No email, no phone — just a display name.</p>
      </div>

      <div className="mt-6">
        <h2 className="text-center text-headline-md">How old are you?</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {AGE_BANDS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAgeBand(a.id as "4-5" | "6-7" | "8-9")}
              aria-pressed={ageBand === a.id}
              className={`flex flex-col items-center rounded-xl border-2 p-4 text-center shadow-card ${ageBand === a.id ? "border-primary bg-primary-fixed" : "border-transparent bg-white"}`}
            >
              <span aria-hidden className="text-3xl">{a.emoji}</span>
              <span className="mt-1 text-headline-md font-black">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button size="xl" className="w-full" onClick={submit} disabled={busy || !ageBand}>
          {busy ? "Creating..." : "Let's Play! ▶"}
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={skip} disabled={busy}>
          Skip — Start as Guest
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-on-surface-variant">We only use nickname + age band to pick the right level. Nothing else.</p>
    </div>
  );
}
