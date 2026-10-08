import { useMemo, useState } from "react"
import { useAnalyticsDashboard } from "../../hooks/useAnalyticsDashboard"
import { getYearOptions } from "../analytics/AnalyticsTimeRangeFilter"
import {
  MonthlyRevenueAreaChart,
  MonthlyRevenueTrendPanel,
  SensitiveYtdValue,
} from "../analytics/SubscriptionRevenueVisuals"
import { Select } from "../ui/select"
import { Button } from "../ui/button"
import { aggregateRevenueByMonth, formatRevenueAxisTick } from "../../lib/analytics"
import type { DashboardData, DashboardFilters } from "../../types/analytics.types"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"

export function RevenueTrendCard({ paymentMethod, sharedDashboard, sharedFilters, onKpiUpdate }: {
  paymentMethod?: string
  sharedDashboard: DashboardData
  sharedFilters: DashboardFilters
  onKpiUpdate: (updatedAt: number) => void
}) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const filters = useMemo<DashboardFilters>(() => ({
    mode: "year",
    year,
    ...(paymentMethod ? { payment_method: paymentMethod } : {}),
  }), [year, paymentMethod])
  // A matching yearly page already supplies this snapshot every 20 seconds.
  // Other page ranges cannot detect changes in the widget's selected year.
  const useSharedSnapshot = sharedFilters.mode === "year" && sharedFilters.year === year &&
    sharedFilters.payment_method === paymentMethod
  const { dashboard: yearlyDashboard, loading, error, refresh } = useAnalyticsDashboard(filters, "revenue", {
    enabled: !useSharedSnapshot,
    onKpiUpdate,
  })
  const dashboard = useSharedSnapshot ? sharedDashboard : yearlyDashboard

  const years = useMemo(() => getYearOptions(), [])

  const chartData = useMemo(
    () => aggregateRevenueByMonth(dashboard?.payments.revenue_last_30_days ?? [], year),
    [dashboard, year],
  )

  return (
    <MonthlyRevenueTrendPanel
      subtitle={`Revenue growth over ${year}`}
      ytdValue={dashboard ? <SensitiveYtdValue amount={dashboard.payments.total_revenue} /> : "—"}
      ytdLabel="YTD"
      trailing={
        <Select
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-8 w-[92px] shrink-0 rounded-lg border-grayScale-200 py-1 text-xs font-medium"
          aria-label="Revenue trend year"
        >
          {years.map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </Select>
      }
    >
      {!dashboard && loading ? (
        <div className="flex h-[240px] items-center justify-center">
          <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
        </div>
      ) : !dashboard && error ? (
        <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-sm text-grayScale-500">
          <span>Unable to load revenue. Retrying automatically.</span>
          <Button variant="outline" size="sm" onClick={() => { void refresh() }}>Retry now</Button>
        </div>
      ) : (
        <MonthlyRevenueAreaChart
          data={chartData}
          gradientId="dashboardMonthlyRevenueFill"
          yTickFormatter={formatRevenueAxisTick}
        />
      )}
    </MonthlyRevenueTrendPanel>
  )
}
