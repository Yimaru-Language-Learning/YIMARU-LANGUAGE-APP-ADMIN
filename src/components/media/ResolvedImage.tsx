import { useEffect, useState, type ImgHTMLAttributes } from "react"
import { resolveDisplayMediaUrl } from "../../lib/mediaUrl"

type ResolvedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null
  fallbackSrc?: string
}

export function ResolvedImage({ src, fallbackSrc, ...imgProps }: ResolvedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = (src ?? "").trim()
      if (!raw) {
        setResolvedSrc("")
        return
      }
      try {
        const next = await resolveDisplayMediaUrl(raw)
        if (!cancelled) setResolvedSrc(next || raw)
      } catch {
        if (!cancelled) setResolvedSrc(raw)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [src])

  const finalSrc = resolvedSrc || fallbackSrc || ""
  if (!finalSrc) return null
  return <img {...imgProps} src={finalSrc} />
}
