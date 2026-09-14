import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col items-center px-5 py-8 text-center">
      <header className="flex w-full items-center justify-between">
        <BrandLogo />
        <nav aria-label="Primary" className="hidden gap-6 text-sm font-bold text-on-surface-variant sm:flex">
          <Link href="/parents">For Parents</Link>
          <span>About</span>
        </nav>
        <Link href="/welcome">
          <Button variant="primary" size="lg">
            ▶ Play
          </Button>
        </Link>
      </header>

      <section aria-labelledby="hero" className="mt-10 flex flex-col items-center">
        <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          ✨ Play. Think. Learn.
        </p>
        <h1 id="hero" className="mt-3 text-display-hero">
          Tiny games.
          <br />
          Big learning.
        </h1>
        <p className="mt-3 max-w-md text-lg text-on-surface-variant">
          Simple educational adventures designed for curious kids. No login, no ads — just play.
        </p>
        <Link href="/welcome" className="mt-6 w-full max-w-xs">
          <Button variant="primary" size="xl" className="w-full">
            ▶ Start Playing
          </Button>
        </Link>
        <p aria-hidden className="mt-4 text-2xl">
          ✨ 🔢 🧩 🎨 🧠
        </p>
      </section>

      <section aria-label="Games preview" className="mt-10 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: "🔢", label: "Numbers" },
          { icon: "🧹", label: "Observe" },
          { icon: "🧩", label: "Logic" },
          { icon: "✏️", label: "Create" },
        ].map((g) => (
          <div
            key={g.label}
            className="rounded-lg bg-white p-4 shadow-pillow"
          >
            <p className="text-3xl" aria-hidden>
              {g.icon}
            </p>
            <p className="mt-1 text-sm font-bold">{g.label}</p>
          </div>
        ))}
      </section>

      <footer className="mt-10 flex w-full items-center justify-center gap-4 pb-6 text-sm font-bold">
        <Link href="/parents" className="text-primary underline">For parents</Link>
        <span aria-hidden className="text-on-surface-variant">·</span>
        <Link href="/parent/login" className="text-on-surface-variant underline">Parent sign in</Link>
      </footer>
    </div>
  );
}
