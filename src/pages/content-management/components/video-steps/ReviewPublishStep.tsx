import { useEffect, useMemo, useState } from "react";
import { Rocket, Edit2, Link2, Video } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import type { PracticePublishStatus } from "../../../../types/course.types";
import type { AddLessonFormData } from "../../AddVideoFlow";
import {
  applyShortPreviewToEmbedUrl,
  DEFAULT_PREVIEW_MAX_SECONDS,
  formatPreviewLength,
  getVideoPreview,
  resolveThumbnailForPreview,
} from "../../../../lib/videoPreview";
import { PreviewLimitedFileVideo } from "../PreviewLimitedFileVideo";
import { UnassignedLabel } from "../../../../lib/displayValue"

interface ReviewPublishStepProps {
  formData: AddLessonFormData;
  prevStep: () => void;
  onCreateLesson: (publishStatus: PracticePublishStatus) => void;
  publishing: boolean;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export function ReviewPublishStep({
  formData,
  prevStep,
  onCreateLesson,
  publishing,
}: ReviewPublishStepProps) {
  const [thumbBroken, setThumbBroken] = useState(false);
  const videoPreview = useMemo(
    () => getVideoPreview(formData.videoUrl),
    [formData.videoUrl],
  );
  const limitedEmbedSrc = useMemo(() => {
    if (videoPreview.kind !== "iframe") return null;
    return applyShortPreviewToEmbedUrl(
      videoPreview.src,
      videoPreview.label,
      DEFAULT_PREVIEW_MAX_SECONDS,
    );
  }, [videoPreview]);
  const previewLengthLabel = formatPreviewLength(DEFAULT_PREVIEW_MAX_SECONDS);
  const thumbSrc = useMemo(
    () => resolveThumbnailForPreview(formData.thumbnailUrl),
    [formData.thumbnailUrl],
  );

  useEffect(() => {
    setThumbBroken(false);
  }, [thumbSrc]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white rounded-[16px] border border-grayScale-50 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-grayScale-50 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between bg-white">
          <h3 className="text-[17px] font-bold text-grayScale-900">
            Media preview
          </h3>
          <p className="text-xs font-medium text-grayScale-500">
            Video: short clip (first {previewLengthLabel} only)
          </p>
        </div>
        <div className="p-8">
          <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-10">
            {/* Video preview */}
            <div className="min-w-0 flex-1 space-y-3">
              <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
                Video
              </span>
              {formData.videoUrl ? (
                <div className="space-y-3">
                  {videoPreview.kind === "iframe" && limitedEmbedSrc ? (
                    <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-black shadow-sm">
                      <div className="relative aspect-video w-full max-w-4xl">
                        <iframe
                          key={limitedEmbedSrc}
                          src={limitedEmbedSrc}
                          title={`${videoPreview.label} lesson preview`}
                          className="absolute inset-0 h-full w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 py-2.5 text-center text-[11px] font-semibold text-white/95">
                          Short clip · max {previewLengthLabel}
                        </div>
                      </div>
                    </div>
                  ) : videoPreview.kind === "video" ? (
                    <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-black shadow-sm">
                      <PreviewLimitedFileVideo
                        src={videoPreview.src}
                        maxSeconds={DEFAULT_PREVIEW_MAX_SECONDS}
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-grayScale-200 bg-grayScale-50/80 px-6 py-10 text-center">
                      <Video className="h-10 w-10 text-grayScale-300" />
                      <p className="text-sm font-medium text-grayScale-600">
                        No inline preview for this URL
                      </p>
                      <p className="text-xs text-grayScale-500 max-w-md">
                        Use a Vimeo, YouTube, or direct link to a video file
                        (MP4, WebM, …) to see a player here. The URL below will
                        still be saved.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-[13px] text-grayScale-600 break-all">
                    <Link2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-grayScale-400" />
                    {truncate(formData.videoUrl, 220)}
                  </div>
                </div>
              ) : (
                <p className="text-grayScale-400 text-sm"><UnassignedLabel /></p>
              )}
            </div>

            {/* Thumbnail preview */}
            <div className="w-full shrink-0 space-y-3 xl:max-w-[360px]">
              <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
                Thumbnail
              </span>
              {formData.thumbnailUrl && thumbSrc ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-100 shadow-sm">
                    <div className="relative aspect-video w-full max-w-md">
                      {!thumbBroken ? (
                        <img
                          src={thumbSrc}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={() => setThumbBroken(true)}
                        />
                      ) : (
                        <div className="flex aspect-video w-full max-w-md items-center justify-center bg-grayScale-200 px-4 text-center text-xs text-grayScale-500">
                          Thumbnail could not be loaded. URL will still be
                          saved.
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[12px] text-grayScale-500 break-all">
                    {truncate(formData.thumbnailUrl, 160)}
                  </p>
                </div>
              ) : (
                <p className="text-grayScale-400 text-sm"><UnassignedLabel /></p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-grayScale-50 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-grayScale-50 flex items-center justify-between bg-white">
          <h3 className="text-[16px] font-bold text-grayScale-900">
            Content details
          </h3>
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-2 text-brand-500 font-bold text-sm hover:opacity-80 transition-opacity"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
        </div>

        <div className="p-8 space-y-10">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
              Title
            </span>
            <p className="text-[15px] font-medium text-grayScale-900">
              {formData.title || <UnassignedLabel />}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
              Sort order
            </span>
            <p className="text-[15px] font-medium text-grayScale-900">
              {formData.sortOrder.trim() !== ""
                ? formData.sortOrder.trim()
                : <UnassignedLabel />}
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
              Description
            </span>
            <div
              className="text-[14px] text-grayScale-600 leading-relaxed max-w-4xl"
              dangerouslySetInnerHTML={{
                __html:
                  formData.description ||
                  "<p class='text-grayScale-400 italic'>unassigned</p>",
              }}
            />
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-grayScale-200" />
          </div>
          <div className="relative flex justify-center">
            <div
              className="h-[0.5px] w-full opacity-20 rounded-full"
              style={{ background: "gray" }}
            />
          </div>
        </div>

        <div className="px-8 py-6 border-t border-grayScale-50 flex items-center justify-between bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={publishing}
            className="h-10 px-8 rounded-[6px] border-grayScale-200 font-bold text-grayScale-600 hover:bg-grayScale-50 transition-all shadow-sm"
          >
            Back
          </Button>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 px-8 rounded-[6px] border-grayScale-100 font-bold text-grayScale-600 hover:bg-grayScale-50 transition-all shadow-sm"
              disabled={publishing}
              onClick={() => onCreateLesson("DRAFT")}
            >
              Save as draft
            </Button>
            <Button
              type="button"
              onClick={() => onCreateLesson("PUBLISHED")}
              disabled={publishing}
              className="h-10 px-10 rounded-[6px] bg-brand-500 font-bold text-white  shadow-brand-500/20 transition-all flex items-center gap-2.5 disabled:opacity-60"
            >
              <Rocket className="h-4 w-4" />
              {publishing ? "Creating…" : "Publish lesson"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
