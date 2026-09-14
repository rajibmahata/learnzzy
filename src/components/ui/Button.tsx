import * as React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "success";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-[0_6px_0_#004395]",
  secondary: "bg-secondary-container text-on-secondary-fixed shadow-[0_6px_0_#ffb95f]",
  outline: "bg-white text-on-surface border-[3px] border-stroke",
  ghost: "bg-transparent text-primary",
  success: "bg-tertiary-container text-white shadow-[0_6px_0_#005236]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-[44px] px-4 py-2 text-sm",
  md: "min-h-[48px] px-5 py-2.5 text-base",
  lg: "min-h-touch px-6 py-3 text-lg",
  xl: "min-h-touch-lg px-8 py-4 text-answer",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "lg", className = "", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`tactile inline-flex items-center justify-center gap-2 rounded-full font-extrabold focus-visible:outline ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:shadow-none ${className}`}
    />
  );
}
