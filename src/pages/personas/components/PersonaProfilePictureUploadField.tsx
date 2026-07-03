import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { CloudUpload } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../../lib/apiErrors"
import { uploadImageFile } from "../../../api/files.api"
import { Input } from "../../../components/ui/input"
import { cn } from "../../../lib/utils"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function isAllowedImageFile(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(jpe?g|png|webp)$/.test(name)
}

type PersonaProfilePictureUploadFieldProps = {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  onUploadBusyChange?: (busy: boolean) => void
}

export function PersonaProfilePictureUploadField({
  value,
  onChange,
  disabled = false,
  onUploadBusyChange,
}: PersonaProfilePictureUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const setBusy = useCallback(
    (next: boolean) => {
      setUploading(next)
      onUploadBusyChange?.(next)
    },
    [onUploadBusyChange],
  )

  const processFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return
      if (!isAllowedImageFile(file)) {
        toast.error("Please use a JPG, PNG, or WEBP image.")
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error("Image is too large", {
          description: "Maximum size is 5 MB.",
        })
        return
      }

      setBusy(true)
      try {
        const res = await uploadImageFile(file)
        const url = res.data?.data?.url?.trim()
        if (!url) throw new Error("Upload did not return a file URL")
        onChange(url)
        toast.success("Profile picture uploaded")
      } catch (e: unknown) {
        console.error(e)
        notifyApiError(e, "Failed to upload profile picture")
      } finally {
        setBusy(false)
      }
    },
    [disabled, uploading, onChange, setBusy],
  )

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void processFile(file)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) setDragActive(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  const zoneDisabled = disabled || uploading

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
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
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-white p-6 text-center transition-colors",
          "hover:border-brand-300 hover:bg-grayScale-50/40",
          dragActive && "border-brand-400 bg-brand-50/40",
          zoneDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {uploading ? (
          <p className="text-sm font-medium text-grayScale-600">Uploading…</p>
        ) : (
          <>
            <CloudUpload
              className="mb-2 h-8 w-8 text-brand-600"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-sm">
              <span className="font-semibold text-brand-600">Click to upload</span>{" "}
              <span className="text-grayScale-500">or drag and drop</span>
            </p>
            <p className="mt-1 text-xs text-grayScale-400">JPG, PNG, WEBP (max 5 MB)</p>
          </>
        )}
      </button>
      <Input
        id="persona-profile-picture"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL (https://…)"
        disabled={zoneDisabled}
        autoComplete="off"
      />
    </div>
  )
}
