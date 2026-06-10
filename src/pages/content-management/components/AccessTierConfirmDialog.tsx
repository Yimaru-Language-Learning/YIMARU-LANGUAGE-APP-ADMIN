import type { ContentAccessTier } from "../../../types/course.types"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"

export function accessTierConfirmTitle(
  nextTier: ContentAccessTier,
  contentLabel = "content",
): string {
  if (nextTier === "PREMIUM") {
    return `Set this ${contentLabel} to Premium?`
  }
  return `Set this ${contentLabel} to Free?`
}

export function accessTierConfirmDescription(
  nextTier: ContentAccessTier,
  contentLabel = "content",
): string {
  if (nextTier === "PREMIUM") {
    return `Learners will need a premium subscription to access this ${contentLabel}.`
  }
  return `This ${contentLabel} will be available to all learners at no extra cost.`
}

type AccessTierConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextTier: ContentAccessTier | null
  contentLabel?: string
  onConfirm: () => void
  confirming?: boolean
}

export function AccessTierConfirmDialog({
  open,
  onOpenChange,
  nextTier,
  contentLabel = "content",
  onConfirm,
  confirming = false,
}: AccessTierConfirmDialogProps) {
  if (!nextTier) return null

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
            {accessTierConfirmTitle(nextTier, contentLabel)}
          </DialogTitle>
          <DialogDescription>
            {accessTierConfirmDescription(nextTier, contentLabel)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
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
              nextTier === "PREMIUM"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-sky-600 hover:bg-sky-700"
            }
            onClick={onConfirm}
          >
            {confirming
              ? "Updating…"
              : nextTier === "PREMIUM"
                ? "Set Premium"
                : "Set Free"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
