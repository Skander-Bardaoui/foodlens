import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PagePlaceholderProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function PagePlaceholder({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-deep">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="font-body text-label-sm font-bold uppercase tracking-widest text-brand-deep">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-ink md:text-headline-lg">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl font-body text-body-md text-muted">{description}</p>
        </div>
      </div>

      <div className="rounded-card border-2 border-dashed border-faint bg-surface-lowest p-10 text-center">
        {children ?? (
          <p className="font-body text-body-sm text-muted">
            This area is reserved for the next milestone.
          </p>
        )}
      </div>
    </section>
  );
}
