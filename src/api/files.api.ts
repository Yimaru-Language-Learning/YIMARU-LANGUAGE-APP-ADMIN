import http from "./http"

export type UploadMediaType = "image" | "audio" | "video" | "pdf"
export type UploadProvider = "MINIO" | "VIMEO"

export interface UploadMediaResponse {
  message: string
  data?: {
    object_key?: string
    url?: string
    content_type?: string
    media_type?: UploadMediaType
    provider?: UploadProvider
    vimeo_id?: string
    embed_url?: string
  }
  success?: boolean
}

export interface ResolveFileUrlResponse {
  message: string
  data?: {
    url?: string
  }
  success?: boolean
}

export interface RefreshFileUrlResponse {
  message: string
  data?: {
    object_key?: string
    url?: string
    expires_in?: number
  }
  success?: boolean
}

export interface UploadMediaOptions {
  title?: string
  description?: string
}

export interface UploadMediaFromUrlPayload extends UploadMediaOptions {
  sourceUrl: string
}

const GOOGLE_DRIVE_HOSTS = new Set([
  "drive.google.com",
  "www.drive.google.com",
])

const getGoogleDriveFileId = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl.trim())
    if (!GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null
    const fromQuery = url.searchParams.get("id")?.trim()
    if (fromQuery) return fromQuery
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i)
    return fileMatch?.[1]?.trim() || null
  } catch {
    return null
  }
}

const normalizeSourceUrlForUpload = (
  mediaType: UploadMediaType,
  sourceUrl: string,
): string => {
  const trimmed = sourceUrl.trim()
  if (mediaType !== "image") return trimmed
  const fileId = getGoogleDriveFileId(trimmed)
  if (!fileId) return trimmed
  // Use Drive thumbnail endpoint so backend receives actual image bytes, not HTML viewer.
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2048`
}

export const uploadMediaFile = (
  mediaType: UploadMediaType,
  file: File,
  options?: UploadMediaOptions,
) => {
  const formData = new FormData()
  formData.append("media_type", mediaType)
  formData.append("file", file)
  if (mediaType === "video") {
    if (options?.title) formData.append("title", options.title)
    if (options?.description) formData.append("description", options.description)
  }

  // Let Axios set the correct multipart boundary.
  return http.post<UploadMediaResponse>("/files/upload", formData)
}

export const uploadMediaFromUrl = (
  mediaType: UploadMediaType,
  payload: UploadMediaFromUrlPayload,
) =>
  http.post<UploadMediaResponse>("/files/upload", {
    media_type: mediaType,
    source_url: normalizeSourceUrlForUpload(mediaType, payload.sourceUrl),
    ...(mediaType === "video" && payload.title ? { title: payload.title } : {}),
    ...(mediaType === "video" && payload.description ? { description: payload.description } : {}),
  })

export const uploadAudioFile = (fileOrUrl: File | string) =>
  typeof fileOrUrl === "string"
    ? uploadMediaFromUrl("audio", { sourceUrl: fileOrUrl })
    : uploadMediaFile("audio", fileOrUrl)

export const uploadImageFile = (fileOrUrl: File | string) =>
  typeof fileOrUrl === "string"
    ? uploadMediaFromUrl("image", { sourceUrl: fileOrUrl })
    : uploadMediaFile("image", fileOrUrl)

export const uploadVideoFile = (fileOrUrl: File | string, options?: UploadMediaOptions) =>
  typeof fileOrUrl === "string"
    ? uploadMediaFromUrl("video", {
        sourceUrl: fileOrUrl,
        title: options?.title,
        description: options?.description,
      })
    : uploadMediaFile("video", fileOrUrl, options)

export const uploadPdfFile = (file: File) => uploadMediaFile("pdf", file)

export const resolveFileUrl = (key: string) =>
  http.get<ResolveFileUrlResponse>("/files/url", {
    params: { key },
  })

export const refreshFileUrl = (reference: string) =>
  http.post<RefreshFileUrlResponse>("/files/refresh-url", {
    reference,
  })

