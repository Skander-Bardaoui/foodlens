import { cn } from "../lib/cn";

export type Prediction = {
  label: string;
  value: number;
};

const barStyles = [
  { dot: "bg-accent", bar: "bg-accent", text: "text-accent" },
  { dot: "bg-brand-soft", bar: "bg-brand-soft", text: "text-brand" },
  { dot: "bg-surface-highest", bar: "bg-surface-highest", text: "text-muted" },
];

type ProgressBarsProps = {
  predictions: Prediction[];
  className?: string;
};

export default function ProgressBars({ predictions, className }: ProgressBarsProps) {
  const top = predictions.slice(0, 3);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {top.map((prediction, index) => {
        const percent = Math.max(0, Math.min(100, Math.round(prediction.value * 100)));
        const style = barStyles[Math.min(index, barStyles.length - 1)];

        return (
          <div key={prediction.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-body text-label-md">
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  index === 0 ? "font-semibold text-ink" : "font-medium text-muted",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-pill", style.dot)} />
                {prediction.label}
              </span>
              <span className={cn(index === 0 ? "font-bold" : "font-medium", style.text)}>
                {percent}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-pill bg-surface-container">
              <div
                className={cn("h-full rounded-pill transition-all duration-700", style.bar)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
