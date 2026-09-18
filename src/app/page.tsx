import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AnimalWonderland3D } from "@/components/child/AnimalWonderland3D";
import { HomeVoiceBoard } from "@/components/child/HomeVoiceBoard";
import { SoundToggle } from "@/components/child/SoundToggle";

// Home — exact fit of Stitch screen f929a9c4a28f4ca39468668623e9c4e2
// "Learnzzy — Animal Wonderland (Child-First 3D Play Home)"
// 3D scene isolate: b93346430a0f44ef9f5f341459dd8d20 (ANIMATION_43)
// Downloaded with curl -L to .stitch/1495487808742926612/ + public/images/stitch/.
// Fit to Learnzzy: same section order/copy/visual hierarchy as Stitch, but wired
// to real routes (/welcome, /play/*, /parents, /parent/login), offline speech,
// no CDN Tailwind, logo → /play, 56px+ touch targets.

const TILES = [
  { href: "/play/addition", icon: "🔢", label: "Numbers & Counting", buddy: "🧸 Teddy Bear", box: "bg-secondary-fixed", ring: "border-secondary-fixed/60 hover:border-secondary-container", shadow: "shadow-[0_6px_0_#ffddb8]", text: "text-secondary" },
  { href: "/play/subtraction", icon: "🎈", label: "Fly Away Subtraction", buddy: "🐰 Bella Bunny", box: "bg-primary-fixed", ring: "border-primary-fixed/60 hover:border-primary", shadow: "shadow-[0_6px_0_#adc6ff]", text: "text-primary" },
  { href: "/play/clean-up", icon: "🧸", label: "Clean Up & Sort", buddy: "🐶 Pip the Puppy", box: "bg-tertiary-fixed", ring: "border-tertiary-fixed/60 hover:border-tertiary", shadow: "shadow-[0_6px_0_#6ffbbe]", text: "text-tertiary" },
  { href: "/play/puzzle", icon: "🦖", label: "Dino Jigsaw Puzzle", buddy: "🦉 Prof Hoot", box: "bg-surface-high", ring: "border-surface-high hover:border-outline", shadow: "shadow-[0_6px_0_#d5e3fc]", text: "text-outline" },
  { href: "/play/sketch", icon: "✨", label: "Starlight Tracing", buddy: "🐘 Ellie the Calf", box: "bg-error-container", ring: "border-error-container/80 hover:border-error", shadow: "shadow-[0_6px_0_#ffdad6]", text: "text-error" },
];

