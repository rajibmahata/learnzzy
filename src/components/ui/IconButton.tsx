import * as React from "react";

export function IconButton({
  label,
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      {...rest}
      className={`tactile flex h-[56px] min-h-[56px] w-[56px] min-w-[56px] items-center justify-center rounded-full bg-surface-highest text-on-surface shadow-[0_4px_0_#c2c6d6] ${className}`}
    >
      {children}
    </button>
  );
}
