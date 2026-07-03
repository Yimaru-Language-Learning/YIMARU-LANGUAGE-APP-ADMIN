import axios from "axios"
import { toast } from "sonner"

const API_ERROR_NOTIFIED = "__apiErrorNotified"

export function readApiResponseMessage(data: unknown): string {
  if (typeof data === "string") return data.trim()
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim()
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim()
    }
  }
  return ""
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = readApiResponseMessage(error.response?.data)
    if (message) return message
  }
  return fallback
}

export function markApiErrorNotified(error: unknown): void {
  if (error && typeof error === "object") {
    ;(error as Record<string, unknown>)[API_ERROR_NOTIFIED] = true
  }
}

export function wasApiErrorNotified(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && (error as Record<string, unknown>)[API_ERROR_NOTIFIED],
  )
}

/** Show API `message`/`error` from failed requests, or a fallback when absent. */
export function notifyApiError(error: unknown, fallback: string): void {
  if (wasApiErrorNotified(error)) return
  toast.error(getApiErrorMessage(error, fallback))
  markApiErrorNotified(error)
}
