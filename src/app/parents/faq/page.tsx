import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const ITEMS = [
  { q: "Does my child need an account?", a: "No. Children play instantly with no login, no email, and no password. Only parents sign in — to see progress." },
  { q: "What data is collected?", a: "An optional nickname, an age band, gameplay events, stars, and stickers. Never emails, photos, locations, or school info from children." },
  { q: "Are there ads or purchases?", a: "No ads, no in-app purchases, no pay-to-progress. Rewards are earned by playing." },
  { q: "Can children chat with each other?", a: "No. There are no profiles, chat, or social features." },
  { q: "How do I connect my child's device?", a: "Sign in here, create a pairing code on your dashboard, enter it at /link on the child's device, then approve. Codes expire in 15 minutes and work once." },
  { q: "Does it work offline?", a: "Yes — games keep working offline and events sync when the connection returns." },
];

export default function ParentsFaqPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <BrandLogo />
      <h1 className="mt-4 text-headline-lg">Questions, answered</h1>
      <div className="mt-3 flex flex-col gap-3 pb-8">
        {ITEMS.map((it) => (
          <section key={it.q} className="rounded-xl bg-white p-4 shadow-card">
            <h2 className="text-sm font-black">{it.q}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{it.a}</p>
          </section>
        ))}
        <Link href="/parents" className="text-center text-sm font-bold text-primary underline">Back to For parents</Link>
      </div>
    </div>
  );
}
