import * as tus from "tus-js-client"
import type { VideoUploadProgress } from "./types"

export interface TusUploadController {
  abort: () => void
  done: Promise<void>
}

export function uploadFileViaTus(
  file: File,
  uploadLink: string,
  onProgress: (
    p: Pick<VideoUploadProgress, "bytesUploaded" | "bytesTotal" | "percent" | "message">,
  ) => void,
  signal?: AbortSignal,
): TusUploadController {
  let upload: tus.Upload | null = null

  const done = new Promise<void>((resolve, reject) => {
    upload = new tus.Upload(file, {
      uploadUrl: uploadLink,
      chunkSize: 5 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type || "video/mp4",
      },
      onError: (error) => {
        if (signal?.aborted) {
          reject(new DOMException("Upload cancelled", "AbortError"))
          return
        }
        reject(error)
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const ratio = bytesTotal > 0 ? bytesUploaded / bytesTotal : 0
        const percent = Math.round(5 + ratio * 75)
        onProgress({
          bytesUploaded,
          bytesTotal,
          percent,
          message: `Uploading… ${Math.round(ratio * 100)}%`,
        })
      },
      onSuccess: () => resolve(),
    })

    if (signal) {
      signal.addEventListener("abort", () => {
        upload?.abort(true)
      })
    }

    upload.start()
  })

  return {
    abort: () => upload?.abort(true),
    done,
  }
}
