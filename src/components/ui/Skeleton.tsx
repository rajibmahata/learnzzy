export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-high ${className}`} aria-hidden />;
}
export function SkeletonCard() {
  return <div className="rounded-xl bg-white p-4 shadow-card"><Skeleton className="h-20" /><Skeleton className="mt-3 h-4 w-2/3" /></div>;
}
