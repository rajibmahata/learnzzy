export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Learnzzy home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon.svg" alt="" aria-hidden width={compact ? 120 : 150} height={40} />
    </span>
  );
}
