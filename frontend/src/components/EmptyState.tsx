import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type EmptyStateTip = {
  title: string;
  text: string;
};

type EmptyStateProps = {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  tips?: EmptyStateTip[];
  footer?: ReactNode;
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  tips,
  footer,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-hairline/70 bg-surface-lowest shadow-card",
        className,
      )}
    >
      <div className="h-3 bg-gradient-to-r from-warning via-brand to-accent" />

      <div className="flex flex-col items-center px-6 py-10 text-center md:px-14 md:py-14">
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center md:h-40 md:w-40">
          <div className="absolute inset-0 animate-pulse rounded-pill bg-surface-container-high/60" />
          <div className="absolute inset-3 flex items-center justify-center rounded-pill bg-surface-lowest shadow-inset">
            <Icon className="h-14 w-14 text-muted-soft" strokeWidth={1.5} />
          </div>
        </div>

        {eyebrow ? (
          <span className="mb-3 rounded-pill bg-warning-soft/50 px-3 py-1 font-body text-label-sm font-bold uppercase tracking-wider text-warning-deep">
            {eyebrow}
          </span>
        ) : null}

        <h2 className="max-w-xl font-display text-headline-lg-mobile font-bold tracking-tight text-ink md:text-headline-lg">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl font-body text-body-md text-muted md:text-body-lg">
          {description}
        </p>

        {tips?.length ? (
          <div className="mt-8 w-full max-w-2xl rounded-card bg-surface-low p-5 text-left md:p-6">
            <p className="mb-3 flex items-center gap-2 font-body text-label-md font-bold uppercase tracking-wide text-ink">
              <span className="h-1.5 w-1.5 rounded-pill bg-brand" />
              Tips for culinary capture
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {tips.map((tip, index) => (
                <div key={tip.title} className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-surface-lowest font-body text-label-sm font-bold text-brand-deep shadow-sm">
                    {index + 1}
                  </span>
                  <p className="font-body text-body-sm text-muted">
                    <strong className="block text-ink">{tip.title}</strong>
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {action ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
      </div>

      {footer ? <div className="bg-surface-container px-6 py-6 md:px-8">{footer}</div> : null}
    </div>
  );
}
