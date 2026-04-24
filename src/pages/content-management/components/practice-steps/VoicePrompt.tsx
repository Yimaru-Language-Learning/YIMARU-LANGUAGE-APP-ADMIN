import { useEffect, useRef, useState } from "react";
import { Play, Pause, X } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface VoicePromptProps {
  /** Either a URL/path to the audio file, or a filename string (for display-only mode) */
  src?: string;
  filename: string;
  onRemove?: () => void;
  className?: string;
}

const BAR_COUNT = 24;

export function VoicePrompt({
  src,
  filename,
  onRemove,
  className,
}: VoicePromptProps) {
  const [bars, setBars] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // ─── Decode audio and build waveform bars ───────────────────────────────────
  useEffect(() => {
    if (!src) {
      // No real audio — generate plausible static bars
      setBars(generateFakeBars());
      return;
    }

    let cancelled = false;
    const audioCtx = new AudioContext();

    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then((decoded) => {
        if (cancelled) return;
        const raw = decoded.getChannelData(0);
        const blockSize = Math.floor(raw.length / BAR_COUNT);
        const barsData = Array.from({ length: BAR_COUNT }, (_, i) => {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(raw[i * blockSize + j]);
          }
          return sum / blockSize;
        });
        // Normalize to 0–1
        const max = Math.max(...barsData, 0.001);
        setBars(barsData.map((v) => v / max));
      })
      .catch(() => {
        if (!cancelled) setBars(generateFakeBars());
      })
      .finally(() => audioCtx.close());

    return () => {
      cancelled = true;
    };
  }, [src]);

  // ─── Sync progress while playing ────────────────────────────────────────────
  const startProgressLoop = () => {
    const tick = () => {
      const el = audioRef.current;
      if (!el) return;
      setProgress(el.currentTime / (el.duration || 1));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopProgressLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // ─── Play / Pause ────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (!src) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        stopProgressLoop();
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      stopProgressLoop();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        startProgressLoop();
      });
    }
  };

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopProgressLoop();
      audioRef.current?.pause();
    };
  }, []);

  const playedBars = Math.round(progress * BAR_COUNT);

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 bg-[#F9F0FB] rounded-6px border border-brand-100 min-h-[60px]",
        className,
      )}
    >
      {/* Play / Pause button */}
      <button
        onClick={handlePlayPause}
        className="h-8 w-8 flex-shrink-0 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-md hover:bg-brand-600 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 fill-current" />
        ) : (
          <Play className="h-3 w-3 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform + filename */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Bars — centered vertically, grow up and down */}
        <div className="flex items-center gap-[3.5px] h-6 overflow-hidden">
          {(bars.length ? bars : generateFakeBars()).map((v, i) => (
            <div
              key={i}
              className="w-[4px] rounded-full flex-shrink-0"
              style={{
                height: `${Math.max(v * 100, 14)}%`,
                backgroundColor: i < playedBars ? "#9E2891" : "#D5C5DC",
              }}
            />
          ))}
        </div>
        {/* Filename */}
        <p className="text-[11px] font-semibold text-brand-500 truncate">
          {filename}
        </p>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-brand-500 hover:text-brand-700 transition-colors p-1"
          aria-label="Remove"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateFakeBars(): number[] {
  // Realistic-looking static waveform (peaks in middle, quieter at edges)
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = BAR_COUNT / 2;
    const envelope = 1 - Math.abs(i - center) / center;
    return Math.max(0.1, envelope * (0.4 + Math.random() * 0.6));
  });
}
