const tones: Record<string, string> = {
  success: "bg-tertiary-fixed text-on-tertiary-fixed",
  warning: "bg-secondary-container text-on-secondary-fixed",
  danger: "bg-error-container text-on-error-container",
  info: "bg-primary-fixed text-on-primary-fixed",
  neutral: "bg-surface-high text-on-surface-variant",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}
    >
      <span aria-hidden>●</span> {children}
    </span>
  );
}
