import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function ParentsLearningPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <BrandLogo />
      <h1 className="mt-4 text-headline-lg">Learning, gently</h1>
      <div className="mt-3 flex flex-col gap-3 pb-8 text-sm">
        <section className="rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-black">Levels 1–5</h2>
          <p className="mt-1 text-on-surface-variant">Each game gets a little trickier per level — bigger numbers, more pieces, smaller tracing help. Levels unlock from demonstrated play, tuned per age band.</p>
        </section>
        <section className="rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-black">Concepts, not just games</h2>
          <p className="mt-1 text-on-surface-variant">Behind each game are real concepts — counting, addition within 10, part–whole thinking, tracing control. Your dashboard shows mastery per concept.</p>
        </section>
        <section className="rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-black">Smart, not pushy</h2>
          <p className="mt-1 text-on-surface-variant">The planner balances favorite games with extra practice where it helps, plus variety. Struggling never triggers a difficulty jump — support comes first.</p>
        </section>
        <Link href="/parent/login" className="rounded-full bg-primary px-4 py-3 text-center font-black text-white">See the learning view</Link>
        <Link href="/parents" className="text-center text-sm font-bold text-primary underline">Back to For parents</Link>
      </div>
    </div>
  );
}
