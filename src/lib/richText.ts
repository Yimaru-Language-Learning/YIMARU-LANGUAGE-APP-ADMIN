export function stripHtml(html: string): string {
  if (!html.trim()) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim()
}

export function hasRichTextContent(html: string | undefined | null): boolean {
  return stripHtml(html ?? "").length > 0
}

export function richTextPlainLength(html: string | undefined | null): number {
  return stripHtml(html ?? "").length
}

export function looksLikeHtml(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? ""
  return /<[^>]+>/.test(trimmed)
}
