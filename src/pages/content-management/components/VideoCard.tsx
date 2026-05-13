import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Edit2, Play, Pencil, Trash2, Calendar } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { isAdminOrSuperAdminRole } from "../../../lib/sessionRole";
import { cn } from "../../../lib/utils";
import {
  applyShortPreviewToEmbedUrl,
  DEFAULT_PREVIEW_MAX_SECONDS,
  formatPreviewLength,
  getVideoPreview,
} from "../../../lib/videoPreview";
import { PreviewLimitedFileVideo } from "./PreviewLimitedFileVideo";

interface VideoCardProps {
  id?: string | number;
  title: string;
  /** Omits the duration chip when not provided (e.g. API has no length yet). */
  duration?: string;
  /** When omitted, shows a neutral "Lesson" chip and no Publish button. */
  status?: "Draft" | "Published";
  thumbnailGradient?: string;
  thumbnailUrl?: string | null;
  /**
   * When set, the hover play control opens a preview (Vimeo, YouTube, or direct
   * video file) in a dialog.
   */
  videoUrl?: string;
  /**
   * When true, shows edit/delete in the top-right of the thumbnail (same
   * hover pattern as module cards) and removes the footer + overflow menu.
   */
  hoverModuleActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  /** When set (e.g. on module lesson cards), shows an "Add practice" control scoped to this lesson. */
  onAddPractice?: () => void;
  onPublish?: () => void;
}

