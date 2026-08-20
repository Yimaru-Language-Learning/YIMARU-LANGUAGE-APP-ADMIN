import { cn } from "../../lib/utils"
import { looksLikeHtml, stripHtml } from "../../lib/richText"

export interface RichTextContentProps {
  html?: string | null
  className?: string
  emptyLabel?: string
}

export function RichTextContent({
  html,
  className,
  emptyLabel = "—",
}: RichTextContentProps) {
  const trimmed = html?.trim() ?? ""
  if (!trimmed) {
    return <span className={cn("text-grayScale-400", className)}>{emptyLabel}</span>
  }

  if (looksLikeHtml(trimmed)) {
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none text-grayScale-700 prose-p:my-1 prose-ul:my-1 prose-ol:my-1",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    )
  }

  return <span className={className}>{stripHtml(trimmed)}</span>
}
