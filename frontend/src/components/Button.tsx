import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-surface-lowest text-ink border border-hairline shadow-sm hover:border-brand hover:text-brand-deep",
  outline:
    "bg-transparent text-brand-deep border border-brand/40 hover:border-brand hover:bg-brand-tint",
  ghost: "bg-transparent text-muted-slate hover:text-brand hover:bg-brand-tint",
  danger:
    "bg-danger text-white shadow-sm hover:bg-danger-deep hover:scale-[1.02] active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-label-md gap-1.5",
  md: "px-5 py-2.5 text-label-lg gap-2",
  lg: "px-7 py-3.5 text-label-lg gap-2",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex select-none items-center justify-center rounded-pill font-body font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <LoaderCircle className="h-[1.15em] w-[1.15em] animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
