import {
  Check,
  ListChecks,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../lib/cn";
import Button from "./Button";
import Card from "./Card";

type AnalyzingViewProps = {
  previewUrl: string | null;
  fileName: string;
};

const STAGES = [
  {
    title: "Recognizing the dish",
    detail: "Vision model scanning plate composition",
    icon: ScanSearch,
  },
  {
    title: "Finding ingredients",
    detail: "Mapping visible components to a recipe",
    icon: ListChecks,
  },
  {
    title: "Writing the recipe",
    detail: "Drafting quantities and cooking steps",
    icon: UtensilsCrossed,
  },
];

const STAGE_INTERVAL_MS = 1_800;

export default function AnalyzingView({
  previewUrl,
  fileName,
}: AnalyzingViewProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card padding="none" className="p-3 sm:p-4" data-testid="analyzing-state">
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              Analyzing your dish
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              ETA ~2s
            </span>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`Analyzing ${fileName}`}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/30" />

            <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl border-l-2 border-t-2 border-white/70" />
            <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr border-r-2 border-t-2 border-white/70" />
            <span className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl border-b-2 border-l-2 border-white/70" />
            <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br border-b-2 border-r-2 border-white/70" />

            <span className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-brand-400/45 to-transparent" />

            <span className="absolute left-4 top-4 mt-9 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
              Vision AI active
            </span>

            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="truncate text-sm font-semibold text-white">
                {fileName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <ScanSearch className="h-3.5 w-3.5" />
                Scanning plate composition...
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <Button type="button" className="w-full" disabled loading>
              Analyzing...
            </Button>
            <p className="text-center text-[11px] font-medium text-slate-500">
              Hold tight, this usually takes a few seconds.
            </p>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-slate-100/70 p-6 lg:col-span-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Culinary Pipeline
                </p>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Analyzing your dish...
                </h2>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              In Progress
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Stage {stage + 1} of {STAGES.length}</span>
            <span>{Math.round(((stage + 1) / STAGES.length) * 100)}%</span>
          </div>

          <ol className="mt-2 divide-y divide-slate-200/70 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80">
            {STAGES.map((step, index) => {
              const state =
                index < stage
                  ? "done"
                  : index === stage
                    ? "active"
                    : "queued";
              const Icon = step.icon;

              return (
                <li
                  key={step.title}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors",
                    state === "active" && "bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      state === "done" && "bg-emerald-100 text-emerald-700",
                      state === "active" &&
                        "bg-brand-500 text-white shadow-sm shadow-brand-500/30",
                      state === "queued" &&
                        "bg-white text-slate-400 ring-1 ring-slate-200",
                    )}
                  >
                    {state === "done" ? (
                      <Check className="h-4 w-4" />
                    ) : state === "active" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          state === "queued"
                            ? "text-slate-500"
                            : "text-slate-900",
                        )}
                      >
                        {step.title}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-bold uppercase tracking-wider",
                          state === "done" && "text-emerald-600",
                          state === "active" && "text-brand-700",
                          state === "queued" && "text-slate-400",
                        )}
                      >
                        {state === "done"
                          ? "Complete"
                          : state === "active"
                            ? "Scanning"
                            : "Waiting"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {step.detail}
                    </p>
                    {state === "active" && (
                      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-200">
                        <span className="block h-full w-2/3 rounded-full bg-brand-500" />
                      </span>
                    )}
                  </div>

                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      state === "queued" ? "text-slate-300" : "text-brand-500",
                    )}
                  />
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold text-slate-900">
                  Recipe preview
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Synthesizing
              </span>
            </div>

            <div className="mt-4 animate-pulse space-y-2.5">
              <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
              <div className="h-2.5 w-full rounded-full bg-slate-200" />
              <div className="h-2.5 w-2/3 rounded-full bg-slate-200" />
              <div className="flex gap-2 pt-2">
                <span className="h-6 w-20 rounded-full bg-slate-200" />
                <span className="h-6 w-16 rounded-full bg-slate-200" />
                <span className="h-6 w-24 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
