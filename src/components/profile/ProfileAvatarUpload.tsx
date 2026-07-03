import { useCallback, useRef, useState, type ChangeEvent } from "react"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../lib/apiErrors"
import { uploadImageFile } from "../../api/files.api"
import { updateTeamMe } from "../../api/team.api"
import { SpinnerIcon } from "../ui/spinner-icon"
import { cn } from "../../lib/utils"
import type { TeamMeProfile } from "../../types/team.types"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function isAllowedImageFile(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(jpe?g|png|webp)$/.test(name)
}

type ProfileAvatarUploadProps = {
  avatarUrl?: string | null
  initials: string
  onProfileUpdate: (profile: TeamMeProfile) => void
}

export function ProfileAvatarUpload({
  avatarUrl,
  initials,
  onProfileUpdate,
}: ProfileAvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      if (uploading) return
      if (!isAllowedImageFile(file)) {
        toast.error("Please use a JPG, PNG, or WEBP image.")
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error("Image is too large", { description: "Maximum size is 5 MB." })
        return
      }

      setUploading(true)
      try {
        const uploadRes = await uploadImageFile(file)
        const uploadedUrl = uploadRes.data?.data?.url?.trim()
        if (!uploadedUrl) throw new Error("Upload did not return a file URL")

        const updateRes = await updateTeamMe({ profile_picture_url: uploadedUrl })
        onProfileUpdate(updateRes.data.data)
        toast.success(updateRes.data.message || "Profile picture updated")
      } catch (err: unknown) {
        console.error(err)
        notifyApiError(err, "Failed to update profile picture")
      } finally {
        setUploading(false)
      }
    },
    [onProfileUpdate, uploading],
  )

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void processFile(file)
  }

  const trimmedUrl = avatarUrl?.trim()

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={handleFileInputChange}
        disabled={uploading}
      />
      <button
        type="button"
        aria-label="Upload profile picture"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2",
          uploading && "cursor-wait",
        )}
      >
        {trimmedUrl ? (
          <img
            src={trimmedUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-100 text-2xl font-bold text-brand-700">
            {initials || "?"}
          </span>
        )}

        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/45",
            "opacity-0 transition-opacity duration-200 ease-out",
            "group-hover:opacity-100 group-focus-visible:opacity-100",
            uploading && "opacity-100",
          )}
        >
          {uploading ? (
            <SpinnerIcon className="h-6 w-6 text-white" />
          ) : (
            <Camera
              className={cn(
                "h-6 w-6 text-white",
                "scale-75 opacity-0 transition-all duration-200 ease-out",
                "group-hover:scale-100 group-hover:opacity-100",
                "group-focus-visible:scale-100 group-focus-visible:opacity-100",
              )}
            />
          )}
        </span>
      </button>
    </>
  )
}
