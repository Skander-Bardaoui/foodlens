import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-container text-ink",
  brand: "bg-brand-soft text-brand-deep",
  success: "bg-accent-tint text-accent-deep",
  warning: "bg-warning-tint text-warning-deep",
  danger: "bg-danger-soft text-danger-deep",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  uppercase?: boolean;
  className?: string;
};

export default function Badge({
  children,
  tone = "neutral",
  icon,
  uppercase = false,
  className,
}: BadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-body text-label-sm font-semibold",
        uppercase && "uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}

export type ConfidenceBadgeProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ConfidenceBadge({ value, label, className }: ConfidenceBadgeProps) {
  const percent = Math.round(value * 100);
  const tone: BadgeTone = value >= 0.75 ? "success" : value >= 0.4 ? "warning" : "danger";
  const Icon = value >= 0.75 ? CheckCircle2 : value >= 0.4 ? AlertTriangle : XCircle;

  return (
    <Badge
      tone={tone}
      uppercase={false}
      className={cn("px-3 py-1.5 text-label-md font-bold", className)}
      icon={<Icon className="h-4 w-4" strokeWidth={2.4} />}
    >
      {label ?? `${percent}% match`}
    </Badge>
  );
}

export function StatusDot({ tone = "success" }: { tone?: BadgeTone }) {
  const dotClasses: Record<BadgeTone, string> = {
    neutral: "bg-outline-soft",
    brand: "bg-brand",
    success: "bg-accent",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <span className="inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      <span className={cn("h-2 w-2 rounded-full", dotClasses[tone])} />
    </span>
  );
}

export function ConfidenceDot({ value }: { value: number }) {
  return <StatusDot tone={value >= 0.75 ? "success" : value >= 0.4 ? "warning" : "danger"} />;
}
