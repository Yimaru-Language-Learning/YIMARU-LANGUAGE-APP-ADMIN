import type { FAQ, FAQStatus } from "../types/faq.types"

export function faqStatusBadgeVariant(status: string): "success" | "secondary" {
  const normalized = status.toUpperCase()
  if (normalized === "ACTIVE") return "success"
  return "secondary"
}

export function faqStatusLabel(status: FAQStatus | string): string {
  const normalized = status.toUpperCase()
  if (normalized === "ACTIVE") return "Published"
  if (normalized === "INACTIVE") return "Draft"
  return status
}

export function formatFaqDate(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") {
    return "unassigned"
  }
  const text = String(raw)
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return text.split(" +")[0]?.trim() || text
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function deriveFaqCategories(faqs: FAQ[]): string[] {
  return [...new Set(faqs.map((f) => f.category).filter(Boolean) as string[])].sort()
}

export function suggestNextDisplayOrder(faqs: FAQ[]): number {
  if (faqs.length === 0) return 1
  const max = Math.max(...faqs.map((f) => f.display_order ?? 0))
  return max + 1
}
