import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Gift, Search } from "lucide-react"
import { toast } from "sonner"
import { adminApplySubscription } from "../../../api/admin-subscriptions.api"
import { getSubscriptionPlans } from "../../../api/subscription-plans.api"
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
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { getApiErrorMessage, notifyApiError } from "../../../lib/apiErrors"
import {
  formatPlanCategory,
  formatPlanDuration,
  formatPlanPrice,
} from "../../../lib/subscriptionPlans"
import { TypeToConfirmDialog } from "../../../lib/typeToConfirm"
import { cn } from "../../../lib/utils"
import type { SubscriptionPlan } from "../../../types/subscription.types"

const CONFIRM_WORD = "GRANT"

type GrantSubscriptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  userName?: string
  activeByCategory: Record<string, boolean>
  onGranted: () => void
}

function planLabel(plan: SubscriptionPlan): string {
  return `${plan.name} · ${formatPlanCategory(plan.category)} · ${formatPlanDuration(plan)} · ${formatPlanPrice(plan)}`
}

export function GrantSubscriptionDialog({
  open,
  onOpenChange,
  userId,
  userName,
  activeByCategory,
  onGranted,
}: GrantSubscriptionDialogProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [planId, setPlanId] = useState("")
  const [planSearch, setPlanSearch] = useState("")
  const [planMenuOpen, setPlanMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPlanId("")
    setPlanSearch("")
    setPlanMenuOpen(false)
    setConfirmOpen(false)
    setFormError(null)
    setSaving(false)

    const loadPlans = async () => {
      setPlansLoading(true)
      try {
        const res = await getSubscriptionPlans()
        setPlans(res.data.filter((plan) => plan.is_active))
      } catch (err) {
        setPlans([])
        notifyApiError(err, "Failed to load subscription plans")
      } finally {
        setPlansLoading(false)
      }
    }
    void loadPlans()
  }, [open])

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === planId) ?? null,
    [plans, planId],
  )

  const categoryBlocked =
    selectedPlan != null && activeByCategory[selectedPlan.category] === true

  const filteredPlans = useMemo(() => {
    const q = planSearch.trim().toLowerCase()
    if (!q) return plans
    return plans.filter((plan) => {
      const haystack = [
        plan.name,
        plan.category,
        formatPlanCategory(plan.category),
        formatPlanDuration(plan),
        formatPlanPrice(plan),
        plan.description ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [plans, planSearch])

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const id = Number(planId)
    if (!Number.isFinite(id) || id < 1) {
      setFormError("Select a subscription plan.")
      return
    }
    if (categoryBlocked) {
      setFormError(
        "This learner already has an active subscription in that category. Extend the existing plan or cancel it first.",
      )
      return
    }
    setPlanMenuOpen(false)
    setConfirmOpen(true)
  }

  const handleConfirmGrant = async () => {
    const id = Number(planId)
    if (!Number.isFinite(id) || id < 1 || categoryBlocked) return

    setSaving(true)
    try {
      const res = await adminApplySubscription(userId, { plan_id: id })
      toast.success(res.message || "Subscription granted")
      setConfirmOpen(false)
      onGranted()
      onOpenChange(false)
    } catch (err) {
      const detail = getApiErrorMessage(err, "Failed to grant subscription")
      setFormError(detail)
      setConfirmOpen(false)
      notifyApiError(err, "Failed to grant subscription")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog
        open={open && !confirmOpen}
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
                <Gift className="h-5 w-5 text-brand-600" aria-hidden />
                Mark as paid
              </DialogTitle>
              <DialogDescription className="text-sm text-grayScale-500">
                Grant plan access
                {userName ? ` to ${userName}` : ""}. A payment is recorded at the
                plan price.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Plan <span className="text-destructive">*</span>
                </label>
                {plansLoading ? (
                  <div className="flex items-center gap-2 text-sm text-grayScale-500">
                    <SpinnerIcon className="h-4 w-4" />
                    Loading plans…
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-between rounded-[6px] border border-input bg-grayScale-50 px-3 text-left text-sm text-grayScale-700 shadow-sm transition hover:bg-grayScale-100 focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
                      onClick={() => {
                        setPlanMenuOpen((prev) => !prev)
                        if (planMenuOpen) setPlanSearch("")
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={planMenuOpen}
                    >
                      <span className={cn("truncate", !selectedPlan && "text-grayScale-400")}>
                        {selectedPlan ? planLabel(selectedPlan) : "Select a plan…"}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-grayScale-400 transition-transform",
                          planMenuOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {planMenuOpen ? (
                      <div className="rounded-[8px] border border-grayScale-200 bg-white p-2 shadow-sm">
                        <div className="relative mb-2">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grayScale-300" />
                          <Input
                            value={planSearch}
                            onChange={(e) => setPlanSearch(e.target.value)}
                            placeholder="Search plans…"
                            className="h-9 rounded-lg border-grayScale-200 pl-8 text-sm"
                            autoFocus
                          />
                        </div>
                        <div
                          className="max-h-[min(16rem,40vh)] space-y-1 overflow-y-auto"
                          role="listbox"
                        >
                          {filteredPlans.map((plan) => {
                            const blocked = activeByCategory[plan.category] === true
                            const selected = String(plan.id) === planId
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={blocked}
                                className={cn(
                                  "w-full rounded-md px-2 py-2 text-left text-sm transition",
                                  blocked && "cursor-not-allowed opacity-50",
                                  selected
                                    ? "bg-brand-100/50 text-brand-700"
                                    : "text-grayScale-600 hover:bg-grayScale-100",
                                )}
                                onClick={() => {
                                  if (blocked) return
                                  setPlanId(String(plan.id))
                                  setPlanMenuOpen(false)
                                  setPlanSearch("")
                                  setFormError(null)
                                }}
                              >
                                <span className="block font-medium">{plan.name}</span>
                                <span className="block text-xs text-grayScale-400">
                                  {formatPlanCategory(plan.category)} · {formatPlanDuration(plan)} ·{" "}
                                  {formatPlanPrice(plan)}
                                  {blocked ? " — category active" : ""}
                                </span>
                              </button>
                            )
                          })}
                          {filteredPlans.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-grayScale-400">
                              No plans found
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
                {selectedPlan && categoryBlocked ? (
                  <p className="text-xs text-amber-700">
                    An active {formatPlanCategory(selectedPlan.category)} subscription already
                    exists. Extend or cancel it instead.
                  </p>
                ) : selectedPlan ? (
                  <p className="text-xs text-grayScale-500">
                    Payment recorded: {formatPlanPrice(selectedPlan)}.
                  </p>
                ) : null}
              </div>

              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
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
                disabled={saving || plansLoading || !planId || categoryBlocked}
                className="rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
              >
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TypeToConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Are you sure?"
        description={
          selectedPlan ? (
            <>
              Grant <strong>{selectedPlan.name}</strong> (
              {formatPlanCategory(selectedPlan.category)})
              {userName ? (
                <>
                  {" "}
                  to <strong>{userName}</strong>
                </>
              ) : (
                " to this learner"
              )}
              ? A payment of <strong>{formatPlanPrice(selectedPlan)}</strong> will be
              recorded.
            </>
          ) : (
            "Grant this subscription?"
          )
        }
        confirmWord={CONFIRM_WORD}
        confirmLabel="Mark as paid"
        confirming={saving}
        onConfirm={handleConfirmGrant}
      />
    </>
  )
}
