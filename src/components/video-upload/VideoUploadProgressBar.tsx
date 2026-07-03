import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import type { VideoUploadProgress } from "../../lib/video-upload/types"

interface VideoUploadProgressBarProps {
  progress: VideoUploadProgress
  onCancel?: () => void
  className?: string
}

export function VideoUploadProgressBar({
  progress,
  onCancel,
  className,
}: VideoUploadProgressBarProps) {
  if (progress.phase === "idle") return null

  const showCancel =
    (progress.phase === "uploading" || progress.phase === "creating") && onCancel

  return (
    <div
      className={cn("space-y-2 rounded-xl border border-grayScale-200 bg-grayScale-50/60 p-3", className)}
      role="status"
      aria-live="polite"
    >
      <div className="h-2 overflow-hidden rounded-full bg-grayScale-200">
        <div
          className="h-full rounded-full bg-[#9E2891] transition-[width] duration-200 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-grayScale-600">
        <span className="font-medium">{progress.message}</span>
        <span className="tabular-nums text-grayScale-500">{progress.percent}%</span>
      </div>
      {progress.phase === "uploading" &&
        progress.bytesTotal != null &&
        progress.bytesUploaded != null && (
          <p className="text-xs text-grayScale-500">
            {(progress.bytesUploaded / 1024 / 1024).toFixed(1)} MB /{" "}
            {(progress.bytesTotal / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      {showCancel ? (
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel upload
        </Button>
      ) : null}
    </div>
  )
}
