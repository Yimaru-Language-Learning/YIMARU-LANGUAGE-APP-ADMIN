import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "../../../lib/utils"

const PLACEHOLDER_VALUES = new Set(["unassigned", "—", "-", "Not assigned", "Loading…", "Loading..."])

type ContentPageDescriptionProps = {
  children: ReactNode
  className?: string
  collapsedLines?: 2 | 3
}

function getTextContent(children: ReactNode): string {
  if (typeof children === "string") return children.trim()
  if (typeof children === "number") return String(children).trim()
  return ""
}

export function ContentPageDescription({
  children,
  className,
  collapsedLines = 2,
}: ContentPageDescriptionProps) {
  const text = getTextContent(children)
  const isPlaceholder = !text || PLACEHOLDER_VALUES.has(text)
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    setExpanded(false)
  }, [text])

  useEffect(() => {
    if (isPlaceholder || expanded) return

    const el = ref.current
    if (!el) return

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1)
    }

    checkTruncation()

    const observer = new ResizeObserver(checkTruncation)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, expanded, isPlaceholder, collapsedLines])

  if (!isPlaceholder && typeof children !== "string" && typeof children !== "number") {
    return <div className={cn("max-w-2xl", className)}>{children}</div>
  }

  const lineClampClass = collapsedLines === 3 ? "line-clamp-3" : "line-clamp-2"

  return (
    <div className="max-w-2xl">
      <p
        ref={ref}
        className={cn(
          "leading-relaxed",
          !expanded && !isPlaceholder && lineClampClass,
          className,
        )}
      >
        {children}
      </p>
      {!isPlaceholder && (isTruncated || expanded) ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  )
}
