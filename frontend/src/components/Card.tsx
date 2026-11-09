import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export type CardTone = "white" | "low" | "container" | "brand";
export type CardPadding = "none" | "sm" | "md" | "lg";

const toneClasses: Record<CardTone, string> = {
  white: "bg-surface-lowest border border-hairline/70 shadow-card",
  low: "bg-surface-low border border-transparent",
  container: "bg-surface-container border border-transparent",
  brand: "bg-brand-soft/40 border border-brand/20",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-8",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone;
  padding?: CardPadding;
  interactive?: boolean;
};

export default function Card({
  tone = "white",
  padding = "md",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-card",
        toneClasses[tone],
        paddingClasses[padding],
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-floating",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