export function VideoCard({
  title,
  duration,
  status,
  thumbnailGradient = "from-[#CBD5E1] to-[#94A3B8]",
  thumbnailUrl,
  videoUrl,
  onEdit,
  onDelete,
  onPublish,
  onAddPractice,
  hoverModuleActions = false,
}: VideoCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  /** Iframe players ignore URL limits in many cases — unmount after real time. */
  const [iframeSessionDone, setIframeSessionDone] = useState(false);
  const [iframeSessionKey, setIframeSessionKey] = useState(0);
  const useGradient = !thumbnailUrl?.trim() || thumbFailed;
  const videoPreview = useMemo(
    () => (videoUrl?.trim() ? getVideoPreview(videoUrl) : { kind: "none" as const }),
    [videoUrl],
  );
  const limitedEmbedSrc = useMemo(() => {
    if (videoPreview.kind !== "iframe") return null;
    return applyShortPreviewToEmbedUrl(
      videoPreview.src,
      videoPreview.label,
      DEFAULT_PREVIEW_MAX_SECONDS,
    );
  }, [videoPreview]);
  const canPreview = Boolean(videoUrl?.trim());
  const previewLengthLabel = formatPreviewLength(
    DEFAULT_PREVIEW_MAX_SECONDS,
  );

  useEffect(() => {
    if (!previewOpen) {
      setIframeSessionDone(false);
      return;
    }
    if (videoPreview.kind !== "iframe" || !limitedEmbedSrc) {
      return;
    }
    if (iframeSessionDone) {
      return;
    }
    const ms = DEFAULT_PREVIEW_MAX_SECONDS * 1000;
    const id = window.setTimeout(() => {
      setIframeSessionDone(true);
    }, ms);
    return () => window.clearTimeout(id);
  }, [
    previewOpen,
    videoPreview.kind,
    limitedEmbedSrc,
    iframeSessionDone,
  ]);

  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setIframeSessionDone(false);
      setIframeSessionKey((k) => k + 1);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white rounded-[24px] border border-grayScale-50 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col",
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative h-44 w-full overflow-hidden",
          useGradient && "bg-gradient-to-br",
          useGradient && thumbnailGradient,
          !useGradient && "bg-grayScale-100",
        )}
      >
        {hoverModuleActions && (onEdit || onDelete) ? (
          <div
            className="absolute right-2 top-2 z-20 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto"
          >
            {onEdit ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-md bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                aria-label={`Edit ${title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-md bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                aria-label={`Delete ${title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {!useGradient && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setThumbFailed(true)}
          />
        ) : null}
        {/* Duration Badge */}
        {duration ? (
          <div className="absolute bottom-3 right-3 z-10 bg-black/70 text-white text-[11px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
            {duration}
          </div>
        ) : null}
        {/* Play: opens preview dialog when videoUrl is set */}
        {canPreview ? (
          <button
            type="button"
            className="absolute inset-0 z-[8] flex cursor-pointer items-center justify-center bg-gradient-to-b from-black/0 via-black/20 to-black/30 opacity-0 transition-all duration-300 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setPreviewOpen(true);
            }}
            aria-label={`Play preview: ${title}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105 group-hover:border-white/50 group-hover:bg-white/30">
              <Play className="h-6 w-6 text-white" fill="currentColor" />
            </span>
          </button>
        ) : (
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play className="h-6 w-6 text-white fill-current" />
            </div>
          </div>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={handlePreviewOpenChange}>
        <DialogContent
          className="max-w-4xl w-[min(100vw-1.5rem,56rem)] gap-0 overflow-hidden rounded-2xl border border-grayScale-200 p-0 shadow-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-grayScale-100 bg-gradient-to-r from-[#F8FAFC] to-white px-5 py-4 pr-12 sm:px-6 sm:pr-14">
            <DialogHeader className="space-y-0.5 p-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-500">
                Short preview
              </p>
              <DialogTitle className="line-clamp-2 text-left text-base font-bold leading-snug text-grayScale-900 sm:text-lg">
                {title}
              </DialogTitle>
              <p className="pt-0.5 text-left text-xs font-medium text-grayScale-500">
                The player closes automatically after {previewLengthLabel} in
                this window (YouTube/Vimeo can’t be trimmed reliably). For the
                full lesson, use your LMS app.
              </p>
            </DialogHeader>
          </div>
          <div className="bg-black">
            {videoPreview.kind === "iframe" && limitedEmbedSrc ? (
              iframeSessionDone ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 bg-gradient-to-b from-grayScale-900 to-grayScale-950 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-white">
                    Preview time in this window has ended
                  </p>
                  <p className="max-w-sm text-xs text-white/60">
                    The embed is removed after {previewLengthLabel} of real time
                    so the full video is not available here.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-1 font-bold"
                    onClick={() => {
                      setIframeSessionDone(false);
                      setIframeSessionKey((k) => k + 1);
                    }}
                  >
                    Start preview again
                  </Button>
                  {videoUrl && isAdminOrSuperAdminRole() ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-300 underline-offset-2 hover:underline"
                    >
                      Open full video in new tab
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="relative aspect-video w-full">
                  <iframe
                    key={`${iframeSessionKey}-${limitedEmbedSrc}`}
                    src={limitedEmbedSrc}
                    title={`${videoPreview.label} preview: ${title}`}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                  />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 py-2.5 text-center text-[11px] font-semibold text-white/95">
                    Stops in {previewLengthLabel} (hard limit)
                  </div>
                </div>
              )
            ) : videoPreview.kind === "video" ? (
              <PreviewLimitedFileVideo
                src={videoPreview.src}
                maxSeconds={DEFAULT_PREVIEW_MAX_SECONDS}
              />
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 bg-grayScale-900 px-6 py-10 text-center">
                <p className="text-sm font-medium text-white/90">
                  This link can’t be played inline
                </p>
                <p className="max-w-sm text-xs text-white/50">
                  Use a Vimeo, YouTube, or direct URL to a video file (e.g. MP4)
                  for an embedded preview.
                </p>
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm font-semibold text-brand-300 underline-offset-2 hover:underline"
                  >
                    Open in new tab
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div
          className={cn(
            "flex items-center gap-2",
            hoverModuleActions ? "justify-start" : "justify-between",
          )}
        >
          {/* Status Badge */}
          {status ? (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border min-w-0",
                status === "Published"
                  ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
                  : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  status === "Published" ? "bg-[#10B981]" : "bg-[#9CA3AF]",
                )}
              />
              {status}
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-[#E5E7EB] bg-grayScale-50 text-grayScale-500">
              <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 bg-[#9CA3AF]" />
              Lesson
            </div>
          )}
          {!hoverModuleActions ? (
            <button
              type="button"
              className="h-8 w-8 flex flex-shrink-0 items-center justify-center rounded-full hover:bg-grayScale-50 transition-colors text-grayScale-400"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <h3 className="text-[16px] font-medium text-grayScale-900 line-clamp-2 leading-snug">
          {title}
        </h3>

        {hoverModuleActions && onAddPractice ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full shrink-0 rounded-lg border-brand-200 text-[12px] font-bold text-brand-600 hover:bg-brand-50"
            onClick={(e) => {
              e.stopPropagation();
              onAddPractice();
            }}
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Add practice
          </Button>
        ) : null}

        {/* Actions (footer) — not used for API lesson cards with hover tools */}
        {!hoverModuleActions ? (
          <div className="pt-2 space-y-3 mt-auto">
            <Button
              variant="outline"
              onClick={onEdit}
              className="w-full h-10 rounded-xl border-grayScale-200 text-grayScale-600 font-bold hover:bg-grayScale-50 transition-all flex items-center justify-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            {status ? (
              <Button
                disabled={status === "Published"}
                onClick={onPublish}
                className={cn(
                  "w-full h-10 rounded-xl font-bold transition-all shadow-sm",
                  status === "Published"
                    ? "bg-[#E9D5E5] text-white opacity-100 cursor-default"
                    : "bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/10",
                )}
              >
                {status === "Published" ? "Published" : "Publish"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
