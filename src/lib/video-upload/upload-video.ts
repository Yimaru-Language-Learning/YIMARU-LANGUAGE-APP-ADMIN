import { toVimeoEmbedUrl } from "../videoPreview"
import {
  createVimeoTusSlot,
  getVimeoTranscodeStatus,
  getVimeoVideoDetails,
} from "./api"
import { uploadFileViaTus } from "./tus-upload"
import type { VideoUploadOptions, VideoUploadProgress, VimeoVideoResult } from "./types"

/**
 * Build a playable player.vimeo.com URL.
 * Private/unlisted videos require `?h=<privacy_hash>` — taken from the page link
 * (`https://vimeo.com/<id>/<hash>`) or from API `embed_url`.
 */
function buildPlayerEmbedUrl(
  vimeoId: string,
  link?: string,
  embedUrl?: string,
): string {
  if (embedUrl?.trim()) {
    const fromEmbed = toVimeoEmbedUrl(embedUrl.trim())
    if (fromEmbed) return fromEmbed
    if (embedUrl.includes("player.vimeo.com/video/")) return embedUrl.trim()
  }
  if (link?.trim()) {
    const fromLink = toVimeoEmbedUrl(link.trim())
    if (fromLink) return fromLink
  }
  return `https://player.vimeo.com/video/${vimeoId}`
}

function emit(
  onProgress: VideoUploadOptions["onProgress"],
  progress: VideoUploadProgress,
) {
  onProgress?.(progress)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelled", "AbortError"))
      return
    }
    const t = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Cancelled", "AbortError"))
    })
  })
}

export function validateVideoFile(file: File): void {
  if (
    !file.type.startsWith("video/") &&
    !/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)
  ) {
    throw new Error("Please select a video file (MP4, MOV, WebM, etc.)")
  }
  if (file.size <= 0) {
    throw new Error("File is empty")
  }
  const twoGB = 2 * 1024 * 1024 * 1024
  if (file.size > twoGB) {
    throw new Error("Video exceeds 2 GB — check your Vimeo plan limits")
  }
}

export function vimeoResultToStoredUrl(result: VimeoVideoResult): string {
  return result.playerEmbedUrl
}

export async function uploadVideoWithProgress(
  file: File,
  options: VideoUploadOptions = {},
): Promise<VimeoVideoResult> {
  const {
    title,
    description,
    onProgress,
    signal,
    transcodePollIntervalMs = 5000,
    transcodeMaxAttempts = 120,
  } = options

  validateVideoFile(file)

  emit(onProgress, {
    phase: "creating",
    percent: 2,
    message: "Creating Vimeo upload…",
  })

  const slot = await createVimeoTusSlot(
    {
      name: title?.trim() || file.name,
      description: description?.trim() || undefined,
      file_size: file.size,
    },
    signal,
  )

  emit(onProgress, {
    phase: "creating",
    percent: 5,
    message: "Upload starting…",
    vimeoId: slot.vimeo_id,
  })

  const tusController = uploadFileViaTus(
    file,
    slot.upload_link,
    ({ bytesUploaded, bytesTotal, percent, message }) => {
      emit(onProgress, {
        phase: "uploading",
        percent,
        message,
        bytesUploaded,
        bytesTotal,
        vimeoId: slot.vimeo_id,
      })
    },
    signal,
  )

  try {
    await tusController.done
  } catch (e) {
    if (signal?.aborted) {
      emit(onProgress, { phase: "cancelled", percent: 0, message: "Upload cancelled" })
      throw e
    }
    emit(onProgress, {
      phase: "error",
      percent: 0,
      message: e instanceof Error ? e.message : "Upload failed",
      vimeoId: slot.vimeo_id,
    })
    throw e
  }

  emit(onProgress, {
    phase: "processing",
    percent: 82,
    message: "Processing video on Vimeo…",
    vimeoId: slot.vimeo_id,
  })

  let status = "in_progress"
  let attempt = 0

  while (status === "in_progress" || status === "unknown") {
    if (attempt >= transcodeMaxAttempts) {
      throw new Error(
        "Video uploaded but processing is taking longer than expected. You may save the video ID and refresh later.",
      )
    }
    await sleep(transcodePollIntervalMs, signal)
    const res = await getVimeoTranscodeStatus(slot.vimeo_id, signal)
    status = res.status
    attempt += 1

    emit(onProgress, {
      phase: "processing",
      percent: Math.min(99, 82 + Math.floor(attempt / 2)),
      message:
        status === "in_progress" || status === "unknown"
          ? "Processing video on Vimeo…"
          : `Processing: ${status}`,
      vimeoId: slot.vimeo_id,
    })

    if (status === "complete") break
    if (status === "error") {
      emit(onProgress, {
        phase: "error",
        percent: 0,
        message: "Vimeo failed to process this video",
        vimeoId: slot.vimeo_id,
      })
      throw new Error("Video processing failed on Vimeo")
    }
  }

  // Resolve privacy-aware embed URL (private/unlisted videos need ?h=<hash>).
  let link = slot.link
  let playerEmbedUrl = buildPlayerEmbedUrl(slot.vimeo_id, slot.link)
  try {
    const details = await getVimeoVideoDetails(slot.vimeo_id, signal)
    if (details.link) link = details.link
    playerEmbedUrl = buildPlayerEmbedUrl(
      details.vimeo_id || slot.vimeo_id,
      details.link || slot.link,
      details.embed_url,
    )
  } catch {
    // Fall back to slot link / bare player URL if metadata fetch fails.
  }

  emit(onProgress, {
    phase: "done",
    percent: 100,
    message: "Video ready",
    vimeoId: slot.vimeo_id,
  })

  return {
    vimeoId: slot.vimeo_id,
    link,
    embedUrl: playerEmbedUrl,
    playerEmbedUrl,
  }
}
