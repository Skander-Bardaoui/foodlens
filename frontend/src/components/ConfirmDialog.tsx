import { Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { cn } from "../lib/cn";
import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  pending?: boolean;
  error?: string | null;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete analysis",
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
  error = null,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);

  onCancelRef.current = onCancel;
  pendingRef.current = pending;

  const generatedId = useId();
  const titleId = `confirm-dialog-title-${generatedId}`;
  const descriptionId = `confirm-dialog-description-${generatedId}`;

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const initialFocus = getFocusableElements(dialog)[0] ?? dialog;
    initialFocus.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!pendingRef.current) {
          event.preventDefault();
          onCancelRef.current?.();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const isDanger = tone === "danger";
  const Icon = isDanger ? Trash2 : TriangleAlert;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-surface-inverse/50 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={pending}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          "w-full max-w-md rounded-card border border-hairline/70 bg-surface-lowest p-6 shadow-floating focus:outline-none",
          className,
        )}
      >
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-pill",
            isDanger ? "bg-danger-soft/60 text-danger" : "bg-brand-soft/60 text-brand-deep",
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="font-display text-headline-sm font-bold text-ink">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-2 font-body text-body-sm leading-relaxed text-muted"
        >
          {description}
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-control border border-danger/30 bg-danger-soft/40 px-3 py-2 font-body text-body-sm text-danger-deep"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={pending}
            className="sm:px-5"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={pending}
            loading={pending}
            className="sm:px-5"
          >
            {pending ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
