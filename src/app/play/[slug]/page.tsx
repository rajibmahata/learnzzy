import Link from "next/link";
import { GameShell } from "@/components/child/GameShell";
import { Button } from "@/components/ui/Button";

export default function Soon({ params }: { params: { slug?: string } }) {
  return (
    <GameShell title="Learnzzy" stars={0}>
      <div className="mt-10 flex flex-col items-center rounded-xl bg-white p-8 text-center shadow-card">
        <p aria-hidden className="text-5xl">
          🌈
        </p>
        <h2 className="mt-2 text-headline-md">A new adventure is growing!</h2>
        <p className="mt-1 text-on-surface-variant">Let&apos;s try another adventure!</p>
        <Link href="/play" className="mt-4 w-full max-w-xs">
          <Button size="xl" className="w-full">
            🏠 Home
          </Button>
        </Link>
      </div>
    </GameShell>
  );
}
