"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { getCachedProfile } from "@/lib/learner";

export default function LinkPage() {
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [hasLearner, setHasLearner] = React.useState(false);

  React.useEffect(() => {
    setHasLearner(!!getCachedProfile()?.learnerId);
  }, []);

  async function submit() {
    const profile = getCachedProfile();
    if (!profile?.learnerId) {
      setStatus("error");
      setMessage("Play first or set up your name, then come back here.");
      return;
    }
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/pairing/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, learnerId: profile.learnerId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? "That code did not work.");
      setStatus("done");
      setMessage(body.data?.message ?? "Ask your parent to approve on their device.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col items-center px-4 py-8 text-center">
      <BrandLogo />
      <p className="mt-6 rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Link with parent</p>
      <h1 className="mt-2 text-headline-lg">Type the magic code ✨</h1>
      <p className="mt-1 text-sm text-on-surface-variant">Ask your parent for the code on their screen.</p>
      {!hasLearner ? (
        <p className="mt-3 rounded-lg bg-secondary-fixed px-3 py-2 text-sm font-bold">
          First <Link href="/welcome" className="underline">say hello</Link>, then link.
        </p>
      ) : null}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
        placeholder="ABC-234"
        inputMode="text"
        autoComplete="off"
        aria-label="Pairing code"
        className="mt-5 w-full max-w-xs rounded-xl border-2 border-stroke bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.2em]"
      />
      <div className="mt-4 w-full max-w-xs">
        <Button size="xl" className="w-full" onClick={submit} disabled={status === "busy" || code.replace(/-/g, "").length < 6}>
          {status === "busy" ? "Checking…" : "Link 🔗"}
        </Button>
      </div>
      {message ? (
        <p role={status === "error" ? "alert" : "status"} className={`mt-3 max-w-xs rounded-lg px-3 py-2 text-sm font-bold ${status === "error" ? "bg-error-container text-on-error-container" : "bg-tertiary-fixed text-on-tertiary-fixed"}`}>
          {message}
        </p>
      ) : null}
      <Link href="/play" className="mt-6 text-sm font-bold text-primary underline">Back to games</Link>
    </div>
  );
}
