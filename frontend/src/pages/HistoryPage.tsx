import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ChevronDown,
  History,
  LoaderCircle,
  Plus,
  ScanLine,
  Search,
  SearchX,
  X,
} from "lucide-react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getHistory, deleteAnalysis } from "../api/history";
import { ApiErrorException } from "../api/http";
import type { Analysis, AnalysisList, HistorySort } from "../api/types";
import Badge from "../components/Badge";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import HistoryCard from "../components/HistoryCard";
import SkeletonCard from "../components/SkeletonCard";
import { showToast } from "../lib/toast";

const PAGE_SIZE = 6;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

type DeleteContext = {
  snapshots: Array<[QueryKey, InfiniteData<AnalysisList> | undefined]>;
  label: string;
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<HistorySort>("newest");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Analysis | null>(null);
  const searchTerm = useDebouncedValue(search, 250).trim().toLowerCase();

  const {
    data,
    error,
    isError,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["history", sort],
    queryFn: ({ pageParam }) => getHistory({ limit: PAGE_SIZE, offset: pageParam, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const total = data?.pages.at(-1)?.total ?? 0;

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) => item.label.toLowerCase().includes(searchTerm));
  }, [items, searchTerm]);

  // Search is client-side, so page through the remaining results while a query is active.
  useEffect(() => {
    if (searchTerm && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [searchTerm, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteMutation = useMutation<void, Error, string, DeleteContext>({
    mutationFn: deleteAnalysis,
    onMutate: async (id) => {
      const label = items.find((item) => item.id === id)?.label ?? "Analysis";
      await queryClient.cancelQueries({ queryKey: ["history"] });

      const snapshots = queryClient.getQueriesData<InfiniteData<AnalysisList>>({
        queryKey: ["history"],
      });

      queryClient.setQueriesData<InfiniteData<AnalysisList>>({ queryKey: ["history"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== id),
            total: Math.max(0, page.total - 1),
          })),
        };
      });

      return { snapshots, label };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, snapshot]) => queryClient.setQueryData(key, snapshot));
    },
    onSuccess: (_data, _id, context) => {
      showToast({
        title: "Analysis deleted",
        description: `“${context?.label ?? "Analysis"}” was removed from your history.`,
        tone: "success",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-label-sm font-bold uppercase tracking-wider text-brand-deep">
            Archived scans &amp; predictions
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-display-hero-mobile font-bold tracking-tight text-ink md:text-display-hero">
              Your analyses
            </h1>
            {data && total > 0 ? <Badge tone="brand">{total} saved</Badge> : null}
          </div>
          <p className="mt-2 max-w-xl font-body text-body-md text-muted">
            Revisit every meal FoodLens has identified. Search by dish name, sort the list, and
            open any scan to see its recipe.
          </p>
        </div>

        <Button
          variant="secondary"
          leftIcon={<ScanLine className="h-4 w-4" />}
          onClick={() => navigate("/")}
          className="self-start sm:self-auto"
        >
          New scan
        </Button>
      </div>

      <div className="mt-6 rounded-card border border-hairline/70 bg-surface-lowest p-3 shadow-card md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by dish name (e.g. ramen, tacos)"
              aria-label="Search analyses by dish name"
              className="w-full rounded-control border border-hairline bg-surface-low py-2.5 pl-10 pr-10 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-pill text-muted-soft transition-colors hover:bg-surface-container hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3 md:w-auto">
            <span className="hidden font-body text-label-sm font-bold uppercase tracking-wider text-muted-soft sm:block">
              Sort by
            </span>
            <div className="relative w-full md:w-auto">
              <ArrowDownWideNarrow className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as HistorySort)}
                aria-label="Sort analyses"
                className="w-full appearance-none rounded-control border border-hairline bg-surface-low py-2.5 pl-9 pr-9 font-body text-label-lg text-ink focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20 md:w-auto"
              >
                <option value="newest">Newest first</option>
                <option value="confidence">Highest confidence</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            </div>
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <SkeletonCard key={index} lines={2} showPills={false} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          className="mt-6"
          title="Couldn't load your history"
          description="Your saved analyses are safe. Check that the API is running, then try again."
          code={error instanceof ApiErrorException ? `Error ${error.code}` : "Network error"}
          details={[error instanceof Error ? error.message : "Unknown error"]}
          onRetry={() => void refetch()}
          onBack={() => navigate("/")}
        />
      ) : total === 0 ? (
        <EmptyState
          className="mt-6"
          icon={History}
          eyebrow="History"
          title="No analyses yet"
          description="Scan your first dish and it will show up here with its confidence, ingredients and cooking steps."
          action={
            <Button leftIcon={<ScanLine className="h-4 w-4" />} onClick={() => navigate("/")}>
              Analyze a dish
            </Button>
          }
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={SearchX}
          eyebrow="No matches"
          title={`No results for “${search.trim()}”`}
          description="We couldn't find a saved analysis with that dish name. Try a shorter search or clear the filter."
          action={
            <Button
              variant="secondary"
              leftIcon={<X className="h-4 w-4" />}
              onClick={() => setSearch("")}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((analysis) => (
              <HistoryCard
                key={analysis.id}
                analysis={analysis}
                onDelete={(item) => setPendingDelete(item)}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            {hasNextPage && !searchTerm ? (
              <Button
                variant="secondary"
                loading={isFetchingNextPage}
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => void fetchNextPage()}
              >
                Load more analyses ({Math.max(total - items.length, 0)} remaining)
              </Button>
            ) : null}
            {searchTerm && hasNextPage ? (
              <span className="flex items-center gap-2 font-body text-body-sm text-muted-soft">
                <LoaderCircle className="h-4 w-4 animate-spin text-brand" />
                Searching all of your analyses…
              </span>
            ) : null}
            <p className="font-body text-body-sm text-muted-soft">
              Showing {filteredItems.length} of {searchTerm ? items.length : total} total dish scans
            </p>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this analysis?"
        description={
          pendingDelete
            ? `“${pendingDelete.label}” will be permanently removed along with its photo. This action can't be undone.`
            : ""
        }
        confirmLabel="Delete analysis"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
