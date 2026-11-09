import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "../lib/cn";
import IconButton from "./IconButton";

export type ToastTone = "success" | "warning" | "danger" | "info";

const toneStyles: Record<ToastTone, { wrap: string; icon: string; Icon: typeof Info }> = {
  success: {
    wrap: "border-accent/30 bg-surface-lowest",
    icon: "bg-accent-tint text-accent-deep",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "border-warning/30 bg-surface-lowest",
    icon: "bg-warning-tint text-warning-deep",
    Icon: AlertTriangle,
  },
  danger: {
    wrap: "border-danger/30 bg-surface-lowest",
    icon: "bg-danger-soft text-danger",
    Icon: XCircle,
  },
  info: {
    wrap: "border-hairline bg-surface-lowest",
    icon: "bg-surface-container text-muted",
    Icon: Info,
  },
};

type ToastProps = {
  open: boolean;
  title: string;
  description?: string;
  tone?: ToastTone;
  onClose?: () => void;
  className?: string;
};

export default function Toast({
  open,
  title,
  description,
  tone = "success",
  onClose,
  className,
}: ToastProps) {
  if (!open) return null;

  const styles = toneStyles[tone];
  const Icon = styles.Icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-4 bottom-24 z-[70] flex items-start gap-3 rounded-card border p-4 shadow-floating md:inset-x-auto md:bottom-6 md:right-6 md:w-96",
        styles.wrap,
        className,
      )}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-pill", styles.icon)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-body text-label-lg font-semibold text-ink">{title}</p>
        {description ? <p className="mt-0.5 font-body text-body-sm text-muted">{description}</p> : null}
      </div>
      {onClose ? (
        <IconButton label="Dismiss notification" size="sm" icon={<X className="h-4 w-4" />} onClick={onClose} />
      ) : null}
    </div>
  );
}
