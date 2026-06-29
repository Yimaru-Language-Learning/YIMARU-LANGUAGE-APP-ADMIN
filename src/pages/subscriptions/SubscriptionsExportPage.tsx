import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { ExportCsvButton } from "../../components/export/ExportCsvButton"
import { Input } from "../../components/ui/input"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import {
  toRfc3339EndOfDay,
  toRfc3339StartOfDay,
} from "../../lib/activityLogDisplay"
import { EXPORT_PERMISSIONS, EXPORT_ROUTES } from "../../lib/csv-export"
import { subscriptionExportQuery } from "../../lib/csvExportFilters"
import { SUBSCRIPTION_PLAN_CATEGORIES } from "../../lib/subscriptionPlans"

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
] as const

export function SubscriptionsExportPage() {
  const [userId, setUserId] = useState("")
  const [planId, setPlanId] = useState("")
  const [status, setStatus] = useState("")
  const [planCategory, setPlanCategory] = useState("")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [expiresFrom, setExpiresFrom] = useState("")
  const [expiresTo, setExpiresTo] = useState("")

  const exportParams = useMemo(
    () =>
      subscriptionExportQuery({
        user_id: userId.trim() ? Number(userId) : undefined,
        plan_id: planId.trim() ? Number(planId) : undefined,
        status: status || undefined,
        plan_category: planCategory || undefined,
        created_from: createdFrom ? toRfc3339StartOfDay(createdFrom) : undefined,
        created_to: createdTo ? toRfc3339EndOfDay(createdTo) : undefined,
        expires_from: expiresFrom ? toRfc3339StartOfDay(expiresFrom) : undefined,
        expires_to: expiresTo ? toRfc3339EndOfDay(expiresTo) : undefined,
      }),
    [userId, planId, status, planCategory, createdFrom, createdTo, expiresFrom, expiresTo],
  )

  const activeFilterCount = countActiveFilters([
    { value: userId },
    { value: planId },
    { value: status },
    { value: planCategory },
    { value: createdFrom },
    { value: createdTo },
    { value: expiresFrom },
    { value: expiresTo },
  ])

  const clearFilters = () => {
    setUserId("")
    setPlanId("")
    setStatus("")
    setPlanCategory("")
    setCreatedFrom("")
    setCreatedTo("")
    setExpiresFrom("")
    setExpiresTo("")
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Billing</p>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">Subscriptions export</h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Download learner subscriptions as CSV. Apply filters below to match the records you need.
            Exports are limited to 50,000 rows per download.
          </p>
        </div>
        <ExportCsvButton
          permission={EXPORT_PERMISSIONS.subscriptions}
          exportPath={EXPORT_ROUTES.subscriptions}
          params={exportParams}
        />
      </div>

      <div className="rounded-[8px] border border-grayScale-100 bg-white p-4 sm:p-6">
        <AdminFiltersPanel
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          footer="Date filters use UTC start/end of day. Per-user subscription detail remains on each user profile."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={1}
              placeholder="User ID"
              className="h-9 w-full sm:w-32"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Input
              type="number"
              min={1}
              placeholder="Plan ID"
              className="h-9 w-full sm:w-32"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            />
            <div className="relative w-full sm:w-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
              >
                {SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={planCategory}
                onChange={(e) => setPlanCategory(e.target.value)}
                className="h-9 w-full appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
              >
                <option value="">All plan categories</option>
                {SUBSCRIPTION_PLAN_CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex flex-col gap-1 text-xs text-grayScale-500">
              Created from
              <Input
                type="date"
                className="h-9 w-full sm:w-auto"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-grayScale-500">
              Created to
              <Input
                type="date"
                className="h-9 w-full sm:w-auto"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-grayScale-500">
              Expires from
              <Input
                type="date"
                className="h-9 w-full sm:w-auto"
                value={expiresFrom}
                onChange={(e) => setExpiresFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-grayScale-500">
              Expires to
              <Input
                type="date"
                className="h-9 w-full sm:w-auto"
                value={expiresTo}
                onChange={(e) => setExpiresTo(e.target.value)}
              />
            </label>
          </div>
        </AdminFiltersPanel>
      </div>

      <p className="text-xs text-grayScale-400">
        Subscription exports may contain learner PII and billing data. Restrict access to authorized
        staff only.
      </p>
    </div>
  )
}
