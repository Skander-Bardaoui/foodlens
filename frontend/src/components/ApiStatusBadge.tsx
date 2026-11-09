import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";

import { fetchHealth } from "../api/client";
import { cn } from "../lib/cn";

export default function ApiStatusBadge() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const isOnline = !isPending && !isError && data?.status === "ok";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        isPending && "border-slate-200 bg-slate-100 text-slate-500",
        !isPending && isOnline && "border-emerald-200 bg-emerald-50 text-emerald-700",
        !isPending && !isOnline && "border-red-200 bg-red-50 text-red-700",
      )}
      title="Backend health check (/api/health)"
    >
      {isPending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
      {!isPending && isOnline && <CircleCheck className="h-3.5 w-3.5" />}
      {!isPending && !isOnline && <CircleX className="h-3.5 w-3.5" />}
      {isPending ? "Checking API" : isOnline ? "API online" : "API unreachable"}
    </span>
  );
}
