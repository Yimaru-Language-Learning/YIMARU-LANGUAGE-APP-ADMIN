import { useEffect, useState } from "react"
import { toast } from "sonner"
import { adminApplySubscription } from "../../../api/admin-subscriptions.api"
import { notifyApiError } from "../../../lib/apiErrors"
import { formatPlanCategory } from "../../../lib/subscriptionPlans"
import { TypeToConfirmDialog } from "../../../lib/typeToConfirm"
import type { UserSubscriptionRecord } from "../../../types/userAdmin.types"

const CONFIRM_WORD = "EXTEND"

type ExtendSubscriptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  subscription: UserSubscriptionRecord | null
  onExtended: () => void
}

function formatDateTime(value?: string | null): string {
  if (!value?.trim()) return "unassigned"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "unassigned"
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ExtendSubscriptionDialog({
  open,
  onOpenChange,
  userId,
  subscription,
  onExtended,
}: ExtendSubscriptionDialogProps) {
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) setSaving(false)
  }, [open, subscription?.id])

  const handleConfirmExtend = async () => {
    if (!subscription) return

    setSaving(true)
    try {
      const res = await adminApplySubscription(userId, {
        plan_id: subscription.plan_id,
      })
      const expiresLabel = res.data?.expires_at
        ? formatDateTime(res.data.expires_at)
        : null
      toast.success(
        expiresLabel
          ? `Subscription extended to ${expiresLabel}`
          : res.message || "Subscription extended",
      )
      onExtended()
      onOpenChange(false)
    } catch (err) {
      notifyApiError(err, "Failed to extend subscription")
    } finally {
      setSaving(false)
    }
  }

  return (
    <TypeToConfirmDialog
      open={open && subscription != null}
      onOpenChange={(next) => {
        if (saving) return
        if (!next) onOpenChange(false)
      }}
      title="Are you sure?"
      description={
        subscription ? (
          <>
            Extend <strong>{subscription.plan_name}</strong> (#
            {subscription.id}) by one plan period? Current expiry:{" "}
            <strong>{formatDateTime(subscription.expires_at)}</strong>
            {subscription.plan_category
              ? ` · ${formatPlanCategory(subscription.plan_category)}`
              : ""}
            .
          </>
        ) : (
          "Extend this subscription by one plan period?"
        )
      }
      confirmWord={CONFIRM_WORD}
      confirmLabel="Extend subscription"
      confirming={saving}
      onConfirm={handleConfirmExtend}
    />
  )
}
