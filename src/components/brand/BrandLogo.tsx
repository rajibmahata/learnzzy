import Link from "next/link";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/play" aria-label="Learnzzy home — go to Play" className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon.svg" alt="" aria-hidden width={compact ? 120 : 150} height={40} />
    </Link>
  );
}
