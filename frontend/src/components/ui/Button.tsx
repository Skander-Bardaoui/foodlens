import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

// TODO: replace with the shared Button component once it is merged.
export default function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-brand-500 px-6 py-3.5 text-white shadow-lg shadow-brand-500/20 hover:scale-[1.01] hover:bg-brand-600 active:scale-[0.99]",
        variant === "secondary" &&
          "border border-slate-200 bg-white px-6 py-3 text-slate-900 hover:border-brand-400 hover:text-brand-700",
        variant === "ghost" && "px-3 py-2 text-slate-600 hover:text-brand-600",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
