import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../../lib/apiErrors"
import { deleteSubscriptionPlan } from "../../../api/subscription-plans.api"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { formatPlanPrice } from "../../../lib/subscriptionPlans"
import type { SubscriptionPlan } from "../../../types/subscription.types"

type DeleteSubscriptionPlanDialogProps = {
  plan: SubscriptionPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (id: number) => void
}

export function DeleteSubscriptionPlanDialog({
  plan,
  open,
  onOpenChange,
  onDeleted,
}: DeleteSubscriptionPlanDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next && !deleting) onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!plan) return

    setDeleting(true)
    try {
      const res = await deleteSubscriptionPlan(plan.id)
      toast.success(res.message || "Subscription plan deleted successfully")
      onDeleted(plan.id)
      onOpenChange(false)
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to delete subscription plan")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-[12px] border border-grayScale-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Trash2 className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            Delete subscription package?
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            This permanently removes the package from the catalog. Learners will no longer be
            able to purchase it. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {plan ? (
          <div className="space-y-1 rounded-[8px] border border-grayScale-100 bg-grayScale-50 px-4 py-3">
            <p className="text-sm font-semibold text-grayScale-900">{plan.name}</p>
            <p className="text-xs text-grayScale-500">
              #{plan.id} · {formatPlanPrice(plan)}
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
          <Button
            variant="outline"
            className="rounded-[6px]"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-[6px]"
            disabled={deleting || !plan}
            onClick={() => void handleConfirm()}
          >
            {deleting ? "Deleting…" : "Delete package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
