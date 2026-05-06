import { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  DEFAULT_PREVIEW_MAX_SECONDS,
  formatPreviewLength,
} from "../../../lib/videoPreview";

type Props = {
  src: string;
  maxSeconds?: number;
};

/**
 * Stops direct file playback after the first N seconds (admin short preview).
 */
export function PreviewLimitedFileVideo({
  src,
  maxSeconds = DEFAULT_PREVIEW_MAX_SECONDS,
}: Props) {
  const [capped, setCapped] = useState(false);
  const previewLengthLabel = formatPreviewLength(maxSeconds);

  const onTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.currentTime >= maxSeconds) {
      el.pause();
      if (el.currentTime > maxSeconds) {
        el.currentTime = maxSeconds;
      }
      setCapped(true);
    } else {
      setCapped(false);
    }
  };

  const onSeeking = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.currentTime > maxSeconds) {
      el.currentTime = maxSeconds;
    }
  };

  return (
    <div className="relative">
      <video
        controls
        playsInline
        className="aspect-video w-full object-contain"
        src={src}
        onTimeUpdate={onTimeUpdate}
        onSeeking={onSeeking}
        onPlay={() => setCapped(false)}
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 py-2.5 text-center text-[11px] font-semibold",
          capped ? "text-amber-200" : "text-white/95",
        )}
      >
        {capped
          ? `Preview stopped at ${previewLengthLabel} · rewind to rewatch the clip`
          : `Short clip · playback stops at ${previewLengthLabel}`}
      </div>
    </div>
  );
}
