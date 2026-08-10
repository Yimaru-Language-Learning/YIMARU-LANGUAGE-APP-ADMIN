import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react"
import { getSubscriptionPlans } from "../../../api/subscription-plans.api"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import { useTeamPermissions } from "../../../hooks/useTeamPermissions"
import { DisplayValue, NOT_ASSIGNED_LABEL } from "../../../lib/displayValue"
import {
  formatAdminPaymentMethod,
  hasSubscriptionAdminPermission,
  isLearnerRole,
  SUBSCRIPTION_ADMIN_PERMISSIONS,
} from "../../../lib/subscriptionAdminPermissions"
import { formatPlanCategory, isLifetimeExpiry } from "../../../lib/subscriptionPlans"
import { cn } from "../../../lib/utils"
import type { SubscriptionPlan } from "../../../types/subscription.types"
import type { UserSubscriptionRecord, UserSubscriptionsData } from "../../../types/userAdmin.types"
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog"
import { ExtendSubscriptionDialog } from "./ExtendSubscriptionDialog"
import { GrantSubscriptionDialog } from "./GrantSubscriptionDialog"

function isLifetimeSubscription(subscription: UserSubscriptionRecord): boolean {
  return subscription.is_lifetime === true || isLifetimeExpiry(subscription.expires_at)
}

function formatPlanTitle(subscription: UserSubscriptionRecord): string {
  const name = subscription.plan_name?.trim()
  if (name) return name
  if (isLifetimeSubscription(subscription)) return "One-time"
  if (subscription.duration_value && subscription.duration_unit) {
    const unit = subscription.duration_unit.toLowerCase().replace(/s$/, "")
    const plural = subscription.duration_value === 1 ? unit : `${unit}s`
    return `${subscription.duration_value}-${plural.charAt(0).toUpperCase()}${plural.slice(1)}`
  }
  return NOT_ASSIGNED_LABEL
}

function formatExpiryDate(subscription: UserSubscriptionRecord): string {
  if (isLifetimeSubscription(subscription)) return "Never expires"
  const value = subscription.expires_at
  if (!value?.trim()) return NOT_ASSIGNED_LABEL
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return NOT_ASSIGNED_LABEL
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(value?: string | null): string {
  if (!value?.trim()) return NOT_ASSIGNED_LABEL
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return NOT_ASSIGNED_LABEL
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDaysLeft(subscription: UserSubscriptionRecord): number | null {
  if (isLifetimeSubscription(subscription)) return null
  const expiresAt = subscription.expires_at
  if (!expiresAt?.trim()) return null
  const expires = new Date(expiresAt)
  if (Number.isNaN(expires.getTime())) return null
  const ms = expires.getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

function canExtendSubscription(subscription: UserSubscriptionRecord): boolean {
  return !isLifetimeSubscription(subscription)
}

function formatDaysLeftLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "Expired"
  if (daysLeft === 1) return "1 day left"
  return `${daysLeft} days left`
}

function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return NOT_ASSIGNED_LABEL
  const code = currency.trim() || "ETB"
  return `${amount.toLocaleString()} ${code}`
}

function formatStatusLabel(status: string): string {
  const value = status.trim()
  if (!value) return NOT_ASSIGNED_LABEL
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function ActiveStatusBadge({
  label,
  tone,
}: {
  label: string
  tone: "active" | "pending" | "inactive"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "active" && "bg-emerald-50 text-emerald-700",
        tone === "pending" && "bg-amber-50 text-amber-700",
        tone === "inactive" && "bg-grayScale-100 text-grayScale-600",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "active" && "bg-emerald-500",
          tone === "pending" && "bg-amber-500",
          tone === "inactive" && "bg-grayScale-400",
        )}
      />
      {label}
    </span>
  )
}

