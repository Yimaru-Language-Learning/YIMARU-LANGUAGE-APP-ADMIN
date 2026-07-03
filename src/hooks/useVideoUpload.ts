import { useCallback, useEffect, useRef, useState } from "react"
import { uploadVideoWithProgress } from "../lib/video-upload/upload-video"
import type { VideoUploadProgress, VimeoVideoResult } from "../lib/video-upload/types"
import { isVideoUploadBusy } from "../lib/video-upload/types"

const idleProgress: VideoUploadProgress = {
  phase: "idle",
  percent: 0,
  message: "",
}

export function useVideoUpload() {
  const [progress, setProgress] = useState<VideoUploadProgress>(idleProgress)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VimeoVideoResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isBusy = isVideoUploadBusy(progress.phase)

  const upload = useCallback(
    async (file: File, opts?: { title?: string; description?: string }) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      setError(null)
      setResult(null)
      setProgress({ phase: "creating", percent: 0, message: "Starting…" })

      try {
        const data = await uploadVideoWithProgress(file, {
          ...opts,
          signal: ac.signal,
          onProgress: setProgress,
        })
        setResult(data)
        return data
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setProgress({ phase: "cancelled", percent: 0, message: "Cancelled" })
          return null
        }
        const msg = e instanceof Error ? e.message : "Upload failed"
        setError(msg)
        setProgress((p) => ({ ...p, phase: "error", message: msg }))
        throw e
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const reset = useCallback(() => {
    cancel()
    setProgress(idleProgress)
    setError(null)
    setResult(null)
  }, [cancel])

  useEffect(() => {
    if (!isBusy) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isBusy])

  useEffect(() => () => cancel(), [cancel])

  return { upload, cancel, reset, progress, error, result, isBusy }
}
