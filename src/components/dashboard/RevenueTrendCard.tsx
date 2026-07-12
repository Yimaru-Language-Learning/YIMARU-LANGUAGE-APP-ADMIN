import { useEffect, useMemo, useState } from "react"
import { Bar, CartesianGrid, Cell, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getDashboard } from "../../api/analytics.api"
import { getYearOptions } from "../analytics/AnalyticsTimeRangeFilter"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Select } from "../ui/select"
import { SensitiveChart, SensitiveRevealToggle, SensitiveValue } from "../ui/sensitive-value"
import { aggregateRevenueByMonth, formatRevenueAxisTick } from "../../lib/analytics"
import type { DateRevenue } from "../../types/analytics.types"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"

const TRACK_COLOR = "#E8E8E8"
const BAR_COLOR = "#9E2891"

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

  const chartData = useMemo(() => {
    const monthly = aggregateRevenueByMonth(dailyRevenue, year)
    const peak = Math.max(...monthly.map((point) => point.revenue), 1)
    const trackMax = peak * 1.15

    return monthly.map((point) => ({
      month: point.month,
      revenue: point.revenue,
      track: trackMax,
    }))
  }, [dailyRevenue, year])

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1">
              <CardTitle>Revenue Trend</CardTitle>
              <SensitiveRevealToggle />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              <SensitiveValue showToggle={false}>ETB {totalRevenue.toLocaleString()}</SensitiveValue>
            </div>
            <div className="text-xs font-medium text-grayScale-500">Monthly · {year} (ETB)</div>
          </div>
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 w-[96px] shrink-0 rounded-lg py-1 text-sm font-medium"
            aria-label="Revenue trend year"
          >
            {years.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[240px] p-6 pt-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <SensitiveChart>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 0 }} barGap={-28}>
                <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="4 4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={44}
                  tickFormatter={formatRevenueAxisTick}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name !== "revenue") return null
                    return [`ETB ${Number(value).toLocaleString()}`, "Revenue"]
                  }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E0E0E0",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="track" barSize={28} radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell key={`track-${entry.month}`} fill={TRACK_COLOR} />
                  ))}
                </Bar>
                <Bar dataKey="revenue" barSize={28} radius={[8, 8, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={`revenue-${entry.month}`} fill={BAR_COLOR} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </SensitiveChart>
        )}
      </CardContent>
    </Card>
  )
}
