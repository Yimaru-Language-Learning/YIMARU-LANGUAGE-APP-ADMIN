import { notifyApiError } from "../../../lib/apiErrors"
import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { updateSubscriptionPlan } from "../../../api/subscription-plans.api"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Select } from "../../../components/ui/select"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { Textarea } from "../../../components/ui/textarea"
import { ToggleSwitch } from "../../../components/ui/toggle-switch"
import { cn } from "../../../lib/utils"
import {
  formatPlanCategory,
  SUBSCRIPTION_CURRENCIES,
  SUBSCRIPTION_DURATION_UNITS,
} from "../../../lib/subscriptionPlans"
import type {
  SubscriptionPlan,
  SubscriptionPlanDurationUnit,
  UpdateSubscriptionPlanPayload,
} from "../../../types/subscription.types"

interface EditDraft {
  name: string
  description: string
  duration_value: string
  duration_unit: SubscriptionPlanDurationUnit
  price: string
  currency: string
  is_active: boolean
}

function planToDraft(plan: SubscriptionPlan): EditDraft {
  return {
    name: plan.name,
    description: plan.description,
    duration_value: String(plan.duration_value),
    duration_unit: plan.duration_unit,
    price: String(plan.price),
    currency: plan.currency,
    is_active: plan.is_active,
  }
}

function draftToPayload(draft: EditDraft): UpdateSubscriptionPlanPayload | null {
  const name = draft.name.trim()
  const description = draft.description.trim()
  const duration_value = Number(draft.duration_value)
  const price = Number(draft.price)

  if (!name) return null
  if (!description) return null
  if (!Number.isFinite(duration_value) || duration_value < 1) return null
  if (!Number.isFinite(price) || price < 0) return null

  return {
    name,
    description,
    duration_value,
    duration_unit: draft.duration_unit,
    price,
    currency: draft.currency,
    is_active: draft.is_active,
  }
}

function mergePlanWithPayload(
  plan: SubscriptionPlan,
  payload: UpdateSubscriptionPlanPayload,
): SubscriptionPlan {
  return { ...plan, ...payload }
}

type EditSubscriptionPlanDialogProps = {
  plan: SubscriptionPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (plan: SubscriptionPlan) => void
}

export function EditSubscriptionPlanDialog({
  plan,
  open,
  onOpenChange,
  onUpdated,
}: EditSubscriptionPlanDialogProps) {
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && plan) {
      setDraft(planToDraft(plan))
      setSaving(false)
    }
    if (!open) {
      setDraft(null)
      setSaving(false)
    }
  }, [open, plan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan || !draft) return

    const payload = draftToPayload(draft)
    if (!payload) {
      toast.error("Please fill in all required fields with valid values.")
      return
    }

    setSaving(true)
    try {
      const res = await updateSubscriptionPlan(plan.id, payload)
      const updated = res.data ?? mergePlanWithPayload(plan, payload)
      toast.success(res.message || "Subscription plan updated successfully")
      onUpdated({
        ...updated,
        category: updated.category || plan.category,
        created_at: updated.created_at || plan.created_at,
      })
      onOpenChange(false)
    } catch (err) {
      notifyApiError(err, "Failed to update subscription plan.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[12px] border border-grayScale-100 p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-grayScale-100 px-4 py-4 pr-14 sm:px-6">
            <DialogTitle className="text-lg font-bold text-grayScale-900">
              Edit subscription package
            </DialogTitle>
            <DialogDescription className="text-sm text-grayScale-500">
              Update pricing, duration, and visibility for this plan.
            </DialogDescription>
          </DialogHeader>

          {draft && plan ? (
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center justify-between gap-3 rounded-[8px] border border-grayScale-100 bg-grayScale-50/50 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Category
                  </p>
                  <p className="mt-0.5 text-xs text-grayScale-500">
                    Category cannot be changed after creation
                  </p>
                </div>
                <Badge variant="secondary">{formatPlanCategory(plan.category)}</Badge>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Package name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
                  className="rounded-[6px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => d && { ...d, description: e.target.value })}
                  className="min-h-[88px] rounded-[6px]"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Duration <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.duration_value}
                    onChange={(e) =>
                      setDraft((d) => d && { ...d, duration_value: e.target.value })
                    }
                    className="rounded-[6px]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Duration unit
                  </label>
                  <Select
                    value={draft.duration_unit}
                    onChange={(e) =>
                      setDraft((d) =>
                        d
                          ? {
                              ...d,
                              duration_unit: e.target.value as SubscriptionPlanDurationUnit,
                            }
                          : d,
                      )
                    }
                    className="rounded-[6px]"
                  >
                    {SUBSCRIPTION_DURATION_UNITS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Price <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.price}
                    onChange={(e) => setDraft((d) => d && { ...d, price: e.target.value })}
                    className="rounded-[6px]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Currency
                  </label>
                  <Select
                    value={draft.currency}
                    onChange={(e) => setDraft((d) => d && { ...d, currency: e.target.value })}
                    className="rounded-[6px]"
                  >
                    {SUBSCRIPTION_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[8px] border border-grayScale-100 bg-grayScale-50/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-grayScale-800">Active package</p>
                  <p className="text-xs text-grayScale-500">
                    Inactive plans stay in the catalog but are hidden from checkout
                  </p>
                </div>
                <ToggleSwitch
                  variant="plain"
                  checked={draft.is_active}
                  aria-label="Active package"
                  onCheckedChange={() => setDraft((d) => d && { ...d, is_active: !d.is_active })}
                />
              </label>
            </div>
          ) : null}

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
              disabled={saving || !draft}
              className="rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
            >
              {saving ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
