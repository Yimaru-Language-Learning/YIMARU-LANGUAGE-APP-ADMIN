import { useEffect, useMemo, useState } from "react"
import { getDashboard } from "../../api/analytics.api"
import { getYearOptions } from "../analytics/AnalyticsTimeRangeFilter"
import {
  MonthlyRevenueAreaChart,
  MonthlyRevenueTrendPanel,
  SensitiveYtdValue,
} from "../analytics/SubscriptionRevenueVisuals"
import { Select } from "../ui/select"
import { aggregateRevenueByMonth, formatRevenueAxisTick } from "../../lib/analytics"
import type { DateRevenue } from "../../types/analytics.types"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"

export function RevenueTrendCard() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [dailyRevenue, setDailyRevenue] = useState<DateRevenue[]>([])
  const [loading, setLoading] = useState(true)

  const years = useMemo(() => getYearOptions(), [])

  useEffect(() => {
    let cancelled = false

    const fetchRevenueTrend = async () => {
      setLoading(true)
      try {
        const res = await getDashboard({ mode: "year", year })
        if (cancelled) return
        setTotalRevenue(res.data.payments.total_revenue)
        setDailyRevenue(res.data.payments.revenue_last_30_days)
      } catch {
        if (!cancelled) {
          setTotalRevenue(0)
          setDailyRevenue([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRevenueTrend()
    return () => {
      cancelled = true
    }
  }, [year])

  const chartData = useMemo(
    () => aggregateRevenueByMonth(dailyRevenue, year),
    [dailyRevenue, year],
  )

  return (
    <MonthlyRevenueTrendPanel
      subtitle={`Revenue growth over ${year}`}
      ytdValue={<SensitiveYtdValue amount={totalRevenue} />}
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
      {loading ? (
        <div className="flex h-[240px] items-center justify-center">
          <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
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
