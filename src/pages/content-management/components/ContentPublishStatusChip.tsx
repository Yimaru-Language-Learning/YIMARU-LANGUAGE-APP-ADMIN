import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { PracticePublishStatus } from "../../../types/course.types"
import {
  isPublishedPublishStatus,
  nextPublishStatus,
  publishStatusLabel,
} from "../../../lib/publishStatus"
import { cn } from "../../../lib/utils"
import { PublishStatusConfirmDialog } from "./PublishStatusConfirmDialog"

type ContentPublishStatusChipProps = {
  publishStatus?: string | null
  updating?: boolean
  onToggle?: (nextStatus: PracticePublishStatus) => void
  contentLabel?: string
  className?: string
}

export function ContentPublishStatusChip({
  publishStatus,
  updating = false,
  onToggle,
  contentLabel = "content",
  className,
}: ContentPublishStatusChipProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<PracticePublishStatus | null>(
    null,
  )

  const label = publishStatusLabel(publishStatus)
  const isPublished = isPublishedPublishStatus(publishStatus)
  const interactive = Boolean(onToggle) && !updating

  const body = (
    <>
      {updating ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isPublished ? "bg-[#16A34A]" : "bg-grayScale-300",
          )}
        />
      )}
      <span>{label}</span>
    </>
  )

  const chipClass = cn(
    "inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
    isPublished
      ? "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]"
      : "border-grayScale-100 bg-grayScale-50 text-grayScale-500",
    interactive && "cursor-pointer transition-colors hover:opacity-90",
    updating && "opacity-70",
    className,
  )

  const requestToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!onToggle || updating) return
    const next = nextPublishStatus(publishStatus)
    setPendingStatus(next)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!onToggle || !pendingStatus) return
    onToggle(pendingStatus)
    setConfirmOpen(false)
    setPendingStatus(null)
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
          isPublished ? "Click to save as draft" : "Click to publish"
        }
        onClick={requestToggle}
      >
        {body}
      </button>
      <PublishStatusConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setPendingStatus(null)
        }}
        nextStatus={pendingStatus}
        contentLabel={contentLabel}
        confirming={updating}
        onConfirm={handleConfirm}
      />
    </>
  )
}
