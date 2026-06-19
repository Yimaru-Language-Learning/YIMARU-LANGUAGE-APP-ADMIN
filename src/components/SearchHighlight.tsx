import { Fragment, useMemo } from "react"
import { cn } from "../lib/utils"

export function getSearchTokens(query: string): string[] {
  return query.trim().split(/\s+/).filter(Boolean)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

type Segment = { text: string; match: boolean }

function segmentByTokens(text: string, tokens: string[]): Segment[] {
  if (tokens.length === 0) return [{ text, match: false }]

  const pattern = [...tokens]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|")
  const regex = new RegExp(`(${pattern})`, "gi")
  const parts = text.split(regex).filter((part) => part.length > 0)
  if (parts.length <= 1) return [{ text, match: false }]

  const lowerTokens = new Set(tokens.map((token) => token.toLowerCase()))
  return parts.map((part) => ({
    text: part,
    match: lowerTokens.has(part.toLowerCase()),
  }))
}

interface SearchHighlightProps {
  text: string
  query: string
  className?: string
  highlightClassName?: string
}

export function SearchHighlight({
  text,
  query,
  className,
  highlightClassName = "rounded-sm bg-amber-200/90 px-0.5 font-inherit text-inherit",
}: SearchHighlightProps) {
  const segments = useMemo(
    () => segmentByTokens(text, getSearchTokens(query)),
    [text, query],
  )

  if (!query.trim()) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className={cn(highlightClassName)}>
            {segment.text}
          </mark>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </span>
  )
}