function ActiveSubscriptionsCard({
  subscriptions,
  canExtend,
  canGrant,
  canCancel,
  grantEnabled,
  extendEnabled,
  onExtend,
  onGrant,
  onCancel,
}: {
  subscriptions: UserSubscriptionRecord[]
  canExtend: boolean
  canGrant: boolean
  canCancel: boolean
  grantEnabled: boolean
  extendEnabled: boolean
  onExtend: () => void
  onGrant: () => void
  onCancel: (subscription: UserSubscriptionRecord) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const anyActive = subscriptions.some(
    (subscription) =>
      subscription.is_currently_active || subscription.status.toUpperCase() === "ACTIVE",
  )

  return (
    <div className="rounded-2xl border border-grayScale-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left sm:px-6 sm:py-5"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-grayScale-900">Subscriptions</h3>
          <p className="mt-0.5 text-xs text-grayScale-500">
            {subscriptions.length} active plan{subscriptions.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ActiveStatusBadge
            label={anyActive ? "Active" : formatStatusLabel(subscriptions[0]?.status || "Inactive")}
            tone={anyActive ? "active" : "inactive"}
          />
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-grayScale-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-grayScale-400" />
          )}
        </div>
      </button>

      {expanded ? (
        <div className="space-y-6 border-t border-grayScale-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="space-y-3">
            {subscriptions.map((subscription) => {
              const daysLeft = getDaysLeft(subscription)
              const statusUpper = subscription.status.toUpperCase()
              const isActive =
                subscription.is_currently_active || statusUpper === "ACTIVE"
              const cancelEnabled =
                canCancel && isActive && statusUpper !== "CANCELLED"

              return (
                <div
                  key={subscription.id}
                  className="rounded-xl border border-grayScale-100 bg-grayScale-50/70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-grayScale-900">
                        {formatPlanTitle(subscription)}
                      </p>
                      <p className="mt-0.5 text-xs text-grayScale-500">
                        {formatPlanCategory(subscription.plan_category)} · Expires{" "}
                        {formatExpiryDate(subscription)}
                        {daysLeft != null ? ` · ${formatDaysLeftLabel(daysLeft)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ActiveStatusBadge
                        label={formatStatusLabel(subscription.status)}
                        tone={
                          isActive
                            ? "active"
                            : statusUpper === "PENDING"
                              ? "pending"
                              : "inactive"
                        }
                      />
                      {canCancel ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs text-destructive disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!cancelEnabled}
                          title={
                            !cancelEnabled
                              ? "Cancel is only available when this subscription is active."
                              : undefined
                          }
                          onClick={() => onCancel(subscription)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            {canExtend ? (
              <Button
                type="button"
                className="h-10 w-full rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!extendEnabled}
                title={
                  !extendEnabled
                    ? "Extend is only available when this learner has an active, non-lifetime subscription."
                    : undefined
                }
                onClick={onExtend}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Extend Subscription
              </Button>
            ) : null}

            {canGrant ? (
              <Button
                type="button"
                className="h-10 w-full rounded-xl bg-grayScale-100 text-sm font-semibold text-grayScale-700 hover:bg-grayScale-200 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!grantEnabled}
                title={
                  !grantEnabled
                    ? "Grant is unavailable because every plan category already has an active subscription."
                    : undefined
                }
                onClick={onGrant}
              >
                Grant Subscription
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EmptySubscriptionCard({
  displayStatus,
  canGrant,
  canExtend,
  canCancel,
  grantEnabled,
  onGrant,
}: {
  displayStatus: string
  canGrant: boolean
  canExtend: boolean
  canCancel: boolean
  grantEnabled: boolean
  onGrant: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const upper = displayStatus.toUpperCase()
  const tone =
    upper === "ACTIVE" ? "active" : upper === "PENDING" ? "pending" : "inactive"

  return (
    <div className="rounded-2xl border border-grayScale-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left sm:px-6 sm:py-5"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <h3 className="text-base font-bold text-grayScale-900">Subscriptions</h3>
        <div className="flex shrink-0 items-center gap-2">
          <ActiveStatusBadge
            label={formatStatusLabel(displayStatus || "Unsubscribed")}
            tone={tone}
          />
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-grayScale-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-grayScale-400" />
          )}
        </div>
      </button>

      {expanded ? (
        <div className="space-y-6 border-t border-grayScale-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <p className="text-sm text-grayScale-500">No active subscription for this learner.</p>
          <div className="flex flex-col gap-2">
            {canExtend ? (
              <Button
                type="button"
                className="h-10 w-full rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                disabled
                title="Extend is only available when this learner has an active subscription."
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Extend Subscription
              </Button>
            ) : null}
            {(canGrant || canCancel) && (
              <div className="flex flex-wrap gap-2">
                {canGrant ? (
                  <Button
                    type="button"
                    className="h-10 min-w-0 flex-1 rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!grantEnabled}
                    title={
                      !grantEnabled
                        ? "No active subscription plans are available to grant."
                        : undefined
                    }
                    onClick={onGrant}
                  >
                    Grant Subscription
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 min-w-0 flex-1 rounded-xl border-grayScale-200 bg-white text-sm font-semibold text-grayScale-700 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                    disabled
                    title="Cancel is only available when this learner has an active subscription."
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function UserSubscriptionsSection({
  userId,
  userRole,
  userName,
  subscriptions,
  loading,
  error,
  onRefresh,
}: {
  userId: number
  userRole?: string
  userName?: string
  subscriptions: UserSubscriptionsData | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}) {
  const { permissions } = useTeamPermissions()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [grantOpen, setGrantOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [extendInitialSubscriptionId, setExtendInitialSubscriptionId] = useState<number | null>(
    null,
  )
  const [cancelTarget, setCancelTarget] = useState<UserSubscriptionRecord | null>(null)
  const [catalogPlans, setCatalogPlans] = useState<SubscriptionPlan[]>([])

  const canApply = hasSubscriptionAdminPermission(
    SUBSCRIPTION_ADMIN_PERMISSIONS.apply,
    permissions,
  )
  const canExtend = canApply
  const canCancel = hasSubscriptionAdminPermission(
    SUBSCRIPTION_ADMIN_PERMISSIONS.cancel,
    permissions,
  )
  const learner = isLearnerRole(userRole)
  const showGrant = canApply && learner

  const activePlans = subscriptions?.active_subscriptions ?? []
  const extendableActivePlans = useMemo(
    () =>
      activePlans.filter(
        (subscription) =>
          (subscription.is_currently_active ||
            subscription.status.toUpperCase() === "ACTIVE") &&
          canExtendSubscription(subscription),
      ),
    [activePlans],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getSubscriptionPlans()
        if (!cancelled) {
          setCatalogPlans(res.data.filter((plan) => plan.is_active))
        }
      } catch {
        if (!cancelled) setCatalogPlans([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const activeCategories = useMemo(() => {
    const fromSubs = activePlans
      .filter(
        (subscription) =>
          subscription.is_currently_active ||
          subscription.status.toUpperCase() === "ACTIVE",
      )
      .map((subscription) => subscription.plan_category)
      .filter((category) => Boolean(category?.trim()))

    const categories = new Set(fromSubs)
    for (const [category, active] of Object.entries(
      subscriptions?.active_by_category ?? {},
    )) {
      if (active) categories.add(category)
    }
    return categories
  }, [activePlans, subscriptions?.active_by_category])

  // Grant is available when at least one active catalog plan is in a category
  // the learner does not already have covered.
  const hasGrantablePlan =
    catalogPlans.length === 0
      ? true
      : catalogPlans.some((plan) => !activeCategories.has(plan.category))
  const grantEnabled = showGrant && hasGrantablePlan
  const extendEnabled = canExtend && extendableActivePlans.length > 0

  const openExtend = (preferred?: UserSubscriptionRecord) => {
    const preferredId =
      preferred && canExtendSubscription(preferred) ? preferred.id : extendableActivePlans[0]?.id
    if (preferredId == null) return
    setExtendInitialSubscriptionId(preferredId)
    setExtendOpen(true)
  }

  const recentPayments = subscriptions?.payments.slice(0, 12) ?? []
  const history = useMemo(() => {
    if (!subscriptions) return []
    const activeIds = new Set(subscriptions.active_subscriptions.map((s) => s.id))
    return subscriptions.subscriptions.filter((s) => !activeIds.has(s.id))
  }, [subscriptions])

  return (
    <>
      <div className="w-full space-y-4">
        {loading ? (
          <Card className="rounded-2xl border border-grayScale-200 shadow-sm">
            <CardContent className="flex items-center gap-2 p-6 text-sm text-grayScale-400">
              <SpinnerIcon className="h-4 w-4" />
              Loading subscription…
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="rounded-2xl border border-destructive/20 shadow-sm">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {!loading && !error && subscriptions ? (
          <>
            {activePlans.length > 0 ? (
              <ActiveSubscriptionsCard
                subscriptions={activePlans}
                canExtend={canExtend}
                canGrant={showGrant}
                canCancel={canCancel}
                grantEnabled={grantEnabled}
                extendEnabled={extendEnabled}
                onExtend={() => openExtend()}
                onGrant={() => setGrantOpen(true)}
                onCancel={(subscription) => setCancelTarget(subscription)}
              />
            ) : (
              <EmptySubscriptionCard
                displayStatus={subscriptions.display_status}
                canGrant={showGrant}
                canExtend={canExtend}
                canCancel={canCancel}
                grantEnabled={grantEnabled}
                onGrant={() => setGrantOpen(true)}
              />
            )}

            {(history.length > 0 || recentPayments.length > 0) && (
              <Card className="rounded-2xl border border-grayScale-200 shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() => setDetailsOpen((v) => !v)}
                  aria-expanded={detailsOpen}
                >
                  <span className="text-sm font-semibold text-grayScale-800">
                    History & payments
                  </span>
                  {detailsOpen ? (
                    <ChevronDown className="h-4 w-4 text-grayScale-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-grayScale-400" />
                  )}
                </button>
                {detailsOpen ? (
                  <CardContent className="space-y-5 border-t border-grayScale-100 px-5 pb-5 pt-4">
                    {Object.keys(subscriptions.active_by_category).length > 0 ? (
                      <div>
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                          Access by category
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(subscriptions.active_by_category).map(
                            ([category, active]) => (
                              <span
                                key={category}
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                  active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-grayScale-100 text-grayScale-500",
                                )}
                              >
                                {formatPlanCategory(category)} {active ? "✓" : "✗"}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}

                    {history.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                          Past subscriptions
                        </p>
                        {history.map((subscription) => (
                          <div
                            key={subscription.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-grayScale-100 px-3 py-2.5"
                          >
                            <div>
                              <p className="text-sm font-medium text-grayScale-800">
                                #{subscription.id} · {formatPlanTitle(subscription)}
                              </p>
                              <p className="text-xs text-grayScale-500">
                                {formatPlanCategory(subscription.plan_category)} ·{" "}
                                {formatExpiryDate(subscription)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <ActiveStatusBadge
                                label={formatStatusLabel(subscription.status)}
                                tone={
                                  subscription.status.toUpperCase() === "PENDING"
                                    ? "pending"
                                    : "inactive"
                                }
                              />
                              {canExtend && canExtendSubscription(subscription) ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg text-xs disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={!subscription.is_currently_active}
                                  title={
                                    !subscription.is_currently_active
                                      ? "Extend is only available for an active subscription."
                                      : undefined
                                  }
                                  onClick={() => openExtend(subscription)}
                                >
                                  Extend
                                </Button>
                              ) : null}
                              {canCancel ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg text-xs text-destructive disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={
                                    !subscription.is_currently_active ||
                                    subscription.status.toUpperCase() === "CANCELLED"
                                  }
                                  title={
                                    !subscription.is_currently_active
                                      ? "Cancel is only available for an active subscription."
                                      : undefined
                                  }
                                  onClick={() => setCancelTarget(subscription)}
                                >
                                  Cancel
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {recentPayments.length > 0 ? (
                      <div>
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                          Recent payments
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-grayScale-100">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Plan</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell className="text-sm text-grayScale-700">
                                    <DisplayValue value={payment.plan_name} />
                                  </TableCell>
                                  <TableCell className="text-sm text-grayScale-700">
                                    {formatMoney(payment.amount, payment.currency)}
                                  </TableCell>
                                  <TableCell className="text-sm text-grayScale-700">
                                    {formatStatusLabel(payment.status)}
                                  </TableCell>
                                  <TableCell className="text-xs text-grayScale-500">
                                    {formatAdminPaymentMethod(payment.payment_method)}
                                  </TableCell>
                                  <TableCell className="text-xs text-grayScale-500">
                                    {formatDateTime(payment.paid_at || payment.created_at)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            )}
          </>
        ) : null}

        {!loading && !error && !subscriptions ? (
          <Card className="rounded-2xl border border-grayScale-200 shadow-sm">
            <CardContent className="p-6 text-sm text-grayScale-400">
              No subscription data available.
            </CardContent>
          </Card>
        ) : null}
      </div>

      <GrantSubscriptionDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        userId={userId}
        userName={userName}
        activeByCategory={subscriptions?.active_by_category ?? {}}
        onGranted={onRefresh}
      />

      <ExtendSubscriptionDialog
        open={extendOpen}
        onOpenChange={(next) => {
          setExtendOpen(next)
          if (!next) setExtendInitialSubscriptionId(null)
        }}
        userId={userId}
        subscriptions={extendableActivePlans}
        initialSubscriptionId={extendInitialSubscriptionId}
        onExtended={onRefresh}
      />

      <CancelSubscriptionDialog
        open={cancelTarget != null}
        onOpenChange={(next) => {
          if (!next) setCancelTarget(null)
        }}
        subscription={cancelTarget}
        onCancelled={onRefresh}
      />
    </>
  )
}
