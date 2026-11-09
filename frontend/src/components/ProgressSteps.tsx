import { Check, LoaderCircle } from "lucide-react";

import { cn } from "../lib/cn";

export type AnalysisStep = {
  title: string;
  description: string;
};

type ProgressStepsProps = {
  steps: AnalysisStep[];
  current: number;
  className?: string;
};

const statusLabel = ["Scanning", "Queued", "Waiting"];

export default function ProgressSteps({ steps, current, className }: ProgressStepsProps) {
  return (
    <div className={cn("relative flex flex-col gap-6", className)}>
      <div className="absolute bottom-7 left-5 top-7 w-0.5 bg-surface-container-high" />

      {steps.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;
        const isQueued = index > current;

        return (
          <div
            key={step.title}
            className={cn(
              "relative z-10 flex items-start gap-4 transition-opacity",
              isQueued && "opacity-50",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-pill font-body text-label-md font-bold shadow-sm",
                isDone && "bg-accent text-white",
                isActive && "bg-brand text-white",
                !isDone && !isActive && "bg-surface-container-high text-muted",
              )}
              aria-hidden="true"
            >
              {isDone ? (
                <Check className="h-5 w-5" strokeWidth={3} />
              ) : isActive ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                index + 1
              )}
            </div>

            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4
                  className={cn(
                    "font-display text-headline-sm font-bold text-ink",
                    isQueued && "font-semibold",
                  )}
                >
                  {step.title}
                </h4>
                <span
                  className={cn(
                    "rounded-pill px-2 py-0.5 font-body text-label-sm font-semibold uppercase",
                    isDone && "bg-accent-tint text-accent",
                    isActive && "animate-pulse bg-brand-soft text-brand-deep",
                    isQueued && "text-muted",
                  )}
                >
                  {isDone ? "Done" : isActive ? statusLabel[0] : index === current + 1 ? statusLabel[1] : statusLabel[2]}
                </span>
              </div>
              <p className="mt-1 font-body text-body-sm text-muted">{step.description}</p>

              {isActive ? (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-surface-container">
                  <div className="h-1.5 w-[72%] animate-progress-pulse rounded-pill bg-brand" />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
