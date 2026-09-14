"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { parentPost } from "@/lib/parentApi";

export default function ParentLoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await parentPost("/api/parent/auth/login", { email, password });
      } else {
        await parentPost("/api/parent/auth/register", { email, password, name: name.trim() || undefined });
      }
      router.replace("/parent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <BrandLogo />
      <div className="mt-8 rounded-xl bg-white p-5 shadow-card">
        <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">For parents</p>
        <h1 className="mt-1 text-headline-lg">{mode === "login" ? "Welcome back" : "Create parent account"}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">See your child’s progress, levels, and next learning plan. Children never sign in here.</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {mode === "register" ? (
            <label className="flex flex-col gap-1 text-sm font-bold">
              Your name (optional)
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className="rounded-lg border border-stroke px-3 py-2.5" />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-bold">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="rounded-lg border border-stroke px-3 py-2.5" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Password {mode === "register" ? "(12+ characters)" : ""}
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={mode === "register" ? 12 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} className="rounded-lg border border-stroke px-3 py-2.5" />
          </label>
          {error ? <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">{error}</p> : null}
          <Button size="xl" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-3 w-full text-center text-sm font-bold text-primary">
          {mode === "login" ? "New here? Create a parent account" : "Have an account? Sign in"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-on-surface-variant">
        <Link href="/parents" className="underline">How Learnzzy works</Link> · <Link href="/parents/faq" className="underline">FAQ</Link>
      </p>
    </div>
  );
}
