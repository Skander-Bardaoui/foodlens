import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "../lib/cn";

export type IngredientTagTone = "neutral" | "brand" | "success";

export type Ingredient = {
  id: string;
  label: string;
  tag?: string;
  tagTone?: IngredientTagTone;
  checked?: boolean;
};

const tagClasses: Record<IngredientTagTone, string> = {
  neutral: "bg-surface-low text-muted",
  brand: "bg-brand-soft/60 text-brand-deep font-semibold",
  success: "bg-accent-tint text-accent-deep font-semibold",
};

type IngredientsListProps = {
  ingredients: Ingredient[];
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function IngredientsList({
  ingredients,
  title = "Ingredients",
  subtitle,
  className,
}: IngredientsListProps) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(ingredients.filter((item) => item.checked).map((item) => item.id)),
  );

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-headline-sm font-bold text-ink">{title}</h3>
          <p className="mt-0.5 font-body text-body-sm text-muted">
            {subtitle ?? `${ingredients.length} detected ingredients • Tap to track your pantry`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-pill bg-surface-low px-3 py-1">
          <span className="font-body text-label-sm font-bold text-brand-deep">
            {checked.size} / {ingredients.length}
          </span>
          <span className="font-body text-label-sm font-medium text-muted">in pantry</span>
        </span>
      </div>

      <div className="mt-3 flex flex-col divide-y divide-surface-container">
        {ingredients.map((ingredient) => {
          const isChecked = checked.has(ingredient.id);

          return (
            <label
              key={ingredient.id}
              className="group flex cursor-pointer select-none items-center justify-between gap-3 py-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isChecked}
                  onChange={() => toggle(ingredient.id)}
                />
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border transition-colors",
                    "border-hairline bg-surface-low text-white",
                    "peer-checked:border-accent peer-checked:bg-accent",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 transition-opacity",
                      isChecked ? "opacity-100" : "opacity-0",
                    )}
                    strokeWidth={3}
                  />
                </span>
                <span
                  className={cn(
                    "truncate font-body text-body-md transition-colors",
                    isChecked ? "text-muted line-through" : "text-ink",
                  )}
                >
                  {ingredient.label}
                </span>
              </span>
              {ingredient.tag ? (
                <span
                  className={cn(
                    "shrink-0 rounded px-2 py-0.5 font-body text-label-sm",
                    tagClasses[ingredient.tagTone ?? "neutral"],
                  )}
                >
                  {ingredient.tag}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
