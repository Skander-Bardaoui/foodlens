import { cn } from "../lib/cn";

type SkeletonCardProps = {
  lines?: number;
  showMedia?: boolean;
  showPills?: boolean;
  className?: string;
};

export default function SkeletonCard({
  lines = 3,
  showMedia = true,
  showPills = true,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-card border border-hairline/70 bg-surface-lowest p-6 shadow-card",
        className,
      )}
      aria-hidden="true"
    >
      {showMedia ? (
        <div className="h-40 w-full animate-pulse rounded-control bg-surface-container-high" />
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-3/5 animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-6 w-24 animate-pulse rounded-pill bg-surface-container-high" />
      </div>

      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 animate-pulse rounded-lg bg-surface-container",
            index === lines - 1 ? "w-4/5" : "w-full",
          )}
        />
      ))}

      {showPills ? (
        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-2 rounded-lg bg-surface-container-low p-2.5"
            >
              <div className="h-4 w-4 shrink-0 rounded-pill bg-surface-container-high" />
              <div className="h-3.5 w-20 rounded bg-surface-container-high" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
