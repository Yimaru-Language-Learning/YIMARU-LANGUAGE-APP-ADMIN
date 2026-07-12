import type { PracticePublishStatus } from "../../../types/course.types"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"

export function publishStatusConfirmTitle(
  nextStatus: PracticePublishStatus,
  contentLabel = "content",
): string {
  if (nextStatus === "PUBLISHED") {
    return `Publish this ${contentLabel}?`
  }
  return `Save this ${contentLabel} as draft?`
}

export function publishStatusConfirmDescription(
  nextStatus: PracticePublishStatus,
  contentLabel = "content",
): string {
  if (nextStatus === "PUBLISHED") {
    return `This ${contentLabel} will be visible to learners once published.`
  }
  return `This ${contentLabel} will be hidden from learners while saved as a draft.`
}

type PublishStatusConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextStatus: PracticePublishStatus | null
  contentLabel?: string
  onConfirm: () => void
  confirming?: boolean
}

export function PublishStatusConfirmDialog({
  open,
  onOpenChange,
  nextStatus,
  contentLabel = "content",
  onConfirm,
  confirming = false,
}: PublishStatusConfirmDialogProps) {
  if (!nextStatus) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!confirming) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {publishStatusConfirmTitle(nextStatus, contentLabel)}
          </DialogTitle>
          <DialogDescription>
            {publishStatusConfirmDescription(nextStatus, contentLabel)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={confirming}
            className={
              nextStatus === "PUBLISHED"
                ? "bg-brand-500 hover:bg-brand-600"
                : undefined
            }
            onClick={onConfirm}
          >
            {confirming
              ? "Updating…"
              : nextStatus === "PUBLISHED"
                ? "Publish"
                : "Save as draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
