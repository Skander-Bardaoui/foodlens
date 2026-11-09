import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import {
  ArrowRight,
  Camera,
  Crop,
  Gauge,
  ImageUp,
  ListChecks,
  ScanSearch,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AnalyzeError, analyzeImage } from "../api/analyze";
import { getHistory } from "../api/history";
import type { Analysis } from "../api/types";
import AnalyzingView from "../components/AnalyzingView";
import Button from "../components/Button";
import Card from "../components/Card";
import StepCard from "../components/StepCard";
import { resolveAssetUrl } from "../lib/assets";
import { cn } from "../lib/cn";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MEGABYTE = 1024 * 1024;

const STATS = [
  { color: "bg-emerald-500", label: "1,400+ Cuisines Mapped" },
  { color: "bg-brand-500", label: "Sub-second Inference" },
  { color: "bg-amber-500", label: "Dietary & Allergen Alerts" },
];

function formatSize(bytes: number) {
  return `${(bytes / MEGABYTE).toFixed(1)} MB`;
}

function rejectionMessage(rejection: FileRejection) {
  const code = rejection.errors[0]?.code;

  if (code === "file-invalid-type") {
    return "Only JPG and PNG images are supported.";
  }
  if (code === "file-too-large") {
    return `That image is ${formatSize(rejection.file.size)}. Please choose one under 5 MB.`;
  }
  if (code === "too-many-files") {
    return "Please choose a single image.";
  }
  return "That file could not be added. Please choose a JPG or PNG under 5 MB.";
}

