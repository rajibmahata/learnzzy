import * as React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-pillow ${className}`}>{children}</div>
  );
}
