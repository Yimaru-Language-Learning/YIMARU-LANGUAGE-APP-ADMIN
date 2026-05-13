import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react"
import { CloudUpload, Image as ImageIcon, Mic, Pause, Play, X } from "lucide-react"
import { toast } from "sonner"
import { uploadAudioFile, uploadImageFile } from "../../api/files.api"
import { resolveMediaPreviewUrl } from "../../lib/practiceMedia"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { SpinnerIcon } from "../ui/spinner-icon"
import { cn } from "../../lib/utils"
import { ResolvedImage } from "../media/ResolvedImage"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 50 * 1024 * 1024
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"])
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm", "flac"])

export interface DynamicSchemaSlotRow {
  id: string
  kind: string
  label?: string
  required?: boolean
}

function slotMediaMode(kind: string): "image" | "audio" | "text" {
  const u = kind.trim().toUpperCase()
  if (u === "IMAGE") return "image"
  if (u.startsWith("AUDIO")) return "audio"
  return "text"
}

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

function fileLabelFromValue(raw: string): string {
  const t = raw.trim()
  if (!t) return "No audio"
  try {
    if (isHttpUrl(t)) {
      const path = new URL(t).pathname.split("/").filter(Boolean)
      const last = path[path.length - 1]
      return last ? decodeURIComponent(last) : "Audio clip"
    }
  } catch {
    /* ignore */
  }
  const parts = t.split("/").filter(Boolean)
  const last = parts[parts.length - 1]
  return last ? decodeURIComponent(last) : "Audio clip"
}

function DynamicImageSlot({
  value,
  onChange,
  disabled,
  slotLabel,
  slotMeta,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
  slotLabel: string
  slotMeta: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const valueAtFocusRef = useRef("")
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return
      const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
      if (!IMAGE_EXT.has(ext)) {
        toast.error("Unsupported image format", {
          description: "Use JPG, PNG, WEBP, or GIF.",
        })
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error("Image is too large", { description: "Maximum size is 10 MB." })
        return
      }
      setUploading(true)
      try {
        const res = await uploadImageFile(file)
        const url = res.data?.data?.url?.trim()
        if (!url) throw new Error("Upload did not return a URL")
        onChange(url)
        toast.success("Image uploaded")
      } catch (e) {
        console.error(e)
        toast.error("Failed to upload image")
      } finally {
        setUploading(false)
      }
    },
    [disabled, uploading, onChange],
  )

  const importUrl = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || !isHttpUrl(trimmed)) return
    if (trimmed === valueAtFocusRef.current) return
    setUploading(true)
    try {
      const res = await uploadImageFile(trimmed)
      const url = res.data?.data?.url?.trim()
      if (!url) throw new Error("Import did not return a URL")
      onChange(url)
      toast.success("Image URL imported to storage")
    } catch (e) {
      console.error(e)
      toast.error("Could not import image from URL")
    } finally {
      setUploading(false)
    }
  }, [value, onChange])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void processFile(file)
  }

  const zoneDisabled = disabled || uploading
  const hasImage = Boolean(value.trim())

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <span className="text-[11px] font-mono text-grayScale-500">{slotMeta}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,36%)] lg:items-start lg:gap-4">
        <div
          className="min-h-[100px] space-y-2 rounded-lg border border-grayScale-200 bg-grayScale-50/40 p-2.5 lg:min-h-[140px]"
          onDragOver={
            hasImage
              ? (e: DragEvent) => {
                  e.preventDefault()
                  if (!zoneDisabled) setDragActive(true)
                }
              : undefined
          }
          onDragLeave={
            hasImage
              ? (e: DragEvent) => {
                  e.preventDefault()
                  setDragActive(false)
                }
              : undefined
          }
          onDrop={
            hasImage
              ? (e: DragEvent) => {
                  e.preventDefault()
                  setDragActive(false)
                  if (zoneDisabled) return
                  const file = e.dataTransfer.files?.[0]
                  if (file) void processFile(file)
                }
              : undefined
          }
        >
          {hasImage ? (
            <div
              className={cn(
                "relative mx-auto aspect-video max-h-48 w-full max-w-lg overflow-hidden rounded-lg border bg-white shadow-sm transition-colors",
                dragActive ? "border-[#9E2891] ring-2 ring-[#9E289133]" : "border-grayScale-200",
              )}
            >
              <ResolvedImage src={value} alt="" className="h-full w-full object-contain" />
              <button
                type="button"
                className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1.5 text-[#9E2891] shadow-md hover:bg-white"
                onClick={() => onChange("")}
                disabled={zoneDisabled}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-[88px] flex-col items-center justify-center rounded-lg border border-dashed border-grayScale-200 bg-white px-3 py-5 text-center text-xs text-grayScale-500 sm:text-sm lg:min-h-[120px]">
              <ImageIcon className="mb-2 h-8 w-8 text-grayScale-300" strokeWidth={1.25} aria-hidden />
              <p>Preview appears here after you upload or paste a URL on the right.</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileChange}
            disabled={zoneDisabled}
          />
          <label className="text-sm font-medium text-grayScale-700">Upload file</label>
          <button
            type="button"
            disabled={zoneDisabled}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e: DragEvent) => {
              e.preventDefault()
              if (!zoneDisabled) setDragActive(true)
            }}
            onDragLeave={(e: DragEvent) => {
              e.preventDefault()
              setDragActive(false)
            }}
            onDrop={(e: DragEvent) => {
              e.preventDefault()
              setDragActive(false)
              if (zoneDisabled) return
              const file = e.dataTransfer.files?.[0]
              if (file) void processFile(file)
            }}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#9E289133] bg-white p-4 text-center transition-colors",
              "hover:border-[#9E289180] hover:bg-grayScale-50/30",
              dragActive && "border-[#9E2891] bg-[#9E289108]",
              zoneDisabled && "cursor-not-allowed opacity-60",
            )}
          >
            {uploading ? (
              <p className="flex items-center gap-2 text-sm font-medium text-grayScale-600">
                <SpinnerIcon className="h-4 w-4" /> Uploading…
              </p>
            ) : (
              <>
                <CloudUpload className="mb-3 h-9 w-9 text-[#9E2891]" strokeWidth={1.5} aria-hidden />
                <p className="text-sm">
                  <span className="font-bold text-[#9E2891]">Click to upload</span>{" "}
                  <span className="text-grayScale-500">or paste a URL below</span>
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-grayScale-400">
                  JPG, PNG, WebP, GIF (max 10 MB)
                </p>
              </>
            )}
          </button>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => {
              valueAtFocusRef.current = e.currentTarget.value.trim()
            }}
            onBlur={() => void importUrl()}
            placeholder="https://…"
            title="Leave the field after pasting a public URL to import to storage"
            className="h-12 rounded-xl border-grayScale-200 font-mono text-sm"
            disabled={disabled || uploading}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  )
}

