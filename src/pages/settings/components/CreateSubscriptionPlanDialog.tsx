import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createSubscriptionPlan } from "../../../api/subscription-plans.api"
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
  SUBSCRIPTION_CURRENCIES,
  SUBSCRIPTION_DURATION_UNITS,
  SUBSCRIPTION_PLAN_CATEGORIES,
} from "../../../lib/subscriptionPlans"
import type {
  CreateSubscriptionPlanPayload,
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanDurationUnit,
} from "../../../types/subscription.types"

export interface CreateSubscriptionPlanDraft {
  name: string
  description: string
  category: SubscriptionPlanCategory
  duration_value: string
  duration_unit: SubscriptionPlanDurationUnit
  price: string
  currency: string
  is_active: boolean
}

export const EMPTY_SUBSCRIPTION_PLAN_DRAFT: CreateSubscriptionPlanDraft = {
  name: "",
  description: "",
  category: "LEARN_ENGLISH",
  duration_value: "1",
  duration_unit: "MONTH",
  price: "",
  currency: "ETB",
  is_active: true,
}

function draftToPayload(draft: CreateSubscriptionPlanDraft): CreateSubscriptionPlanPayload | null {
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
    category: draft.category,
    duration_value,
    duration_unit: draft.duration_unit,
    price,
    currency: draft.currency,
    is_active: draft.is_active,
  }
}

type CreateSubscriptionPlanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (plan: SubscriptionPlan) => void
}

export function CreateSubscriptionPlanDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSubscriptionPlanDialogProps) {
  const [draft, setDraft] = useState<CreateSubscriptionPlanDraft>(EMPTY_SUBSCRIPTION_PLAN_DRAFT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_SUBSCRIPTION_PLAN_DRAFT)
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = draftToPayload(draft)
    if (!payload) {
      toast.error("Please fill in all required fields with valid values.")
      return
    }

    setSaving(true)
    try {
      const res = await createSubscriptionPlan(payload)
      if (!res.data) {
        toast.error("Plan was created but the response could not be read.")
        return
      }
      toast.success(res.message || "Subscription plan created successfully")
      onCreated(res.data)
      onOpenChange(false)
    } catch {
      toast.error("Failed to create subscription plan.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[12px] border border-grayScale-100 p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
            <DialogTitle className="text-lg font-bold text-grayScale-900">
              New subscription package
            </DialogTitle>
            <DialogDescription className="text-sm text-grayScale-500">
              Add a new subscription package for learners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Package name <span className="text-destructive">*</span>
              </label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Monthly Premium"
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
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What learners get with this package"
                className="min-h-[88px] rounded-[6px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Category
              </label>
              <Select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, category: e.target.value as SubscriptionPlanCategory }))
                }
                className="rounded-[6px]"
              >
                {SUBSCRIPTION_PLAN_CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
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
                  onChange={(e) => setDraft((d) => ({ ...d, duration_value: e.target.value }))}
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
                    setDraft((d) => ({
                      ...d,
                      duration_unit: e.target.value as SubscriptionPlanDurationUnit,
                    }))
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
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  placeholder="5.00"
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
                  onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
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
                onCheckedChange={() => setDraft((d) => ({ ...d, is_active: !d.is_active }))}
              />
            </label>
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
              disabled={saving}
              className="rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
            >
              {saving ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {saving ? "Creating…" : "Create package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
