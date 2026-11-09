import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

// TODO: replace with the shared Card component once it is merged.
export default function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
