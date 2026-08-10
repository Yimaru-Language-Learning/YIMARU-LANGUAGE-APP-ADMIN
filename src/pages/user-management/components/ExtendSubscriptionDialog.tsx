import { useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { adminApplySubscription } from "../../../api/admin-subscriptions.api"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { notifyApiError } from "../../../lib/apiErrors"
import { formatPlanCategory, formatPlanPrice } from "../../../lib/subscriptionPlans"
import { TypeToConfirmDialog } from "../../../lib/typeToConfirm"
import { cn } from "../../../lib/utils"
import type { UserSubscriptionRecord } from "../../../types/userAdmin.types"

const CONFIRM_WORD = "EXTEND"

type ExtendSubscriptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  /** Active, non-lifetime subscriptions the admin can extend. */
  subscriptions: UserSubscriptionRecord[]
  /** Preferred subscription id when opening (e.g. from a specific card). */
  initialSubscriptionId?: number | null
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

function subscriptionOptionLabel(subscription: UserSubscriptionRecord): string {
  const name = subscription.plan_name?.trim() || `Plan #${subscription.plan_id}`
  const category = subscription.plan_category
    ? ` · ${formatPlanCategory(subscription.plan_category)}`
    : ""
  return `${name}${category} (#${subscription.id})`
}

export function ExtendSubscriptionDialog({
  open,
  onOpenChange,
  userId,
  subscriptions,
  initialSubscriptionId = null,
  onExtended,
}: ExtendSubscriptionDialogProps) {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("")
  const [recordPayment, setRecordPayment] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setSaving(false)
      setConfirmOpen(false)
      setRecordPayment(true)
      setSelectedSubscriptionId("")
      return
    }

    const preferred =
      (initialSubscriptionId != null &&
        subscriptions.find((subscription) => subscription.id === initialSubscriptionId)) ||
      subscriptions[0] ||
      null
    setSelectedSubscriptionId(preferred ? String(preferred.id) : "")
    setRecordPayment(true)
    setConfirmOpen(false)
    setSaving(false)
  }, [open, initialSubscriptionId, subscriptions])

  const subscription = useMemo(
    () =>
      subscriptions.find((item) => String(item.id) === selectedSubscriptionId) ?? null,
    [subscriptions, selectedSubscriptionId],
  )

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscription) return
    setConfirmOpen(true)
  }

  const handleConfirmExtend = async () => {
    if (!subscription) return

    setSaving(true)
    try {
      const res = await adminApplySubscription(userId, {
        plan_id: subscription.plan_id,
        record_payment: recordPayment,
      })
      const expiresLabel = res.data?.expires_at
        ? formatDateTime(res.data.expires_at)
        : null
      toast.success(
        expiresLabel
          ? `Subscription extended to ${expiresLabel}`
          : res.message || "Subscription extended",
      )
      setConfirmOpen(false)
      onExtended()
      onOpenChange(false)
    } catch (err) {
      notifyApiError(err, "Failed to extend subscription")
    } finally {
      setSaving(false)
    }
  }

  const priceLabel = subscription
    ? formatPlanPrice({
        price: subscription.price,
        currency: subscription.currency || "ETB",
      })
    : "the plan price"

  const showPlanPicker = subscriptions.length > 0

  return (
    <>
      <Dialog
        open={open && subscriptions.length > 0 && !confirmOpen}
        onOpenChange={(next) => {
          if (saving) return
          if (!next) {
            setConfirmOpen(false)
            onOpenChange(false)
          }
        }}
      >
        <DialogContent className="h-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] border border-grayScale-100 p-0 sm:max-w-xl">
          <form onSubmit={handleContinue}>
            <DialogHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
                <RefreshCw className="h-5 w-5 text-brand-600" aria-hidden />
                Extend subscription
              </DialogTitle>
              <DialogDescription className="text-sm text-grayScale-500">
                Extend by one plan period. Select which active subscription to extend, then
                choose whether to record a payment at the plan price.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              {showPlanPicker ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="extend-subscription-plan"
                    className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400"
                  >
                    Active subscription <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="extend-subscription-plan"
                    className="h-11 w-full rounded-[6px] border border-input bg-grayScale-50 px-3 text-sm text-grayScale-700 shadow-sm focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                    value={selectedSubscriptionId}
                    onChange={(e) => setSelectedSubscriptionId(e.target.value)}
                  >
                    {subscriptions.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {subscriptionOptionLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {subscription ? (
                <div className="rounded-xl border border-grayScale-100 bg-grayScale-50 px-4 py-3 text-sm text-grayScale-700">
                  <p>
                    <span className="font-semibold">{subscription.plan_name}</span>
                    {subscription.plan_category
                      ? ` · ${formatPlanCategory(subscription.plan_category)}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-grayScale-500">
                    Current expiry: {formatDateTime(subscription.expires_at)}
                    {" · Plan price: "}
                    {formatPlanPrice({
                      price: subscription.price,
                      currency: subscription.currency || "ETB",
                    })}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Payment <span className="text-destructive">*</span>
                </p>
                <div
                  className="flex flex-col gap-2 sm:flex-row"
                  role="radiogroup"
                  aria-label="Payment recording"
                >
                  <label
                    className={cn(
                      "flex flex-1 cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors",
                      recordPayment
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30"
                        : "border-grayScale-200 bg-white hover:border-grayScale-300",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="extend_record_payment"
                        checked={recordPayment}
                        onChange={() => setRecordPayment(true)}
                        className="h-4 w-4 border-grayScale-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm font-semibold text-grayScale-800">
                        Record payment
                      </span>
                    </span>
                    <span className="mt-1 pl-6 text-xs text-grayScale-500">
                      Commit a SUCCESS payment of {priceLabel}.
                    </span>
                  </label>
                  <label
                    className={cn(
                      "flex flex-1 cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors",
                      !recordPayment
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30"
                        : "border-grayScale-200 bg-white hover:border-grayScale-300",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="extend_record_payment"
                        checked={!recordPayment}
                        onChange={() => setRecordPayment(false)}
                        className="h-4 w-4 border-grayScale-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm font-semibold text-grayScale-800">
                        No payment
                      </span>
                    </span>
                    <span className="mt-1 pl-6 text-xs text-grayScale-500">
                      Extend access only — no payments row or revenue.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-[6px]"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !subscription}
                className="rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
              >
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TypeToConfirmDialog
        open={confirmOpen && subscription != null}
        onOpenChange={setConfirmOpen}
        title="Are you sure?"
        description={
          subscription ? (
            <>
              Extend <strong>{subscription.plan_name}</strong> (#{subscription.id}) by one
              plan period? Current expiry:{" "}
              <strong>{formatDateTime(subscription.expires_at)}</strong>
              {subscription.plan_category
                ? ` · ${formatPlanCategory(subscription.plan_category)}`
                : ""}
              .
              {recordPayment ? (
                <>
                  {" "}
                  A payment of <strong>{priceLabel}</strong> will be recorded.
                </>
              ) : (
                " No payment will be recorded."
              )}
            </>
          ) : (
            "Extend this subscription by one plan period?"
          )
        }
        confirmWord={CONFIRM_WORD}
        confirmLabel={recordPayment ? "Extend and record payment" : "Extend without payment"}
        confirming={saving}
        onConfirm={handleConfirmExtend}
      />
    </>
  )
}
