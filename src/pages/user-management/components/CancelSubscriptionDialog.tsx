import { useEffect, useState } from "react"
import { toast } from "sonner"
import { adminCancelSubscription } from "../../../api/admin-subscriptions.api"
import { notifyApiError } from "../../../lib/apiErrors"
import { formatPlanCategory } from "../../../lib/subscriptionPlans"
import { TypeToConfirmDialog } from "../../../lib/typeToConfirm"
import type { UserSubscriptionRecord } from "../../../types/userAdmin.types"

const CONFIRM_WORD = "CANCEL"

type CancelSubscriptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: UserSubscriptionRecord | null
  onCancelled: () => void
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onCancelled,
}: CancelSubscriptionDialogProps) {
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!open) setCancelling(false)
  }, [open, subscription?.id])

  const handleConfirmCancel = async () => {
    if (!subscription) return
    setCancelling(true)
    try {
      const res = await adminCancelSubscription(subscription.id)
      toast.success(res.message || "Subscription cancelled")
      onCancelled()
      onOpenChange(false)
    } catch (err) {
      notifyApiError(err, "Failed to cancel subscription")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <TypeToConfirmDialog
      open={open && subscription != null}
      onOpenChange={(next) => {
        if (cancelling) return
        if (!next) onOpenChange(false)
      }}
      title="Are you sure?"
      description={
        subscription ? (
          <>
            Cancel subscription <strong>#{subscription.id}</strong> (
            {subscription.plan_name}) for this learner? They will lose access for{" "}
            <strong>{formatPlanCategory(subscription.plan_category)}</strong> immediately. Paid
            payment history is kept.
          </>
        ) : (
          "Cancel this subscription? Access ends immediately. Paid payment history is kept."
        )
      }
      confirmWord={CONFIRM_WORD}
      confirmLabel="Confirm cancel"
      cancelLabel="Keep subscription"
      confirming={cancelling}
      variant="destructive"
      onConfirm={handleConfirmCancel}
    />
  )
}
