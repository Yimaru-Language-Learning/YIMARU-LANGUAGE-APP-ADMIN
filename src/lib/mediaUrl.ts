import { refreshFileUrl, resolveFileUrl } from "../api/files.api"

const HTTP_REGEX = /^https?:\/\//i

export function isHttpUrl(value: string): boolean {
  return HTTP_REGEX.test(value.trim())
}

export function isSignedMinioUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!isHttpUrl(trimmed)) return false
  try {
    const url = new URL(trimmed)
    return (
      url.host === "s3.yimaruacademy.com" &&
      (url.searchParams.has("X-Amz-Signature") || url.searchParams.has("X-Amz-Expires"))
    )
  } catch {
    return false
  }
}

export async function resolveDisplayMediaUrl(value: string): Promise<string> {
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (isHttpUrl(trimmed)) {
    if (!isSignedMinioUrl(trimmed)) return trimmed
    try {
      const refreshed = await refreshFileUrl(trimmed)
      const refreshedUrl = refreshed.data?.data?.url?.trim()
      return refreshedUrl || trimmed
    } catch {
      return trimmed
    }
  }

  const resolved = await resolveFileUrl(trimmed)
  return resolved.data?.data?.url?.trim() || ""
}
