import { Lightbulb } from "lucide-react";

import { cn } from "../lib/cn";

export type RecipeStep = {
  title: string;
  description: string;
};

type StepsListProps = {
  steps: RecipeStep[];
  tip?: string;
  className?: string;
};

export default function StepsList({ steps, tip, className }: StepsListProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {steps.map((step, index) => (
        <div key={step.title} className="group flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-brand font-display text-headline-sm font-bold text-white shadow-sm">
            {index + 1}
          </div>
          <div className="flex min-w-0 flex-col gap-1 pt-0.5">
            <h3 className="font-display text-headline-sm font-bold text-ink transition-colors group-hover:text-brand-deep">
              {step.title}
            </h3>
            <p className="font-body text-body-md leading-relaxed text-muted">{step.description}</p>
          </div>
        </div>
      ))}

      {tip ? (
        <div className="mt-2 flex items-start gap-3 rounded-control bg-brand-soft/40 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep" />
          <div>
            <p className="font-body text-label-md font-bold text-brand-deep">Culinary Master Tip</p>
            <p className="font-body text-body-sm text-brand-deep/80">{tip}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
