import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/cn";

type StepAccent = "orange" | "amber" | "green";

type StepCardProps = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: StepAccent;
  footerIcon: LucideIcon;
  footerText: string;
};

const accentStyles: Record<
  StepAccent,
  { badge: string; icon: string; footer: string }
> = {
  orange: {
    badge: "bg-brand-100 text-brand-700",
    icon: "text-brand-600",
    footer: "text-brand-700",
  },
  amber: {
    badge: "bg-amber-100 text-amber-800",
    icon: "text-amber-600",
    footer: "text-amber-700",
  },
  green: {
    badge: "bg-emerald-100 text-emerald-800",
    icon: "text-emerald-600",
    footer: "text-emerald-700",
  },
};

// TODO: replace with the shared StepCard component once it is merged.
export default function StepCard({
  number,
  title,
  description,
  icon: Icon,
  accent = "orange",
  footerIcon: FooterIcon,
  footerText,
}: StepCardProps) {
  const styles = accentStyles[accent];

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              styles.badge,
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
          <span className="text-3xl font-black tracking-tight text-slate-200">
            {number}
          </span>
        </div>
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      </div>

      <p
        className={cn(
          "mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold",
          styles.footer,
        )}
      >
        <FooterIcon className="h-4 w-4" />
        {footerText}
      </p>
    </article>
  );
}
