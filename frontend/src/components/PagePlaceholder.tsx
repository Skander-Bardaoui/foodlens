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
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
        {children ?? (
          <p className="text-sm text-slate-500">This area is reserved for the next milestone.</p>
        )}
      </div>
    </section>
  );
}
