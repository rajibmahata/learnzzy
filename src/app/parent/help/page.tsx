import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const ITEMS = [
  { q: "How do I link my child's device?", a: "Open Dashboard, tap “Create pairing code”, then on the child's device open /link and enter the 6-character code. Come back here and tap Approve. Codes expire after 15 minutes and work once." },
  { q: "What data does Learnzzy collect?", a: "Only a nickname (optional), an age band, gameplay events, stars, and stickers. No email, photos, location, or school information is collected from children." },
  { q: "How are levels decided?", a: "Levels unlock from demonstrated play — usually 3 or more completed games at 80%+ accuracy moves a learner up exactly one level. Never more than one level at a time." },
  { q: "Can I remove a linked child?", a: "Yes. Ask support in this version, or use Revoke where available — revoking immediately stops dashboard access for that learner." },
  { q: "Is there chat or social play?", a: "No. Learnzzy has no child profiles, chat, or social features." },
];

export default function ParentHelpPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 py-6">
      <BrandLogo />
      <h1 className="mt-4 text-headline-lg">Parent help</h1>
      <div className="mt-3 flex flex-col gap-3 pb-10">
        {ITEMS.map((it) => (
          <section key={it.q} className="rounded-xl bg-white p-4 shadow-card">
            <h2 className="text-sm font-black">{it.q}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{it.a}</p>
          </section>
        ))}
        <Link href="/parent" className="rounded-full bg-primary px-4 py-3 text-center font-black text-white">Back to dashboard</Link>
      </div>
    </div>
  );
}
