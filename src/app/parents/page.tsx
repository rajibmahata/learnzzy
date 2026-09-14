import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";

const CARDS = [
  { href: "/parents/how-it-works", icon: "🧭", title: "How it works", text: "Short games, real learning, zero ads." },
  { href: "/parents/how-to-play", icon: "🎮", title: "How to play", text: "Five games your child can start in seconds." },
  { href: "/parents/learning", icon: "🌱", title: "Learning", text: "Levels, concepts, and gentle progression." },
  { href: "/parents/faq", icon: "❓", title: "FAQ", text: "Privacy, safety, and accounts." },
];

export default function ParentsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <header className="flex items-center justify-between">
        <BrandLogo />
        <Link href="/parent/login"><Button variant="primary" size="lg">Parent sign in</Button></Link>
      </header>
      <h1 className="mt-6 text-headline-lg">For parents 💛</h1>
      <p className="mt-2 text-on-surface-variant">Learnzzy is a safe playground: no ads, no chat, no child accounts. You get a clear view of progress.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl bg-white p-4 shadow-card">
            <p aria-hidden className="text-3xl">{c.icon}</p>
            <p className="mt-1 text-sm font-black">{c.title}</p>
            <p className="text-xs text-on-surface-variant">{c.text}</p>
          </Link>
        ))}
      </div>
      <Link href="/parent/login" className="mt-6"><Button variant="primary" size="xl" className="w-full">Open parent dashboard</Button></Link>
    </div>
  );
}
