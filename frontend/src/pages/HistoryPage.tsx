import { History } from "lucide-react";

import PagePlaceholder from "../components/PagePlaceholder";

export default function HistoryPage() {
  return (
    <PagePlaceholder
      icon={History}
      eyebrow="History"
      title="Past scans"
      description="Every analysed meal, newest first, with its label, confidence and timestamp."
    >
      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
        <History className="h-10 w-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Nothing stored yet</p>
        <p className="text-xs text-slate-500">
          Scan history will be loaded from the API once persistence lands.
        </p>
      </div>
    </PagePlaceholder>
  );
}
