import { resolveDisplayMediaUrl } from "./mediaUrl"

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
  const normalized = normalizeObjectKey(value)
  if (!normalized) return ""
  return resolveDisplayMediaUrl(normalized)
}
