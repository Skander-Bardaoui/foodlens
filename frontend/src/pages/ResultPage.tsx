import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ListChecks,
  ScanSearch,
  Sparkles,
  Trash2,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { deleteAnalysis, getAnalysis } from "../api/history";
import { ApiErrorException } from "../api/http";
import type { Analysis } from "../api/types";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import { resolveAssetUrl } from "../lib/assets";
import { cn } from "../lib/cn";

type ResultLocationState = { analysis?: Analysis } | null;

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const initialAnalysis = (location.state as ResultLocationState)?.analysis;

  const analysisQuery = useQuery<Analysis, ApiErrorException>({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis(id as string),
    enabled: Boolean(id),
    initialData:
      initialAnalysis && initialAnalysis.id === id ? initialAnalysis : undefined,
    staleTime: 60_000,
    retry: false,
  });

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation<void, ApiErrorException, void>({
    mutationFn: () => deleteAnalysis(id as string),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["analysis", id] });
      void queryClient.invalidateQueries({ queryKey: ["history"] });
      setConfirmOpen(false);
      navigate("/", { replace: true });
    },
  });

  const analysis = analysisQuery.data;
  const analysisId = analysis?.id;

  useEffect(() => {
    setCheckedIngredients(new Set());
  }, [analysisId]);

  if (!id) {
    return <NoResultSelected />;
  }

  if (analysisQuery.isLoading) {
    return <ResultSkeleton />;
  }

  if (!analysis) {
    return (
      <ResultError
        message={
          analysisQuery.error instanceof ApiErrorException
            ? analysisQuery.error.message
            : "We couldn't load this analysis. Please try again."
        }
        onRetry={() => analysisQuery.refetch()}
      />
    );
  }

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const goToUpload = () => navigate("/");

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500"
          >
            <Link to="/" className="transition-colors hover:text-brand-700">
              Analyze
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900">Result</span>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-4 py-2.5 text-sm"
              onClick={goToUpload}
            >
              <Camera className="h-4 w-4" />
              Analyze another photo
            </Button>
            <button
              type="button"
              onClick={() => {
                deleteMutation.reset();
                setConfirmOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              aria-label="Delete analysis"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {analysis.uncertain && (
          <UncertainBanner analysis={analysis} onTryAnother={goToUpload} />
        )}

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <PhotoCard analysis={analysis} />
            <PredictionCard analysis={analysis} />
          </div>

          <div className="space-y-6 lg:col-span-7">
            {analysis.uncertain ? (
              <UncertainRecipePlaceholder onTryAnother={goToUpload} />
            ) : (
              <>
                <IngredientsCard
                  analysis={analysis}
                  checked={checkedIngredients}
                  onToggle={toggleIngredient}
                />
                <StepsCard steps={analysis.steps} />
              </>
            )}
          </div>
        </div>

        {!analysis.uncertain && (
          <p className="flex items-center justify-center gap-1.5 py-4 text-center text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Recipe generated by AI. Quantities may vary.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this analysis?"
        description={`The photo and recipe for “${analysis.label}” will be removed from your history. This action can't be undone.`}
        pending={deleteMutation.isPending}
        error={
          deleteMutation.error instanceof ApiErrorException
            ? deleteMutation.error.message
            : deleteMutation.error
              ? "We couldn't delete this analysis. Please try again."
              : null
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}

function PhotoCard({ analysis }: { analysis: Analysis }) {
  const confidence = Math.round(analysis.confidence * 100);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-slate-100">
        <img
          src={resolveAssetUrl(analysis.image_url)}
          alt={`Photo of ${analysis.label}`}
          className="h-full w-full object-cover"
        />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur",
            analysis.uncertain
              ? "bg-amber-100/95 text-amber-800"
              : "bg-white/95 text-emerald-700",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              analysis.uncertain ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
          {confidence}% match
        </span>
      </div>

      <div className="space-y-1.5 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
          {analysis.uncertain ? "Best guess" : "Identified dish"}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {analysis.label}
        </h1>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          Analyzed {formatAnalyzedAt(analysis.created_at)}
        </p>
      </div>
    </Card>
  );
}

function PredictionCard({ analysis }: { analysis: Analysis }) {
  return (
    <Card padding="none" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <ScanSearch className="h-4 w-4 text-brand-500" />
          Top 3 predictions
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Food-101 model
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {analysis.top3.map((prediction, index) => {
          const percent = Math.round(prediction.score * 100);

          return (
            <li key={`${prediction.label}-${index}`}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span
                  className={cn(
                    "font-semibold",
                    index === 0 ? "text-slate-900" : "text-slate-600",
                  )}
                >
                  {prediction.label}
                </span>
                <span className="font-medium text-slate-500">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    index === 0 ? "bg-brand-500" : "bg-slate-300",
                  )}
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

type IngredientsCardProps = {
  analysis: Analysis;
  checked: Set<number>;
  onToggle: (index: number) => void;
};

function IngredientsCard({ analysis, checked, onToggle }: IngredientsCardProps) {
  return (
    <Card padding="none" className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <ListChecks className="h-5 w-5" />
          </span>
          Ingredients
        </h2>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          {checked.size} / {analysis.ingredients.length} checked
        </span>
      </div>

      <ul className="mt-4 divide-y divide-slate-100">
        {analysis.ingredients.map((ingredient, index) => {
          const isChecked = checked.has(index);

          return (
            <li key={`${ingredient}-${index}`}>
              <button
                type="button"
                onClick={() => onToggle(index)}
                aria-pressed={isChecked}
                className="group flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isChecked
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-slate-300 text-transparent group-hover:border-brand-400",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span
                  className={cn(
                    "text-sm leading-relaxed transition-colors",
                    isChecked
                      ? "text-slate-400 line-through"
                      : "text-slate-700",
                  )}
                >
                  {ingredient}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function StepsCard({ steps }: { steps: string[] }) {
  return (
    <Card padding="none" className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        Recipe steps
      </h2>

      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`} className="flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-sm shadow-brand-500/20">
              {index + 1}
            </span>
            <p className="pt-1 text-sm leading-relaxed text-slate-700">{step}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type UncertainBannerProps = {
  analysis: Analysis;
  onTryAnother: () => void;
};

function UncertainBanner({ analysis, onTryAnother }: UncertainBannerProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <CircleHelp className="h-6 w-6" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Ambiguous culinary match
            </span>
            <span className="text-[11px] font-medium text-amber-700">
              &bull; {analysis.top3.length} candidates surfaced
            </span>
          </div>
          <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
            We're not sure about this dish. Is it one of these?
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {analysis.top3.map((prediction, index) => (
          <span
            key={`${prediction.label}-${index}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-amber-100"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                index === 0 ? "bg-amber-500" : "bg-slate-300",
              )}
            />
            {prediction.label}
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {Math.round(prediction.score * 100)}%
            </span>
          </span>
        ))}

        <Button
          type="button"
          className="px-5 py-2.5 text-sm"
          onClick={onTryAnother}
        >
          <Camera className="h-4 w-4" />
          Try another photo
        </Button>
      </div>
    </div>
  );
}

function UncertainRecipePlaceholder({
  onTryAnother,
}: {
  onTryAnother: () => void;
}) {
  return (
    <Card
      padding="none"
      className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <UtensilsCrossed className="h-7 w-7" />
      </span>
      <h2 className="text-lg font-bold tracking-tight text-slate-900">
        No recipe for this photo yet
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        FoodLens only writes a recipe when it is confident about the dish. Try
        another photo with better light or a closer crop of the plate.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-1 px-5 py-2.5 text-sm"
        onClick={onTryAnother}
      >
        <Camera className="h-4 w-4" />
        Try another photo
      </Button>
    </Card>
  );
}

function NoResultSelected() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
        <Sparkles className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        No scan selected yet
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        Upload a food photo from the home page and FoodLens will show its dish
        prediction and recipe here.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600"
      >
        <Camera className="h-4 w-4" />
        Analyze a dish
      </Link>
    </section>
  );
}

function ResultSkeleton() {
  return (
    <div className="animate-pulse space-y-6" data-testid="result-loading">
      <div className="flex items-center justify-between gap-4">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="h-9 w-52 rounded-full bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-200" />
        </div>
        <div className="space-y-6 lg:col-span-7">
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function ResultError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <TriangleAlert className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        We couldn't load this result
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        {message}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="px-5 py-2.5 text-sm"
          onClick={onRetry}
        >
          Try again
        </Button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600"
        >
          <Camera className="h-4 w-4" />
          Back to analyzer
        </Link>
      </div>
    </section>
  );
}

function formatAnalyzedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