const GAMES = [
  {
    href: "/play/addition", img: "/images/stitch/number-orchard.jpg",
    alt: "Plush teddy bear in a sunlit apple orchard with wooden crates of red apples",
    buddy: "🧸 Teddy Bear", tag: "🍎 Addition Apples",
    title: "Number Orchard",
    desc: "Help Teddy harvest sweet red apples into woven baskets! Solve cheerful addition puzzles with satisfying wooden thuds and chime sounds.",
    age: "Ages 4–6", ageCls: "bg-secondary-fixed text-on-surface",
  },
  {
    href: "/play/subtraction", img: "/images/stitch/breeze-valley.jpg",
    alt: "Bella Bunny with floral headband in a wildflower valley with bluebirds fluttering away",
    buddy: "🐰 Bella Bunny", tag: "🐦 Fly Away Subtraction",
    title: "Breeze Valley (Fly Away)",
    desc: "Tap gentle chirping bluebirds to watch them fly into the breeze! Subtraction becomes a joyful, calming release with zero stress.",
    age: "Ages 4–7", ageCls: "bg-primary-fixed text-primary",
  },
  {
    href: "/play/clean-up", img: "/images/stitch/clean-up.jpg",
    alt: "Puppy with blue bandana putting a colorful wooden block into a woven mint basket",
    buddy: "🐶 Pip the Puppy", tag: "📦 Sort & Categorize",
    title: "Clean Up Playroom",
    desc: "Help Pip put colorful building blocks, crayons, and stuffed animals into their soft woven baskets. Tactile sorting made so fun!",
    age: "Ages 3–6", ageCls: "bg-tertiary-fixed text-tertiary",
  },
  {
    href: "/play/puzzle", img: "/images/stitch/dino-puzzle.jpg",
    alt: "Wooden toddler jigsaw puzzle of a cute baby dinosaur on a wooden table outdoors",
    buddy: "🦉 Prof Hoot", tag: "🧩 Wooden Jigsaw",
    title: "Dino Discovery Puzzle",
    desc: "Chunky 4, 6, and 9-piece wooden jigsaws with magnetic snap physics. Rotate and piece together cute smiling prehistoric creatures.",
    age: "Ages 4–8", ageCls: "bg-surface-high text-on-surface",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-surface text-on-surface">
      {/* Fixed header — Stitch f929 top bar, logo → /play, real routes */}
      <header className="fixed top-0 z-50 w-full border-b border-surface-high bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span className="hidden rounded-full bg-secondary-fixed px-2 py-0.5 text-[12px] font-extrabold uppercase tracking-wide sm:inline-block">
              Wonderland
            </span>
          </div>
          <nav aria-label="Primary" className="hidden items-center gap-1 rounded-full border border-surface-high bg-surface-low p-1.5 md:flex">
            <Link href="#games-gallery" className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_#003f8a]">
              <span aria-hidden>🎮</span> Play Games
            </Link>
            <Link href="#parent-faq" className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold hover:bg-surface-container">
              <span aria-hidden>✨</span> How It Works & Parent FAQ
            </Link>
            <Link href="/parents" className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
              <span aria-hidden>🛡️</span> For Parents & Safety
            </Link>
            <Link href="/parent/login" className="flex items-center gap-1.5 rounded-full border border-primary-fixed bg-white px-3 py-1.5 text-sm font-extrabold text-primary shadow-[0_2px_0_#adc6ff]">
              🔑 Parent Sign In / Link
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <Link href="/welcome" className="hidden items-center gap-2 rounded-full bg-secondary-container px-5 py-2.5 text-sm font-extrabold shadow-[0_4px_0_#c77c00] active:translate-y-1 active:shadow-none sm:inline-flex">
              ▶ Start
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* SECTION 1 — Enchanting 3D Animal Wonderland hero stage (Stitch f929 §1) */}
        <section id="play-zone" aria-labelledby="hero" className="relative w-full overflow-hidden bg-gradient-to-b from-surface-low via-white to-surface px-5 pb-12 pt-6">
          <div aria-hidden className="pointer-events-none absolute -top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-primary-fixed/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-20 top-1/3 h-[450px] w-[450px] rounded-full bg-secondary-fixed/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute bottom-10 left-10 h-[400px] w-[400px] rounded-full bg-tertiary-fixed/30 blur-3xl" />
          <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center">
            <div className="animate-float-slow mb-3 inline-flex items-center gap-2 rounded-full border border-secondary-fixed bg-white px-4 py-1.5 shadow-[0_4px_0_#ffddb8]">
              <span aria-hidden className="text-xl">🌈</span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-secondary">Welcome to Animal Wonderland! Come Join Us!</span>
              <span aria-hidden className="text-xl">✨</span>
            </div>
            <h1 id="hero" className="mb-2 max-w-4xl text-center text-4xl font-extrabold tracking-tight md:text-[48px] md:leading-[56px]">
              Pick a Friend & Let&apos;s{" "}
              <span className="text-primary underline decoration-secondary-container decoration-wavy decoration-4 underline-offset-8">
                Play & Discover!
              </span>
            </h1>
            <p className="mb-6 max-w-2xl text-center text-lg font-medium text-on-surface-variant">
              Gentle, sensory-friendly mini-games made for curious minds ages 3–8. Tap into the tactile 3D world below to play right now!
            </p>

            {/* 3D interactive hero stage (Three.js b933 isolate, live component) */}
            <div className="relative mx-auto mb-8 w-full max-w-5xl">
              <div className="relative block h-[520px] w-full overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 shadow-2xl">
                <AnimalWonderland3D height={520} />
                {/* Speech bubble — Teddy (top left) */}
                <div className="animate-float-slow absolute left-4 top-6 max-w-[240px] rounded-2xl border-2 border-secondary-fixed bg-white/95 p-3 shadow-[0_8px_0_#fea619] backdrop-blur-md transition-all hover:scale-105 sm:left-8 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden className="shrink-0 rounded-full bg-secondary-fixed p-1 text-3xl">🧸</span>
                    <div>
                      <p className="text-sm font-extrabold text-secondary">Teddy Bear 📣</p>
                      <p className="text-sm font-medium leading-snug">&quot;Hi friend! Come count golden apples with me!&quot;</p>
                      <Link href="/play/addition" className="mt-1 inline-block rounded-full bg-secondary-container px-3 py-1 text-xs font-extrabold">Count apples →</Link>
                    </div>
                  </div>
                </div>
                {/* Speech bubble — Pip (bottom left) */}
                <div className="absolute bottom-6 left-4 max-w-[240px] rounded-2xl border-2 border-primary-fixed bg-white/95 p-3 shadow-[0_8px_0_#2170e4] backdrop-blur-md transition-all hover:scale-105 sm:left-8 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden className="shrink-0 rounded-full bg-primary-fixed p-1 text-3xl">🐶</span>
                    <div>
                      <p className="text-sm font-extrabold text-primary">Pip the Puppy 📣</p>
                      <p className="text-sm font-medium leading-snug">&quot;Woof woof! Let&apos;s sort shiny toys together!&quot;</p>
                      <Link href="/play/clean-up" className="mt-1 inline-block rounded-full bg-primary-fixed px-3 py-1 text-xs font-extrabold text-primary">Sort toys →</Link>
                    </div>
                  </div>
                </div>
                {/* Speech bubble — Bella (top right) */}
                <div className="animate-float-slow absolute right-4 top-8 hidden max-w-[240px] rounded-2xl border-2 border-tertiary-fixed bg-white/95 p-3 shadow-[0_8px_0_#00855b] backdrop-blur-md transition-all hover:scale-105 sm:block sm:right-8 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden className="shrink-0 rounded-full bg-tertiary-fixed p-1 text-3xl">🐰</span>
                    <div>
                      <p className="text-sm font-extrabold text-tertiary">Bella Bunny 📣</p>
                      <p className="text-sm font-medium leading-snug">&quot;Hop in! Let&apos;s watch bluebirds fly in Breeze Valley!&quot;</p>
                      <Link href="/play/subtraction" className="mt-1 inline-block rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-extrabold text-tertiary">Fly away →</Link>
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-bold text-outline shadow backdrop-blur sm:right-8">
                  <span aria-hidden>🔄</span> Move cursor or touch to rotate 3D island
                </div>
              </div>
            </div>

            {/* Giant CTA */}
            <div className="mb-12 flex flex-col items-center gap-3">
              <Link href="/welcome" className="animate-pulse-glow flex items-center gap-3 rounded-full bg-secondary-container px-10 py-5 text-2xl font-extrabold tracking-tight hover:bg-secondary-fixed">
                <span aria-hidden className="text-3xl">🚀</span>
                Start Playing Now!
                <span className="hidden rounded-full bg-white px-3 py-1 text-sm font-extrabold text-on-surface shadow-inner sm:inline-block">No Login Needed</span>
                <span aria-hidden className="text-2xl">✨</span>
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-on-surface-variant">
                <span className="flex items-center gap-1 text-tertiary">✅ 100% Free & Ad-Free</span>
                <span aria-hidden>•</span>
                <span className="flex items-center gap-1">📴 Works Completely Offline</span>
                <span aria-hidden>•</span>
                <span className="flex items-center gap-1">💜 Gentle Haptic Sound</span>
              </div>
            </div>

            {/* 5 category tiles */}
            <div className="grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {TILES.map((t) => (
                <Link key={t.label} href={t.href} className={`flex flex-col items-center rounded-2xl border-2 bg-white p-4 text-center transition-transform hover:-translate-y-1 ${t.ring} ${t.shadow}`}>
                  <span aria-hidden className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${t.box}`}>{t.icon}</span>
                  <span className="text-sm font-extrabold leading-tight">{t.label}</span>
                  <span className={`text-xs font-bold ${t.text}`}>{t.buddy}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2 — 5 core mini-games playroom (Stitch f929 §2) */}
        <section id="games-gallery" aria-labelledby="games-title" className="w-full scroll-mt-24 bg-surface px-5 py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-4 py-1 text-sm font-bold">🎮 Instant Playroom Arcade</p>
                <h2 id="games-title" className="text-4xl font-extrabold">Choose Any Adventure to Play!</h2>
              </div>
              <span className="font-medium text-outline">Chunky 72px buttons • Gentle sensory physics • Zero score penalties</span>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {GAMES.map((g) => (
                <article key={g.href} className="group flex flex-col overflow-hidden rounded-2xl border-2 border-surface-high bg-white shadow-[0_8px_0_#d5e3fc] transition-all hover:-translate-y-1.5">
                  <div className="relative flex h-60 items-center justify-center overflow-hidden bg-secondary-fixed/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.img} alt={g.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 shadow backdrop-blur-md">
                      <span className="text-sm font-extrabold">{g.buddy}</span>
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-full bg-secondary-container px-3 py-1 text-sm font-extrabold shadow">{g.tag}</div>
                  </div>
                  <div className="flex flex-grow flex-col justify-between p-5">
                    <div>
                      <h3 className="mb-1 text-2xl font-bold">{g.title}</h3>
                      <p className="mb-5 font-medium text-on-surface-variant">{g.desc}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-surface-low pt-3">
                      <span className={`rounded-full px-2.5 py-1 text-sm font-extrabold ${g.ageCls}`}>{g.age}</span>
                      <Link href={g.href} aria-label={`Play ${g.title} now`} className="flex min-h-touch items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-extrabold text-white shadow-[0_4px_0_#003f8a] transition-all hover:bg-primary-container active:translate-y-1 active:shadow-none">
                        ▶ Play Now
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
              {/* Game 5 — wide feature card (Stitch exactly) */}
              <article className="group flex flex-col overflow-hidden rounded-2xl border-2 border-surface-high bg-white shadow-[0_8px_0_#d5e3fc] transition-all hover:-translate-y-1.5 md:col-span-2 lg:col-span-2">
                <div className="grid h-full grid-cols-1 md:grid-cols-2">
                  <div className="relative flex h-64 items-center justify-center overflow-hidden bg-primary-fixed md:h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/stitch/starlight-trace.jpg" alt="Ellie the baby elephant tracing sparkling starlight trails in a starry meadow" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 shadow backdrop-blur-md">
                      <span className="text-sm font-extrabold">🐘 Ellie the Star Calf</span>
                    </div>
                    <div className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-white shadow">✨ Rainbow Tracing & Phonics</div>
                  </div>
                  <div className="flex flex-col justify-between p-8">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-sm font-extrabold">Kid Favorite</span>
                        <span className="flex items-center gap-1 text-sm font-bold text-tertiary">🪄 Sparkle Paths</span>
                      </div>
                      <h3 className="mb-2 text-[22px] font-bold leading-[30px]">Starlight Trace & Shadow Sketch</h3>
                      <p className="mb-5 font-medium text-on-surface-variant">Touch and trace glowing letters, numbers, and constellations. Gentle phonics audio whispers as rainbow stardust sparkles under your fingertip.</p>
                      <div className="mb-5 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 rounded-xl bg-surface-low p-2.5"><span aria-hidden>👆</span><span className="text-sm font-extrabold">Letter Curves</span></div>
                        <div className="flex items-center gap-2 rounded-xl bg-surface-low p-2.5"><span aria-hidden>🎵</span><span className="text-sm font-extrabold">Letter Sounds</span></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-surface-low pt-3">
                      <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-sm font-extrabold text-primary">Ages 3–8</span>
                      <Link href="/play/sketch" aria-label="Trace with Ellie now" className="flex min-h-touch items-center gap-2 rounded-full bg-secondary-container px-6 py-3 font-extrabold shadow-[0_4px_0_#c77c00] transition-all hover:bg-secondary-fixed active:translate-y-1 active:shadow-none">
                        🪄 Trace with Ellie
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
              {/* 6th cell — Discovery World invite keeps grid balanced + real */}
              <Link href="/play/discover" className="tactile flex min-h-touch flex-col items-center justify-center gap-2 rounded-2xl bg-tertiary-container p-8 text-center text-white shadow-[0_8px_0_#005236]">
                <span aria-hidden className="text-5xl">🧭</span>
                <span className="text-2xl font-extrabold">Meet Ellie in Discovery World →</span>
                <span className="text-sm font-bold opacity-90">Colors, animals & daily curiosity</span>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Meet your animal companions (Stitch f929 §3) */}
        <section aria-labelledby="pals-title" className="w-full bg-surface-low px-5 py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1 text-sm font-bold">🔊 Gentle Voices & Helpers</p>
                <h2 id="pals-title" className="text-4xl font-extrabold">Meet Your Play Pals</h2>
              </div>
              <p className="max-w-sm font-medium text-outline">Tap any companion to hear their sweet voice guidance and friendly encouragement!</p>
            </div>
            <HomeVoiceBoard />
          </div>
        </section>

        {/* SECTION 4 — Parent FAQ & safety (Stitch f929 §4) */}
        <section id="parent-faq" aria-labelledby="safety-title" className="w-full scroll-mt-24 bg-surface px-5 py-12">
          <div id="child-safety" className="mx-auto flex max-w-7xl flex-col gap-8">
            <div className="flex flex-col items-center justify-between gap-8 rounded-3xl border-2 border-surface-high bg-gradient-to-br from-surface-container to-surface-high p-8 shadow-[0_8px_0_#ccdbf3] lg:flex-row lg:p-12">
              <div className="max-w-xl">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-tertiary px-4 py-1 text-sm font-bold text-white">🛡️ COPPA Certified & Ad-Free</p>
                <h2 id="safety-title" className="mb-3 text-4xl font-extrabold">Peace of Mind for Parents & Guardians</h2>
                <p className="mb-5 text-lg font-medium text-on-surface-variant">
                  Learnzzy is crafted as a quiet, safe sanctuary for early childhood exploration. No microtransactions, zero telemetry or ad tracking, and guaranteed calm visuals designed with Montessori educators.
                </p>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5"><span aria-hidden className="text-[22px] text-tertiary">📴</span><span className="font-extrabold">100% Offline PWA</span></div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5"><span aria-hidden className="text-[22px] text-tertiary">🛡️</span><span className="font-extrabold">Zero Data Collection</span></div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5"><span aria-hidden className="text-[22px] text-tertiary">⏱️</span><span className="font-extrabold">Gentle Wind-Downs</span></div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5"><span aria-hidden className="text-[22px] text-tertiary">🚫</span><span className="font-extrabold">No Ads or Paywalls</span></div>
                </div>
              </div>
              <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border-2 border-surface-high bg-white p-8 text-center shadow-[0_6px_0_#d5e3fc]">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-3xl shadow-[0_4px_0_#adc6ff]"><span aria-hidden>📖</span></div>
                <h3 className="mb-1 text-[22px] font-bold">Curious How It Works?</h3>
                <p className="mb-5 font-medium text-on-surface-variant">Read our transparent Educator Architecture, how gentle offline AI adapts to learning, and Parent FAQs.</p>
                <Link href="/parents" className="flex min-h-touch w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-extrabold text-white shadow-[0_4px_0_#003f8a] transition-all hover:bg-primary-container active:translate-y-1 active:shadow-none">
                  ✨ Open How It Works & FAQ →
                </Link>
                <Link href="/parent/login" className="mt-2 flex min-h-touch w-full items-center justify-center gap-2 rounded-full border-2 border-stroke bg-white py-3 font-extrabold transition-all hover:border-primary active:translate-y-1">
                  🔑 Parent Sign In / Link
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer — Stitch f929 footer, real routes */}
      <footer className="w-full border-t border-surface-high bg-surface-low py-8">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid grid-cols-1 gap-8 pb-8 md:grid-cols-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-xl shadow-[0_2px_0_#c77c00]"><span aria-hidden>🎪</span></div>
                <span className="text-[28px] font-bold leading-[36px] text-primary">Learnzzy</span>
              </div>
              <p className="max-w-md font-medium text-on-surface-variant">An enchanting 3D animal wonderland where young children explore foundational math, phonics, and logic with zero cognitive friction and calm sensory joy.</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wider">Quick Play</span>
              <Link href="#play-zone" className="font-medium text-on-surface-variant hover:text-primary">🎮 Play Games</Link>
              <Link href="/play/addition" className="font-medium text-on-surface-variant hover:text-primary">Number Orchard (Add)</Link>
              <Link href="/play/subtraction" className="font-medium text-on-surface-variant hover:text-primary">Fly Away Subtraction</Link>
              <Link href="/play/sketch" className="font-medium text-on-surface-variant hover:text-primary">Starlight Tracing</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wider">Guardians</span>
              <Link href="/parents" className="font-medium text-on-surface-variant hover:text-primary">✨ How It Works & Parent FAQ</Link>
              <Link href="/parents/learning" className="font-medium text-on-surface-variant hover:text-primary">Parent Journey & Dashboard</Link>
              <Link href="/parent/login" className="font-medium text-on-surface-variant hover:text-primary">Offline Learning PWA</Link>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t border-surface-high pt-4 text-sm font-bold sm:flex-row">
            <div className="flex items-center gap-3">
              <Link href="/parents" className="text-primary underline">For parents</Link>
              <span aria-hidden className="text-on-surface-variant">•</span>
              <Link href="/parent/login" className="text-on-surface-variant underline">Parent sign in</Link>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Stitch d14a9b61 + 4b8445bd (validates f929a9c4 + b93346430) • Art: public/images/stitch/ • Code: .stitch/1495487808742926612/</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
