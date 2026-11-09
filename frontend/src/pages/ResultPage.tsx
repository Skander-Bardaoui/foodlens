import { Sparkles } from "lucide-react";

import PagePlaceholder from "../components/PagePlaceholder";

export default function ResultPage() {
  return (
    <PagePlaceholder
      icon={Sparkles}
      eyebrow="Result"
      title="Analysis result"
      description="Predicted dish, confidence score and optional nutrition insights will show up here."
    >
      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
        <Sparkles className="h-10 w-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">No scan selected yet</p>
        <p className="text-xs text-slate-500">
          Results will appear after an image is uploaded.
        </p>
      </div>
    </PagePlaceholder>
  );
}
