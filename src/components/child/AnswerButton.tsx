type State = "idle" | "correct" | "incorrect" | "disabled";

export function AnswerButton({
  value,
  state = "idle",
  onPick,
}: {
  value: number;
  state?: State;
  onPick: (v: number) => void;
}) {
  const styles: Record<State, string> = {
    idle: "bg-white text-on-surface shadow-[0_6px_0_#d5e3fc]",
    correct: "bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_6px_0_#4edea3]",
    incorrect: "bg-error-container text-on-error-container shadow-[0_6px_0_#ffb4ab]",
    disabled: "bg-surface-high text-on-surface-variant opacity-60 shadow-none",
  };
  return (
    <button
      onClick={() => onPick(value)}
      disabled={state === "disabled"}
      aria-label={`Answer ${value}`}
      className={`tactile flex min-h-touch min-w-[72px] flex-1 items-center justify-center rounded-lg px-4 py-3 text-answer ${styles[state]}`}
    >
      {value}
    </button>
  );
}
