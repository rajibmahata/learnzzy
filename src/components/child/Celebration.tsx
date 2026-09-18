import Link from "next/link";
import { Button } from "../ui/Button";
import type { Sticker } from "@/lib/rewards";
import { CharacterGuide } from "./CharacterGuide";
import type { CharacterId } from "@/lib/characters";

export function Celebration({
  title = "AWESOME!",
  stars = 3,
  sticker,
  character,
  onReplay,
}: {
  title?: string;
  stars?: number;
  sticker?: Sticker | null;
  /** Optional celebrating guide (§8). Absent → unchanged rendering. */
  character?: CharacterId;
  onReplay?: () => void;
}) {
  return (
    <section aria-live="polite" aria-label="Celebration" className="mx-auto flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-6 text-center shadow-card">
      <p aria-hidden className="text-4xl">
        ✨ 🎉 ✨
      </p>
      {character ? (
        <div className="mt-2">
          <CharacterGuide character={character} state="celebrating" compact />
        </div>
      ) : null}
      <h2 className="mt-2 text-headline-md">{title}</h2>
      {sticker ? (
        <div className="mt-3 flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-secondary-fixed to-secondary-container text-5xl shadow-[0_6px_0_#ffb95f] animate-bounce">
            <span aria-hidden>{sticker.emoji}</span>
          </div>
          <p className="mt-2 rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-black uppercase tracking-wide text-on-tertiary-fixed">
            🎉 New Sticker: {sticker.name}!
          </p>
        </div>
      ) : null}
      <p className="mt-3 font-black text-sunny">⭐ +{stars} Stars!</p>
      {sticker ? <p className="text-xs text-on-surface-variant">Added to your collection</p> : null}
      <div className="mt-4 flex w-full flex-col gap-3">
        {onReplay ? (
          <Button size="xl" className="w-full" onClick={onReplay}>
            PLAY AGAIN
          </Button>
        ) : null}
        <Link href="/play" className="w-full">
          <Button variant="outline" size="lg" className="w-full">
            🏠 Home
          </Button>
        </Link>
      </div>
    </section>
  );
}
