import { getCharacterDef, type CharacterId, type CharacterState } from "@/lib/characters";

// Shared Living Wonder presentation bits, grounded in the fetched Stitch
// screens (number-orchard, breeze-valley, clean-up, living-wonder-worlds).
// Game logic, copy contracts, and character mappings are untouched — these
// components only change how guide/story/progress/feedback *look*.

export function GuideCard({
  character,
  state,
  name,
  line,
  listenLabel = "Listen",
  listenAria,
  onListen,
  art,
  tint = "from-amber-50 via-white to-orange-50",
  border = "border-amber-200",
}: {
  character: CharacterId;
  state: CharacterState;
  /** e.g. "TEDDY'S HINT", "PIP THE PUPPY". */
  name: string;
  line: string;
  listenLabel?: string;
  listenAria?: string;
  onListen: () => void;
  /** Optional fetched scene-art avatar (Stitch postcard). */
  art?: string | null;
  tint?: string;
  border?: string;
}) {
  const def = getCharacterDef(character);
  return (
    <div className={`relative w-full bg-gradient-to-r ${tint} border-2 ${border} rounded-3xl p-3 shadow-[0_6px_16px_rgba(251,191,36,0.22)] flex items-center gap-3`}>
      <div className="relative shrink-0">
        {art ? (
          <img
            src={art}
            alt=""
            aria-hidden
            loading="lazy"
            className="char char-idle h-14 w-14 rounded-2xl border-2 border-amber-400 object-cover shadow-[0_4px_0_#d97706]"
          />
        ) : (
          <span className={`char char-${state} flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-300 to-amber-100 border-2 border-amber-400 text-3xl shadow-[0_4px_0_#d97706]`} role="img" aria-label={`${def.name} guide`}>
            <span aria-hidden>{def.emoji}</span>
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[13px] font-black tracking-wide text-amber-900">{name}</span>
          <button
            type="button"
            onClick={onListen}
            aria-label={listenAria ?? `Listen to ${def.name}`}
            className="tactile flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-amber-950 shadow-[0_2px_0_#b45309]"
          >
            🔊 <span>{listenLabel}</span>
          </button>
        </div>
        <p className="mt-0.5 text-[13px] font-bold leading-snug text-amber-950">{line}</p>
      </div>
    </div>
  );
}

/** Quest stepper trail: done checks → current number → upcoming → lock. */
export function StepperTrail({ round, total }: { round: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1.5" aria-label={`Round ${round + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        if (i < round) {
          return (
            <span key={i} aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-[0_3px_0_#047857]">
              ✓
            </span>
          );
        }
        if (i === round) {
          return (
            <span key={i} aria-hidden className="flex h-10 w-10 scale-105 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 text-[15px] font-black text-white shadow-[0_4px_0_#004395] ring-2 ring-white">
              {i + 1}
            </span>
          );
        }
        if (i === total - 1) {
          return (
            <span key={i} aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-sm text-slate-400">
              🔒
            </span>
          );
        }
        return (
          <span key={i} aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white/80 text-xs font-black text-blue-400">
            {i + 1}
          </span>
        );
      })}
    </div>
  );
}

/** Ambient feedback bar: icon + status line + gentle guidance. */
export function QuestFeedbackBar({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-white/90 px-3.5 py-2.5 shadow-[0_4px_0_#fed7aa]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-lg text-amber-800 shadow-[0_2px_0_#f6ad55]">
          💡
        </span>
        <div className="flex min-w-0 flex-col text-left">
          <span className="text-[13px] font-black text-amber-950">{title}</span>
          <span className="text-[11px] font-medium text-amber-800">{hint}</span>
        </div>
      </div>
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm text-amber-950 shadow-[0_2px_0_#b45309]">
        ⭐
      </span>
    </div>
  );
}

/** Wiggling buddy hint button (Stitch "Need a Clue?"). */
export function ClueButton({ onClick, label, ariaLabel = "Show a hint" }: { onClick: () => void; label: string; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="anim-wiggle tactile flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_4px_0_#003882]"
    >
      <span aria-hidden>💡</span>
      <span>{label}</span>
    </button>
  );
}
