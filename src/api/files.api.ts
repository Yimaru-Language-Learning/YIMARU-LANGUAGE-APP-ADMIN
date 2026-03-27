import http from "./http"

export type UploadMediaType = "image" | "audio" | "video"
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

export interface UploadMediaOptions {
  title?: string
  description?: string
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

export const uploadAudioFile = (file: File) => uploadMediaFile("audio", file)

export const uploadImageFile = (file: File) => uploadMediaFile("image", file)

export const uploadVideoFile = (file: File, options?: UploadMediaOptions) =>
  uploadMediaFile("video", file, options)

export const resolveFileUrl = (key: string) =>
  http.get<ResolveFileUrlResponse>("/files/url", {
    params: { key },
  })

