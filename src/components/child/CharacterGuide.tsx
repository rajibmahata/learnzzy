import { getCharacterDef, lineForState, ariaLabelFor, type CharacterId, type CharacterState } from "@/lib/characters";

// Purposeful cartoon guide (§7/§8): one friend per game, state follows the
// interaction (thinking → happy/encouraging → celebrating). The game
// instruction always stays authoritative above; this supplements it.
// Animations are calm CSS loops, neutralized by the global
// prefers-reduced-motion kill-switch in globals.css.
const STATE_CLASS: Record<CharacterState, string> = {
  idle: "char-idle",
  happy: "char-happy",
  thinking: "char-thinking",
  curious: "char-curious",
  encouraging: "char-encouraging",
  celebrating: "char-celebrating",
  explaining: "char-explaining",
  surprised: "char-surprised",
};

export function CharacterGuide({
  character,
  state,
  line,
  compact = false,
}: {
  character: CharacterId;
  state: CharacterState;
  /** Optional override; defaults to the short state line. */
  line?: string;
  compact?: boolean;
}) {
  const def = getCharacterDef(character);
  const isCelebrating = state === "celebrating";
  const isHappy = state === "happy" || state === "surprised";
  return (
    <div className="flex items-center gap-3" role="group" aria-label={`${def.name} is here to help`}>
      <span
        role="img"
        aria-label={ariaLabelFor(character, state)}
        className={`char ${STATE_CLASS[state]} flex shrink-0 items-center justify-center rounded-full bg-white shadow-card relative ${compact ? "h-12 w-12 text-3xl" : "h-16 w-16 text-5xl"} ${isCelebrating ? "animate-bounce" : isHappy ? "animate-pulse" : ""}`}
      >
        <span aria-hidden className={isCelebrating ? "animate-spin" : ""} style={isCelebrating ? { animationDuration: "2s" } : undefined}>
          {def.emoji}
        </span>
        {isCelebrating && <span aria-hidden className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>}
        {isHappy && <span aria-hidden className="absolute -top-0.5 -right-0.5 text-[10px] animate-bounce">💫</span>}
      </span>
      <p className={`relative rounded-2xl bg-white px-4 ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} font-bold text-on-surface shadow-card ${isCelebrating ? "ring-2 ring-secondary-fixed/50" : ""}`}>
        <span aria-hidden className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-white" />
        {line ?? lineForState(state)}
      </p>
    </div>
  );
}
