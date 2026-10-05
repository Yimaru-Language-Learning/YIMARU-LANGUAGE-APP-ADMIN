/** Match text regardless of casing or whitespace, while keeping punctuation literal. */
export function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/\s+/gu, "")
}

export type SearchSegment = { text: string; match: boolean }

/** Highlight normalized matches without changing the original display text. */
export function segmentWhitespaceInsensitiveSearch(
  text: string,
  query: string,
): SearchSegment[] {
  const needle = normalizeSearchText(query)
  if (!needle) return [{ text, match: false }]

  const pattern = Array.from(needle)
    .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*")
  const splitter = new RegExp(`(${pattern})`, "giu")
  const matcher = new RegExp(`^(?:${pattern})$`, "iu")
  return text.split(splitter).filter(Boolean).map((part) => ({
    text: part,
    match: matcher.test(part),
  }))
}
