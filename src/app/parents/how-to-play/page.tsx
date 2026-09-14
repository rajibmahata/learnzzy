import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const GAMES = [
  { icon: "🔢", title: "Number Adventure", text: "Count apples and pick the total. Addition within 5, 10, then 20." },
  { icon: "🐦", title: "Fly Away", text: "Birds fly off the branch — how many are left? Subtraction without negatives." },
  { icon: "🧹", title: "Clean Up", text: "Tap the messy things and drop them in the basket. No wrong taps possible." },
  { icon: "🧩", title: "Picture Puzzle", text: "Drag pieces home (or tap piece, then tap its home). Wrong drops bounce back kindly." },
  { icon: "✏️", title: "Shadow Sketch", text: "Trace the dotted shape. Near-enough counts — perfection is never required." },
];

export default function HowToPlayPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <BrandLogo />
      <h1 className="mt-4 text-headline-lg">How to play</h1>
      <div className="mt-3 flex flex-col gap-3 pb-8">
        {GAMES.map((g) => (
          <section key={g.title} className="flex gap-3 rounded-xl bg-white p-4 shadow-card">
            <span aria-hidden className="text-3xl">{g.icon}</span>
            <div><h2 className="text-sm font-black">{g.title}</h2><p className="text-sm text-on-surface-variant">{g.text}</p></div>
          </section>
        ))}
        <Link href="/parents" className="text-center text-sm font-bold text-primary underline">Back to For parents</Link>
      </div>
    </div>
  );
}
