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

export interface UploadMediaFromUrlPayload extends UploadMediaOptions {
  sourceUrl: string
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
    source_url: payload.sourceUrl,
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

export const resolveFileUrl = (key: string) =>
  http.get<ResolveFileUrlResponse>("/files/url", {
    params: { key },
  })

