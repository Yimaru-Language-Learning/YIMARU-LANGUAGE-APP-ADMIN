import { resolveFileUrl } from "../api/files.api"

export function normalizeObjectKey(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  const protocolMatch = trimmed.match(/^[a-z]+:\/\//i)
  if (protocolMatch) {
    return trimmed.replace(/^[a-z]+:\/\//i, "")
  }
  return trimmed
}

export async function resolveMediaPreviewUrl(value: string): Promise<string> {
  if (!value.trim()) return ""
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  const key = normalizeObjectKey(value)
  if (!key) return ""
  const res = await resolveFileUrl(key)
  return res.data?.data?.url ?? ""
}
