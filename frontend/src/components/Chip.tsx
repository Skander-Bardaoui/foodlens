import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  count?: number | string;
  icon?: ReactNode;
};

export default function Chip({
  selected = false,
  count,
  icon,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 font-body text-label-md font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
        selected
          ? "bg-brand text-white shadow-sm"
          : "bg-surface-low text-muted hover:bg-surface-container hover:text-ink",
        className,
      )}
      {...rest}
    >
      {icon ? <span className="text-[1.1em]">{icon}</span> : null}
      <span>{children}</span>
      {count !== undefined ? <span className="opacity-70">({count})</span> : null}
    </button>
  );
}
