import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const STEPS = [
  { icon: "👋", title: "1. Say hello", text: "Your child picks a nickname (or skips) and an age band: 4–5, 6–7, or 8–9." },
  { icon: "🎮", title: "2. Play short games", text: "Five 5-round games: numbers, subtraction, tidy-up, puzzles, and tracing." },
  { icon: "⭐", title: "3. Earn stars & stickers", text: "Finishing games earns stars and stickers. Nothing can be bought." },
  { icon: "📶", title: "4. Level up gently", text: "Levels unlock from real play — never more than one level at a time." },
  { icon: "🧭", title: "5. You follow along", text: "Link the device once and watch concepts, strengths, and next steps." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <BrandLogo />
      <h1 className="mt-4 text-headline-lg">How it works</h1>
      <div className="mt-3 flex flex-col gap-3 pb-8">
        {STEPS.map((s) => (
          <section key={s.title} className="flex gap-3 rounded-xl bg-white p-4 shadow-card">
            <span aria-hidden className="text-3xl">{s.icon}</span>
            <div><h2 className="text-sm font-black">{s.title}</h2><p className="text-sm text-on-surface-variant">{s.text}</p></div>
          </section>
        ))}
        <Link href="/parents" className="text-center text-sm font-bold text-primary underline">Back to For parents</Link>
      </div>
    </div>
  );
}
