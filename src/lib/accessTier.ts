import type { ContentAccessTier } from "../types/course.types"

export function normalizeAccessTier(
  raw?: string | null,
): ContentAccessTier | null {
  if (raw === "FREE" || raw === "PREMIUM") return raw
  if (typeof raw === "string") {
    const upper = raw.trim().toUpperCase()
    if (upper === "FREE" || upper === "PREMIUM") {
      return upper as ContentAccessTier
    }
  }
  return null
}

export function isPremiumAccessTier(raw?: string | null): boolean {
  return normalizeAccessTier(raw) === "PREMIUM"
}

export function accessTierLabel(raw?: string | null): string {
  return normalizeAccessTier(raw) ?? "FREE"
}

export function nextAccessTier(
  current?: string | null,
): ContentAccessTier {
  return isPremiumAccessTier(current) ? "FREE" : "PREMIUM"
}
