export function StarCounter({ value }: { value: number }) {
  return (
    <p aria-live="polite" aria-label={`${value} stars`} className="flex items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1.5 font-black shadow-[0_3px_0_#ffb95f]">
      <span aria-hidden>⭐</span> {value}
    </p>
  );
}
