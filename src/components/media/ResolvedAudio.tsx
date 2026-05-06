import { useEffect, useState, type AudioHTMLAttributes } from "react"
import { resolveDisplayMediaUrl } from "../../lib/mediaUrl"

type ResolvedAudioProps = AudioHTMLAttributes<HTMLAudioElement> & {
  src?: string | null
}

export function ResolvedAudio({ src, ...audioProps }: ResolvedAudioProps) {
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

  if (!resolvedSrc) return null
  return <audio {...audioProps} src={resolvedSrc} />
}
