import type { LucideIcon } from "lucide-react";

import { cn } from "../lib/cn";

type StepCardAccent = "brand" | "accent" | "warning";

const accentClasses: Record<StepCardAccent, { icon: string; number: string }> = {
  brand: { icon: "bg-brand-soft text-brand-deep", number: "text-brand-soft" },
  accent: { icon: "bg-accent-soft text-accent-deep", number: "text-accent-soft" },
  warning: { icon: "bg-warning-soft text-warning-deep", number: "text-warning-soft" },
};

type StepCardProps = {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: StepCardAccent;
  className?: string;
};

export default function StepCard({
  step,
  title,
  description,
  icon: Icon,
  accent = "brand",
  className,
}: StepCardProps) {
  const styles = accentClasses[accent];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-hairline/70 bg-surface-lowest p-6 shadow-card",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-1 -top-4 font-display text-[76px] font-extrabold leading-none tracking-tighter opacity-70",
          styles.number,
        )}
      >
        {String(step).padStart(2, "0")}
      </span>
      <div className="relative">
        <span
          className={cn("mb-5 flex h-12 w-12 items-center justify-center rounded-pill", styles.icon)}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <p className="font-body text-label-sm font-bold uppercase tracking-wider text-muted-soft">
          Step {String(step).padStart(2, "0")}
        </p>
        <h3 className="mt-1 font-display text-headline-sm font-bold text-ink">{title}</h3>
        <p className="mt-2 font-body text-body-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