export default function UploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const uploadHelpId = useId();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const mutation = useMutation<Analysis, AnalyzeError, File>({
    mutationFn: analyzeImage,
    onSuccess: (analysis) => {
      void queryClient.invalidateQueries({ queryKey: ["history"] });
      navigate(`/result/${analysis.id}`, { state: { analysis } });
    },
  });

  const recentQuery = useQuery({
    queryKey: ["history", "recent"],
    queryFn: () => getHistory({ limit: 3 }),
    staleTime: 60_000,
  });
  const recentItems = recentQuery.data?.items ?? [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDrop: (acceptedFiles) => {
      const nextFile = acceptedFiles[0];
      if (!nextFile) {
        return;
      }
      setFile(nextFile);
      setDropError(null);
      mutation.reset();
    },
    onDropRejected: (rejections) => {
      setDropError(rejectionMessage(rejections[0]));
    },
  });

  const removeFile = () => {
    setFile(null);
    setDropError(null);
    mutation.reset();
  };

  const errorMessage = mutation.error
    ? mutation.error instanceof AnalyzeError
      ? mutation.error.message
      : "Something went wrong. Please try again."
    : null;

  return (
    <div className="space-y-14">
      <section className="relative mx-auto max-w-4xl space-y-5 pt-2 text-center">
        <div className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

        <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-800">
          <Sparkles className="h-4 w-4 text-brand-500" />
          AI Food Identification & Recipe Engine
        </span>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Snap a dish. <span className="text-brand-600">Get the recipe.</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Instantly identify ingredients, get accurate confidence scores, and
          unlock chef-tested step-by-step recipes from a single photo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
          {STATS.map((stat) => (
            <span
              key={stat.label}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              <span className={cn("h-2 w-2 rounded-full", stat.color)} />
              {stat.label}
            </span>
          ))}
        </div>
      </section>

      {mutation.isPending ? (
        <section
          aria-label="Analyzing your dish"
          className="mx-auto w-full max-w-5xl"
        >
          <AnalyzingView
            previewUrl={previewUrl}
            fileName={file?.name ?? "Your photo"}
          />
        </section>
      ) : (
        <>
          <section aria-label="Analyze a dish" className="mx-auto w-full max-w-5xl">
        <Card padding="none" className="p-3 sm:p-4">
          <div className="grid items-stretch gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="relative flex min-h-[24rem] flex-col justify-between overflow-hidden rounded-2xl bg-slate-50 p-6 sm:p-8 lg:col-span-7">
              <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl border-l-2 border-t-2 border-brand-300/60" />
              <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr border-r-2 border-t-2 border-brand-300/60" />
              <span className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl border-b-2 border-l-2 border-brand-300/60" />
              <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br border-b-2 border-r-2 border-brand-300/60" />

              <div
                {...getRootProps({
                  role: "button",
                  "aria-label": "Upload a food photo",
                  "aria-describedby": uploadHelpId,
                  "aria-invalid": dropError ? true : undefined,
                })}
                className={cn(
                  "my-auto flex cursor-pointer select-none flex-col items-center rounded-xl px-2 py-6 text-center transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                  isDragActive && "bg-brand-50/70",
                )}
              >
                <input {...getInputProps({ "aria-label": "Food photo file" })} />

                <span
                  className={cn(
                    "mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-600 shadow-sm transition-all",
                    isDragActive && "scale-110 bg-brand-500 text-white",
                  )}
                >
                  <ImageUp className="h-9 w-9" />
                </span>

                <h2 className="mb-2 text-lg font-bold tracking-tight text-slate-900">
                  {isDragActive
                    ? "Drop the photo to stage it"
                    : "Drop your food photo here or click to browse"}
                </h2>
                <p id={uploadHelpId} className="mb-6 max-w-sm text-sm text-slate-600">
                  Supports high-resolution mobile snaps, overhead shots, and
                  plated portraits.
                </p>

                <span className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-slate-200/70 px-4 py-2 text-[11px] font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    JPG, PNG
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>Max 5 MB</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-slate-100/70 p-6 lg:col-span-5">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        file ? "bg-emerald-500" : "bg-slate-300",
                      )}
                    />
                    Staged for analysis
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      file
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {file ? "Ready" : "No photo"}
                  </span>
                </div>

                {previewUrl && file ? (
                  <>
                    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-slate-200 shadow-sm">
                      <img
                        src={previewUrl}
                        alt={`Preview of ${file.name}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
                      <span className="truncate text-slate-700">{file.name}</span>
                      <span className="shrink-0">{formatSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      disabled={mutation.isPending}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </>
                ) : (
                  <div className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 px-4 text-center">
                    <ImageUp className="h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600">
                      Your photo preview will appear here
                    </p>
                    <p className="text-xs text-slate-500">
                      Add a JPG or PNG under 5 MB to start.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {dropError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    {dropError}
                  </p>
                )}
                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => file && mutation.mutate(file)}
                  disabled={!file}
                  loading={mutation.isPending}
                >
                  {mutation.isPending ? "Analyzing..." : "Analyze this dish"}
                  {!mutation.isPending && <ArrowRight className="h-4 w-4" />}
                </Button>
                <p className="text-center text-[11px] font-medium text-slate-500">
                  Instant analysis with a Food-101 vision model
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
              Culinary Intelligence Flow
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              From viewfinder to table in 3 seconds
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            FoodLens turns a single photo into a clear dish prediction and a
            practical recipe you can cook from today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StepCard
            step={1}
            title="Upload Photo"
            description="Take a picture or drop any dish image from your computer or camera roll. Lighting is handled automatically."
            icon={Camera}
            accent="brand"
            footerIcon={Crop}
            footerText="Automatic framing & crop"
          />
          <StepCard
            step={2}
            title="AI Recognizes Dish"
            description="Our vision model spots visual cues, garnishes, sauces, and core ingredients within seconds."
            icon={ScanSearch}
            accent="warning"
            footerIcon={Gauge}
            footerText="Ingredient-level confidence"
          />
          <StepCard
            step={3}
            title="Get Full Recipe"
            description="Receive ingredients and step-by-step instructions, ready to follow at the stove."
            icon={UtensilsCrossed}
            accent="accent"
            footerIcon={ListChecks}
            footerText="Step-by-step cooking"
          />
        </div>
      </section>

      <section aria-label="Recent analyses" className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Community Detections
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Recent Analyses
            </h2>
          </div>
          <Link
            to="/history"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-deep"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : recentQuery.isError ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 text-center text-sm text-slate-500">
            Recent analyses are unavailable right now.
          </div>
        ) : recentItems.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-4 text-center text-sm text-slate-500">
            Your first analysis will appear here.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {recentItems.map((analysis) => (
              <Link
                key={analysis.id}
                to={`/result/${analysis.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] bg-slate-100">
                  <img
                    src={resolveAssetUrl(analysis.image_url)}
                    alt={`${analysis.label} dish`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                    {Math.round(analysis.confidence * 100)}% match
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {analysis.label}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-slate-500">
                    {new Date(analysis.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
