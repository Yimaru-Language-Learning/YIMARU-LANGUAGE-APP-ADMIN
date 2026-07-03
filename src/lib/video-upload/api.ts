import http from "../../api/http"
import type {
  ApiResponse,
  CreateTusUploadRequest,
  VimeoTranscodeStatus,
  VimeoTusSlot,
} from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function readString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key]
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ""
}

/** Backend may return PascalCase (Go json tags) or snake_case. */
function normalizeVimeoTusSlot(raw: unknown): VimeoTusSlot {
  if (!isRecord(raw)) throw new Error("Invalid Vimeo TUS upload response")

  const vimeo_id = readString(raw, "vimeo_id", "VimeoID", "VimeoId", "id", "ID")
  const upload_link = readString(
    raw,
    "upload_link",
    "UploadLink",
    "UploadURL",
    "upload_url",
  )
  const link = readString(raw, "link", "Link")
  const uri = readString(raw, "uri", "URI", "Uri")
  const status = readString(raw, "status", "Status") || "in_progress"

  if (!vimeo_id) throw new Error("Vimeo TUS response missing video id")
  if (!upload_link) throw new Error("Vimeo TUS response missing upload link")

  return { vimeo_id, uri, link, upload_link, status }
}

function normalizeVimeoTranscodeStatus(raw: unknown): VimeoTranscodeStatus {
  if (!isRecord(raw)) throw new Error("Invalid Vimeo transcode status response")

  const video_id = readString(raw, "video_id", "VideoID", "VideoId", "vimeo_id", "VimeoID")
  const status = readString(raw, "status", "Status", "transcode_status", "TranscodeStatus")

  if (!video_id) throw new Error("Transcode status response missing video id")
  if (!status) throw new Error("Transcode status response missing status")

  return { video_id, status }
}

export async function createVimeoTusSlot(
  body: CreateTusUploadRequest,
  signal?: AbortSignal,
): Promise<VimeoTusSlot> {
  const res = await http.post<ApiResponse<unknown>>("/vimeo/uploads/tus", body, {
    signal,
  })
  return normalizeVimeoTusSlot(res.data.data)
}

export async function getVimeoTranscodeStatus(
  videoId: string,
  signal?: AbortSignal,
): Promise<VimeoTranscodeStatus> {
  const res = await http.get<ApiResponse<unknown>>(
    `/vimeo/videos/${encodeURIComponent(videoId.trim())}/status`,
    { signal },
  )
  return normalizeVimeoTranscodeStatus(res.data.data)
}

export interface VimeoVideoDetails {
  vimeo_id: string
  link: string
  embed_url: string
}

/** Full video metadata (includes privacy-aware embed_url / link with hash). */
export async function getVimeoVideoDetails(
  videoId: string,
  signal?: AbortSignal,
): Promise<VimeoVideoDetails> {
  const res = await http.get<ApiResponse<unknown>>(
    `/vimeo/videos/${encodeURIComponent(videoId.trim())}`,
    { signal },
  )
  const raw = res.data.data
  if (!isRecord(raw)) throw new Error("Invalid Vimeo video response")

  const vimeo_id =
    readString(raw, "vimeo_id", "VimeoID", "VimeoId", "id", "ID") || videoId.trim()
  const link = readString(raw, "link", "Link")
  const embed_url = readString(raw, "embed_url", "EmbedURL", "EmbedUrl")

  return { vimeo_id, link, embed_url }
}
