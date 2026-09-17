import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LockedAdventure({ title }: { title: string }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
      <div className="w-full rounded-2xl bg-white p-8 text-center shadow-card">
        <p aria-hidden className="text-5xl">🔒</p>
        <h1 className="mt-3 text-headline-md">{title} is still growing</h1>
        <p className="mt-2 text-on-surface-variant">Finish your current adventure to unlock this level.</p>
        <Link href="/play" className="mt-5 block">
          <Button size="xl" className="w-full">Back to my journey</Button>
        </Link>
      </div>
    </div>
  );
}
