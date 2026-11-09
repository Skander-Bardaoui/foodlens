import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

type IconButtonTone = "neutral" | "brand" | "danger";
type IconButtonSize = "sm" | "md";

const toneClasses: Record<IconButtonTone, string> = {
  neutral: "text-muted-slate hover:text-brand hover:bg-brand-tint",
  brand: "text-brand-deep bg-brand-soft/50 hover:bg-brand-soft",
  danger: "text-danger hover:bg-danger-soft/50",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  tone?: IconButtonTone;
  size?: IconButtonSize;
};

export default function IconButton({
  label,
  icon,
  tone = "neutral",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
