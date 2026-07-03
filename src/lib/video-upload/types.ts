export interface ApiResponse<T> {
  message: string
  data: T
  success?: boolean
  status_code?: number
}

export interface ApiErrorBody {
  message: string
  error?: string
}

export interface CreateTusUploadRequest {
  name: string
  description?: string
  file_size: number
}

export interface VimeoTusSlot {
  vimeo_id: string
  uri: string
  link: string
  upload_link: string
  status: string
}

export interface VimeoTranscodeStatus {
  video_id: string
  status: string
}

export interface VimeoVideoResult {
  vimeoId: string
  link: string
  embedUrl: string
  playerEmbedUrl: string
}

export type VideoUploadPhase =
  | "idle"
  | "creating"
  | "uploading"
  | "processing"
  | "done"
  | "error"
  | "cancelled"

export interface VideoUploadProgress {
  phase: VideoUploadPhase
  percent: number
  message: string
  bytesUploaded?: number
  bytesTotal?: number
  vimeoId?: string
}

export interface VideoUploadOptions {
  title?: string
  description?: string
  onProgress?: (progress: VideoUploadProgress) => void
  signal?: AbortSignal
  transcodePollIntervalMs?: number
  transcodeMaxAttempts?: number
}

export const VIDEO_UPLOAD_BUSY_PHASES: VideoUploadPhase[] = [
  "creating",
  "uploading",
  "processing",
]

export function isVideoUploadBusy(phase: VideoUploadPhase): boolean {
  return VIDEO_UPLOAD_BUSY_PHASES.includes(phase)
}
