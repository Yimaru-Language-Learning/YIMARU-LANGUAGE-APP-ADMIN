import { useState } from "react"
import { Crown, Loader2, Sparkles } from "lucide-react"
import type { ContentAccessTier } from "../../../types/course.types"
import {
  accessTierLabel,
  isPremiumAccessTier,
  nextAccessTier,
} from "../../../lib/accessTier"
import { cn } from "../../../lib/utils"
import { AccessTierConfirmDialog } from "./AccessTierConfirmDialog"

type ContentAccessTierChipProps = {
  accessTier?: string | null
  updating?: boolean
  onToggle?: (nextTier: ContentAccessTier) => void
  contentLabel?: string
  className?: string
}

export function ContentAccessTierChip({
  accessTier,
  updating = false,
  onToggle,
  contentLabel = "content",
  className,
}: ContentAccessTierChipProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTier, setPendingTier] = useState<ContentAccessTier | null>(null)

  const label = accessTierLabel(accessTier)
  const isPremium = isPremiumAccessTier(accessTier)
  const interactive = Boolean(onToggle) && !updating

  const body = (
    <>
      {updating ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : isPremium ? (
        <Crown className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
      )}
      <span>{label}</span>
    </>
  )

  const chipClass = cn(
    "inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
    isPremium
      ? "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-800 shadow-sm shadow-amber-100"
      : "border-sky-200 bg-gradient-to-r from-sky-50 to-sky-100/60 text-sky-700",
    interactive && "cursor-pointer transition-all hover:brightness-[0.98]",
    updating && "opacity-70",
    className,
  )

  const requestToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!onToggle || updating) return
    const next = nextAccessTier(accessTier)
    setPendingTier(next)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!onToggle || !pendingTier) return
    onToggle(pendingTier)
    setConfirmOpen(false)
    setPendingTier(null)
  }

  if (!onToggle) {
    return <span className={chipClass}>{body}</span>
  }

  return (
    <>
      <button
        type="button"
        className={chipClass}
        disabled={updating}
        title={
          isPremium
            ? "Click to set as Free"
            : "Click to set as Premium"
        }
        onClick={requestToggle}
      >
        {body}
      </button>
      <AccessTierConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setPendingTier(null)
        }}
        nextTier={pendingTier}
        contentLabel={contentLabel}
        confirming={updating}
        onConfirm={handleConfirm}
      />
    </>
  )
}
