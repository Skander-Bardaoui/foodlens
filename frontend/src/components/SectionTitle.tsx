import type { ReactNode } from "react";

import { cn } from "../lib/cn";

type SectionTitleProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function SectionTitle({
  title,
  eyebrow,
  description,
  icon,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 font-body text-label-sm font-bold uppercase tracking-wider text-brand-deep">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          {icon ? <span className="text-brand">{icon}</span> : null}
          <h2 className="font-display text-headline-md font-bold text-ink">{title}</h2>
        </div>
        {description ? (
          <p className="mt-1 font-body text-body-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 self-start sm:self-auto">{action}</div> : null}
    </div>
  );
}
