import { notifyApiError } from "../../../lib/apiErrors"
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import { uploadImageFile } from "../../../api/files.api";
import { useVideoUpload } from "../../../hooks/useVideoUpload";
import { VideoUploadProgressBar } from "../../../components/video-upload/VideoUploadProgressBar";
import { vimeoResultToStoredUrl } from "../../../lib/video-upload/upload-video";

const MAX_THUMB_BYTES = 5 * 1024 * 1024;

const THUMB_TYPES = new Set(["image/jpeg", "image/png"]);
const VIDEO_TYPES_PREFIX = "video/";

function isAllowedThumb(file: File): boolean {
  if (THUMB_TYPES.has(file.type)) return true;
  const n = file.name.toLowerCase();
  return /\.(jpe?g|png)$/.test(n);
}

function isAllowedVideoFile(file: File): boolean {
  if (file.type.startsWith(VIDEO_TYPES_PREFIX)) return true;
  const n = file.name.toLowerCase();
  return /\.(mp4|webm|mov|m4v|mkv)$/.test(n);
}

export type LessonMediaUploadKind = "thumbnail" | "video";

export interface LessonMediaUploadFieldProps {
  kind: LessonMediaUploadKind;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  onUploadBusyChange?: (busy: boolean) => void;
  className?: string;
  /** Vimeo title when uploading a video file */
  videoTitle?: string;
  videoDescription?: string;
}

export function LessonMediaUploadField({
  kind,
  value,
  onChange,
  disabled = false,
  onUploadBusyChange,
  className,
  videoTitle,
  videoDescription,
}: LessonMediaUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { upload: uploadVideo, cancel: cancelVideo, progress: videoProgress, isBusy: videoBusy } =
    useVideoUpload();

  const uploading = kind === "video" ? videoBusy : uploadingThumb;

  useEffect(() => {
    if (kind === "video") {
      onUploadBusyChange?.(videoBusy);
    }
  }, [kind, videoBusy, onUploadBusyChange]);

  const processFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;

      if (kind === "thumbnail") {
        if (!isAllowedThumb(file)) {
          toast.error("Please use a JPG or PNG image.");
          return;
        }
        if (file.size > MAX_THUMB_BYTES) {
          toast.error("Image is too large", {
            description: "Maximum size is 5 MB.",
          });
          return;
        }
        setUploadingThumb(true);
        onUploadBusyChange?.(true);
        try {
          const res = await uploadImageFile(file);
          const url = res.data?.data?.url?.trim();
          if (!url) throw new Error("Upload did not return a file URL");
          onChange(url);
          toast.success("Thumbnail uploaded");
        } catch (e: unknown) {
          console.error(e);
          notifyApiError(e, "Failed to upload thumbnail");
        } finally {
          setUploadingThumb(false);
          onUploadBusyChange?.(false);
        }
        return;
      }

      if (!isAllowedVideoFile(file)) {
        toast.error("Please use a video file (e.g. MP4, WebM, MOV).");
        return;
      }

      try {
        const res = await uploadVideo(file, {
          title: videoTitle?.trim() || file.name,
          description: videoDescription?.trim() || undefined,
        });
        if (res) {
          onChange(vimeoResultToStoredUrl(res));
          toast.success("Video uploaded");
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error(e);
        notifyApiError(e, "Failed to upload video");
      }
    },
    [
      disabled,
      uploading,
      kind,
      onChange,
      onUploadBusyChange,
      uploadVideo,
      videoTitle,
      videoDescription,
    ],
  );

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const zoneDisabled = disabled || uploading;
  const isThumb = kind === "thumbnail";
  const label = isThumb ? "Thumbnail" : "Video";
  const hint = isThumb
    ? "JPG, PNG (MAX 5 MB)"
    : "MP4, MOV, WebM (MAX 2 GB)";

  const videoUploadingLabel =
    videoProgress.phase === "processing"
      ? videoProgress.message
      : videoProgress.phase === "uploading"
        ? videoProgress.message
        : videoProgress.phase === "creating"
          ? "Preparing upload…"
          : "Uploading…";

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-grayScale-700">
        {label}
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept={
          isThumb
            ? "image/jpeg,image/png,.jpg,.jpeg,.png"
            : "video/*,.mp4,.webm,.mov,.m4v,.mkv"
        }
        className="sr-only"
        onChange={handleFileInputChange}
        disabled={zoneDisabled}
      />
      <button
        type="button"
        disabled={zoneDisabled}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#9E289133] bg-white p-10 text-center transition-colors",
          "hover:border-[#9E289180] hover:bg-grayScale-50/30",
          dragActive && "border-[#9E2891] bg-[#9E289108]",
          zoneDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {uploading && isThumb ? (
          <p className="text-sm font-medium text-grayScale-600">Uploading…</p>
        ) : uploading && !isThumb ? (
          <p className="text-sm font-medium text-grayScale-600">{videoUploadingLabel}</p>
        ) : (
          <>
            <CloudUpload
              className="mb-4 h-10 w-10 text-[#9E2891]"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-sm">
              <span className="font-bold text-[#9E2891]">Click to upload</span>{" "}
              <span className="text-grayScale-500">or paste a URL below</span>
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-grayScale-400">
              {hint}
            </p>
          </>
        )}
      </button>
      {!isThumb && videoProgress.phase !== "idle" ? (
        <VideoUploadProgressBar progress={videoProgress} onCancel={cancelVideo} />
      ) : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        className="h-12 rounded-xl"
        disabled={disabled || uploading}
        autoComplete="off"
      />
    </div>
  );
}
