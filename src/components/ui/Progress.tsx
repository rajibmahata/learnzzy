import * as React from "react";

export function Progress({ value, max = 5, label }: { value: number; max?: number; label: string }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className="flex items-center gap-2">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-6 w-6 rounded-full ${i < value ? "bg-sunny" : "bg-surface-highest"} inline-block border-2 border-stroke`}
        />
      ))}
    </div>
  );
}
