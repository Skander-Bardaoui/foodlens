import { Trash2, TriangleAlert } from "lucide-react";

import { cn } from "../lib/cn";
import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete analysis",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = tone === "danger";
  const Icon = isDanger ? Trash2 : TriangleAlert;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-surface-inverse/50 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={cn(
          "w-full max-w-md rounded-card border border-hairline/70 bg-surface-lowest p-6 shadow-floating",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-pill",
            isDanger ? "bg-danger-soft/60 text-danger" : "bg-brand-soft/60 text-brand-deep",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h2 id="confirm-dialog-title" className="font-display text-headline-sm font-bold text-ink">
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="mt-2 font-body text-body-sm leading-relaxed text-muted"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel} className="sm:px-5">
            {cancelLabel}
          </Button>
          <Button variant={isDanger ? "danger" : "primary"} size="sm" onClick={onConfirm} className="sm:px-5">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
