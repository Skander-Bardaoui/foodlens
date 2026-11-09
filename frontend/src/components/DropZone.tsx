import { AlertCircle, Camera, ImageIcon, X } from "lucide-react";
import { useId } from "react";
import { useDropzone } from "react-dropzone";

import { cn } from "../lib/cn";
import IconButton from "./IconButton";

type DropZoneProps = {
  onFiles?: (files: File[]) => void;
  onClear?: () => void;
  previewUrl?: string | null;
  previewName?: string;
  error?: string | null;
  maxSizeMb?: number;
  className?: string;
};

const corner =
  "pointer-events-none absolute h-6 w-6 border-brand/40 transition-colors";

export default function DropZone({
  onFiles,
  onClear,
  previewUrl,
  previewName,
  error,
  maxSizeMb = 5,
  className,
}: DropZoneProps) {
  const helpId = useId();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: (files) => onFiles?.(files),
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: maxSizeMb * 1024 * 1024,
    multiple: false,
    disabled: Boolean(previewUrl || previewName),
  });

  if (previewUrl || previewName) {
    return (
      <div className={cn("overflow-hidden rounded-panel bg-surface-lowest p-3 shadow-card", className)}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-surface-high">
          {previewUrl ? (
            <img src={previewUrl} alt={previewName ?? "Selected dish"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-soft/60 via-surface-low to-surface-high text-muted-soft">
              <ImageIcon className="h-10 w-10" />
              <span className="font-body text-label-sm uppercase tracking-wider">Dish preview</span>
            </div>
          )}
          {onClear ? (
            <IconButton
              label="Remove photo"
              icon={<X className="h-4 w-4" />}
              className="absolute right-3 top-3 bg-surface-lowest/90 backdrop-blur-md"
              onClick={onClear}
            />
          ) : null}
          <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-pill bg-surface-inverse/80 px-3 py-1 font-body text-label-sm text-white backdrop-blur-md">
            {previewName ?? "Selected photo"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        {...getRootProps({
          role: "button",
          "aria-label": "Upload a food photo",
          "aria-describedby": helpId,
          "aria-invalid": error ? true : undefined,
        })}
        className={cn(
          "group relative flex min-h-[19rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-panel border-2 border-dashed px-6 py-12 text-center transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
          isDragActive
            ? "border-brand bg-brand-tint"
            : error
              ? "border-danger/60 bg-danger-soft/20"
              : "border-faint bg-surface-lowest hover:border-brand hover:bg-brand-tint/60",
        )}
      >
        <input {...getInputProps({ "aria-label": "Food photo file" })} />

        <span className={cn(corner, "left-3 top-3 rounded-tl-md border-l-2 border-t-2")} />
        <span className={cn(corner, "right-3 top-3 rounded-tr-md border-r-2 border-t-2")} />
        <span className={cn(corner, "bottom-3 left-3 rounded-bl-md border-b-2 border-l-2")} />
        <span className={cn(corner, "bottom-3 right-3 rounded-br-md border-b-2 border-r-2")} />

        <span
          className={cn(
            "mb-5 flex h-20 w-20 items-center justify-center rounded-pill bg-brand-soft text-brand-deep transition-transform duration-200",
            isDragActive && "scale-110",
          )}
        >
          {error ? <AlertCircle className="h-9 w-9" /> : <Camera className="h-9 w-9" />}
        </span>

        <h3 className="font-display text-headline-sm font-bold text-ink">
          {error
            ? "We couldn't read that photo"
            : isDragActive
              ? "Drop it in the pan"
              : "Drop your dish photo here"}
        </h3>
        <p
          id={helpId}
          role={error ? "alert" : undefined}
          className="mt-1 max-w-sm font-body text-body-sm text-muted"
        >
          {error ??
            "or click to browse — JPG, PNG or WEBP, up to " + `${maxSizeMb} MB.`}
        </p>

        {!error ? (
          <span className="mt-6 inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface-lowest px-5 py-2.5 font-body text-label-lg text-ink transition-colors group-hover:border-brand group-hover:text-brand-deep">
            <Camera className="h-4 w-4" />
            Choose a photo
          </span>
        ) : null}

        <p className="mt-5 font-body text-label-sm text-muted-soft">
          Best results with bright, top-down or 45° shots
        </p>
      </div>
    </div>
  );
}
