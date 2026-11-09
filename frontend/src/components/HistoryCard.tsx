import { useState } from "react";
import { AlertTriangle, CalendarDays, Trash2, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Analysis } from "../api/types";
import { resolveAssetUrl } from "../lib/assets";
import Badge, { ConfidenceBadge } from "./Badge";
import Card from "./Card";
import IconButton from "./IconButton";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type HistoryCardProps = {
  analysis: Analysis;
  onDelete: (analysis: Analysis) => void;
};

export default function HistoryCard({ analysis, onDelete }: HistoryCardProps) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const openResult = () => navigate(`/result/${analysis.id}`);

  return (
    <Card
      tone="white"
      padding="none"
      role="link"
      tabIndex={0}
      aria-label={`Open analysis for ${analysis.label}`}
      onClick={openResult}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openResult();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        {imageFailed ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft via-surface-container to-accent-tint">
            <UtensilsCrossed className="h-12 w-12 text-brand/60" />
          </div>
        ) : (
          <img
            src={resolveAssetUrl(analysis.image_url)}
            alt={`${analysis.label} dish`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/5 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex rounded-pill bg-surface-lowest/95 p-0.5 shadow-sm">
          <ConfidenceBadge value={analysis.confidence} />
        </span>

        <IconButton
          label={`Delete ${analysis.label}`}
          tone="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(analysis);
          }}
          onKeyDown={(event) => event.stopPropagation()}
          className="absolute right-3 top-3 bg-surface-lowest/90 shadow-sm backdrop-blur transition-opacity hover:bg-danger-soft/90 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        />

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 font-body text-label-md text-white/95">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {dateFormatter.format(new Date(analysis.created_at))}
          </span>
          <span>
            {analysis.ingredients.length > 0
              ? `${analysis.ingredients.length} ingredients`
              : "No ingredients"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-display text-headline-sm font-bold text-ink">
            {analysis.label}
          </h3>
          {analysis.uncertain ? (
            <Badge
              tone="warning"
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              className="shrink-0"
            >
              Uncertain
            </Badge>
          ) : null}
        </div>
        <p className="font-body text-body-sm text-muted">
          {analysis.uncertain
            ? "Low confidence match — open the scan to review the suggested dish."
            : `Runner-up: ${analysis.top3[1]?.label ?? "no alternative"}`}
        </p>
      </div>
    </Card>
  );
}
