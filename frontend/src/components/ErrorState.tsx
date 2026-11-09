import { Camera, ChefHat, Maximize, RefreshCw, Terminal, UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import Button from "./Button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  code?: string;
  details?: string[];
  retryLabel?: string;
  retryIcon?: ReactNode;
  backLabel?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
};

export default function ErrorState({
  title = "Something went wrong",
  description = "The server could not process your photo. This can happen if the image is corrupt, unsupported, or our vision model experienced high load.",
  code = "Error 500 • Processing Timeout",
  details,
  retryLabel = "Try again",
  retryIcon,
  backLabel = "Back to home",
  onRetry,
  onBack,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("relative flex w-full flex-col items-center overflow-x-clip", className)}>
      <div className="pointer-events-none absolute -top-12 -left-10 h-72 w-72 rounded-pill bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-1/3 h-64 w-64 rounded-pill bg-danger-soft/40 blur-3xl" />

      <div className="relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-card border border-hairline/70 bg-surface-lowest p-8 text-center shadow-floating sm:p-10">
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-pill bg-danger-soft/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-pill bg-surface-lowest shadow-card">
              <ChefHat className="h-9 w-9 text-brand" strokeWidth={1.8} />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-pill bg-danger font-body text-label-md font-bold text-white shadow-sm">
            !
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-pill bg-danger-soft px-3 py-1 font-body text-label-sm text-danger-deep">
          <span className="h-1.5 w-1.5 animate-ping rounded-pill bg-danger" />
          {code}
        </span>

        <h2 className="mt-4 font-display text-headline-lg-mobile font-bold tracking-tight text-ink md:text-headline-lg">
          {title}
        </h2>
        <p className="mt-3 max-w-md font-body text-body-md leading-relaxed text-muted">{description}</p>

        {details?.length ? (
          <details className="mt-6 w-full text-left">
            <summary className="flex cursor-pointer select-none items-center justify-between rounded-control bg-surface-low px-4 py-3 font-body text-label-md text-ink transition-colors hover:text-brand-deep">
              <span className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Diagnostic logs &amp; error code
              </span>
              <span aria-hidden="true" className="text-muted-soft">
                ▾
              </span>
            </summary>
            <div className="mt-2 overflow-x-auto rounded-control bg-surface-lowest p-3 font-mono text-[12px] leading-snug text-muted shadow-inset">
              {details.map((line, index) => (
                <p key={index} className={index === 0 ? "font-semibold text-danger" : undefined}>
                  {line}
                </p>
              ))}
            </div>
          </details>
        ) : null}

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            leftIcon={retryIcon ?? <RefreshCw className="h-4 w-4" />}
            onClick={onRetry}
            className="w-full sm:w-auto"
          >
            {retryLabel}
          </Button>
          <Button variant="secondary" onClick={onBack} className="w-full sm:w-auto">
            {backLabel}
          </Button>
        </div>

        <div className="mt-8 flex w-full flex-col items-center gap-2 border-t border-hairline/70 pt-6 text-center">
          <p className="max-w-sm font-body text-body-sm text-muted">
            Need help? Check our supported formats (JPG, PNG under 5MB) or reach out to{" "}
            <a className="font-semibold text-brand-deep hover:underline" href="mailto:support@foodlens.ai">
              support@foodlens.ai
            </a>
          </p>
          <div className="flex items-center justify-center gap-3 font-body text-label-sm text-muted-soft">
            <span className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" /> Good lighting
            </span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" /> Max 5MB
            </span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="h-3.5 w-3.5" /> Focus on dish
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