function WaveformDecor({ active }: { active: boolean }) {
  const heights = [0.35, 0.55, 0.42, 0.7, 0.5, 0.62, 0.4, 0.58, 0.48, 0.66, 0.44, 0.52, 0.38, 0.6, 0.46, 0.54]
  return (
    <div className="flex h-7 flex-1 items-end justify-center gap-[2px] overflow-hidden px-0.5">
      {heights.map((h, idx) => (
        <div
          key={idx}
          className={cn(
            "w-[3px] min-w-[2px] rounded-full transition-colors",
            active ? "bg-brand-500/80" : "bg-grayScale-300/90",
          )}
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  )
}

function DynamicAudioSlot({
  value,
  onChange,
  disabled,
  slotLabel,
  slotMeta,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
  slotLabel: string
  slotMeta: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const valueAtFocusRef = useRef("")
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState("")
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = value.trim()
      if (!raw) {
        setResolvedSrc("")
        return
      }
      try {
        const url = await resolveMediaPreviewUrl(raw)
        if (!cancelled) setResolvedSrc(url || raw)
      } catch {
        if (!cancelled) setResolvedSrc(raw)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [value])

  const processFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return
      const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
      if (!AUDIO_EXT.has(ext)) {
        toast.error("Unsupported audio format")
        return
      }
      if (file.size > MAX_AUDIO_BYTES) {
        toast.error("Audio file must be 50MB or less")
        return
      }
      setUploading(true)
      try {
        const res = await uploadAudioFile(file)
        const url = res.data?.data?.url?.trim()
        const objectKey = res.data?.data?.object_key?.trim()
        const stored = url || objectKey
        if (!stored) throw new Error("Upload did not return a URL or key")
        onChange(stored)
        toast.success("Audio uploaded")
      } catch (e) {
        console.error(e)
        toast.error("Failed to upload audio")
      } finally {
        setUploading(false)
      }
    },
    [disabled, uploading, onChange],
  )

  const importUrl = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || !isHttpUrl(trimmed)) return
    if (trimmed === valueAtFocusRef.current) return
    setUploading(true)
    try {
      const res = await uploadAudioFile(trimmed)
      const url = res.data?.data?.url?.trim()
      const objectKey = res.data?.data?.object_key?.trim()
      const stored = url || objectKey
      if (!stored) throw new Error("Import did not return a URL or key")
      onChange(stored)
      toast.success("Audio URL imported to storage")
    } catch (e) {
      console.error(e)
      toast.error("Could not import audio from URL")
    } finally {
      setUploading(false)
    }
  }, [value, onChange])

  const togglePlay = async () => {
    const el = audioRef.current
    if (!el || !resolvedSrc) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      try {
        await el.play()
      } catch {
        toast.error("Could not play audio")
      }
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void processFile(file)
  }

  const zoneDisabled = disabled || uploading
  const hasMedia = Boolean(value.trim() && resolvedSrc)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <span className="text-[11px] font-mono text-grayScale-500">{slotMeta}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,36%)] lg:items-start lg:gap-4">
        <div className="min-h-[100px] space-y-2 rounded-lg border border-grayScale-200 bg-grayScale-50/40 p-2.5 lg:min-h-[140px]">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,.flac,audio/*"
            className="sr-only"
            onChange={handleFileChange}
            disabled={zoneDisabled}
          />
          {hasMedia ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#9E289140] bg-[#FAF5FF]/80 px-2 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => void togglePlay()}
                disabled={!resolvedSrc || zoneDisabled}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9E2891] text-white shadow-sm transition hover:bg-[#8a217d] disabled:opacity-40"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <WaveformDecor active={playing} />
                <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-[#9E2891]">
                  {fileLabelFromValue(value)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md p-1.5 text-[#9E2891] transition hover:bg-white/80"
                onClick={() => {
                  audioRef.current?.pause()
                  setPlaying(false)
                  onChange("")
                }}
                disabled={zoneDisabled}
                aria-label="Remove audio"
              >
                <X className="h-4 w-4" />
              </button>
              <audio
                ref={audioRef}
                src={resolvedSrc}
                className="hidden"
                onPlay={() => setPlaying(true)}
                onEnded={() => setPlaying(false)}
                onPause={() => setPlaying(false)}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[80px] flex-col items-center justify-center rounded-lg border border-dashed border-grayScale-200 bg-white px-3 py-4 text-center text-xs text-grayScale-500 sm:text-sm">
              <Mic className="mb-2 h-8 w-8 text-grayScale-300" strokeWidth={1.25} aria-hidden />
              <p>Playback preview appears here after you upload or paste a URL on the right.</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-grayScale-700">Upload file</label>
          <button
            type="button"
            disabled={zoneDisabled}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e: DragEvent) => {
              e.preventDefault()
              if (!zoneDisabled) setDragActive(true)
            }}
            onDragLeave={(e: DragEvent) => {
              e.preventDefault()
              setDragActive(false)
            }}
            onDrop={(e: DragEvent) => {
              e.preventDefault()
              setDragActive(false)
              if (zoneDisabled) return
              const file = e.dataTransfer.files?.[0]
              if (file) void processFile(file)
            }}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#9E289133] bg-white p-4 text-center transition-colors",
              "hover:border-[#9E289180] hover:bg-grayScale-50/30",
              dragActive && "border-[#9E2891] bg-[#9E289108]",
              zoneDisabled && "cursor-not-allowed opacity-60",
            )}
          >
            {uploading ? (
              <p className="flex items-center gap-2 text-sm font-medium text-grayScale-600">
                <SpinnerIcon className="h-4 w-4" /> Uploading…
              </p>
            ) : (
              <>
                <CloudUpload className="mb-3 h-9 w-9 text-[#9E2891]" strokeWidth={1.5} aria-hidden />
                <p className="text-sm">
                  <span className="font-bold text-[#9E2891]">Click to upload</span>{" "}
                  <span className="text-grayScale-500">or paste a URL below</span>
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-grayScale-400">
                  MP3, WAV, OGG, M4A, AAC, WebM, FLAC (max 50 MB)
                </p>
              </>
            )}
          </button>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => {
              valueAtFocusRef.current = e.currentTarget.value.trim()
            }}
            onBlur={() => void importUrl()}
            placeholder="https://…"
            title="Leave the field after pasting a public URL to import to storage"
            className="h-12 rounded-xl border-grayScale-200 font-mono text-sm"
            disabled={disabled || uploading}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  )
}

export interface DynamicSchemaSlotFieldProps {
  row: DynamicSchemaSlotRow
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

export function DynamicSchemaSlotField({
  row,
  value,
  onChange,
  disabled = false,
}: DynamicSchemaSlotFieldProps) {
  const mode = slotMediaMode(row.kind)
  const baseLabel =
    row.label?.trim() ||
    (mode === "image" ? "Image" : mode === "audio" ? "Audio" : row.kind)
  const slotLabel = `${baseLabel}${row.required ? " *" : ""}`
  const slotMeta = `${row.id} · ${row.kind}`

  if (mode === "text") {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
          <span className="text-[11px] font-mono text-grayScale-500">{slotMeta}</span>
        </div>
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL, plain text, or JSON object"
          className="min-h-[88px] resize-y rounded-lg border-grayScale-200 font-mono text-sm"
          disabled={disabled}
        />
      </div>
    )
  }

  if (mode === "image") {
    return (
      <DynamicImageSlot
        value={value}
        onChange={onChange}
        disabled={disabled}
        slotLabel={slotLabel}
        slotMeta={slotMeta}
      />
    )
  }

  return (
    <DynamicAudioSlot
      value={value}
      onChange={onChange}
      disabled={disabled}
      slotLabel={slotLabel}
      slotMeta={slotMeta}
    />
  )
}
