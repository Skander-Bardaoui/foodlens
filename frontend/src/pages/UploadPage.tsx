import { ImageUp } from "lucide-react";

import PagePlaceholder from "../components/PagePlaceholder";

export default function UploadPage() {
  return (
    <PagePlaceholder
      icon={ImageUp}
      eyebrow="Upload"
      title="Scan a meal"
      description="Drop a photo of your dish and FoodLens will identify it with a Food-101 image classifier."
    >
      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
        <ImageUp className="h-10 w-10 text-brand" />
        <p className="font-body text-label-lg text-ink">Image dropzone coming soon</p>
        <p className="font-body text-label-md text-muted">
          Upload handling will be wired to POST /api in the next step.
        </p>
      </div>
    </PagePlaceholder>
  );
}
