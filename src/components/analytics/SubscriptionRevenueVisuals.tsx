import type { ReactNode } from "react"
import { Lightbulb } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "../../lib/utils"
import { formatPercentRate } from "../../lib/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { SensitiveChart, SensitiveRevealToggle, SensitiveValue } from "../ui/sensitive-value"

export const SUBSCRIPTION_CHART_COLORS = [
  "#8E248D",
  "#FFD23F",
  "#1DE9B6",
  "#60A5FA",
  "#C26FC0",
  "#F97316",
  "#14B8A6",
  "#A78BFA",
]

const BRAND = "#8E248D"

const chartTooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E8E8E8",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 12,
}

export const analyticsSoftCardClass =
  "rounded-xl border border-grayScale-200/70 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"

type PieSlice = { name: string; value: number; color: string }

function PiePercentLabel(props: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const pct = Math.round(percent * 100)

  return (
    <g>
      <circle cx={x} cy={y} r={12} fill="#fff" stroke="#F0F0F0" strokeWidth={1} />
      <text
        x={x}
        y={y}
        fill="#4B5563"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fontWeight={700}
      >
        {pct}%
      </text>
    </g>
  )
}

export function MonthlyRevenueTrendPanel({
  title = "Monthly Revenue Trend",
  subtitle = "Revenue growth over the current fiscal year",
  ytdLabel,
  ytdValue,
  trailing,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  ytdLabel?: string
  ytdValue: ReactNode
  trailing?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn(analyticsSoftCardClass, className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 pt-5">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base font-bold text-grayScale-900">{title}</CardTitle>
            <SensitiveRevealToggle />
          </div>
          <p className="text-xs text-grayScale-400">{subtitle}</p>
        </div>
        <div className="flex items-start gap-3">
          {trailing}
          <div className="text-right">
            <div className="text-xl font-bold tracking-tight text-grayScale-900 sm:text-2xl">
              {ytdValue}
            </div>
            {ytdLabel ? (
              <div className="text-[11px] font-medium uppercase tracking-wide text-grayScale-400">
                {ytdLabel}
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-1">{children}</CardContent>
    </Card>
  )
}

export function MonthlyRevenueAreaChart({
  data,
  gradientId = "monthlyRevenueFill",
  dataKey = "revenue",
  xKey = "month",
  height = 240,
  yTickFormatter,
}: {
  data: Record<string, string | number>[]
  gradientId?: string
  dataKey?: string
  xKey?: string
  height?: number
  yTickFormatter?: (value: number) => string
}) {
  const peakIndex = data.reduce((best, row, idx) => {
    const v = Number(row[dataKey] ?? 0)
    const bestV = Number(data[best]?.[dataKey] ?? 0)
    return v > bestV ? idx : best
  }, 0)

  return (
    <SensitiveChart>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.32} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#EEEEEE" strokeDasharray="4 4" />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tick={{ fill: "#9E9E9E" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={44}
            tick={{ fill: "#9E9E9E" }}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            formatter={(value) => [`ETB ${Number(value).toLocaleString()}`, "Revenue"]}
            contentStyle={chartTooltipStyle}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={BRAND}
            strokeWidth={2.75}
            fill={`url(#${gradientId})`}
            dot={(props) => {
              const { cx, cy, index } = props
              if (cx == null || cy == null) return null
              const highlight = index === peakIndex
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={highlight ? 5.5 : 3.5}
                  fill={BRAND}
                  stroke="#fff"
                  strokeWidth={highlight ? 2 : 1}
                />
              )
            }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </SensitiveChart>
  )
}

export function DonutBreakdownCard({
  title,
  data,
  countSuffix = "Users",
  emptyMessage = "No data available",
  className,
}: {
  title: string
  data: PieSlice[]
  countSuffix?: string
  emptyMessage?: string
  className?: string
}) {
  const total = data.reduce((sum, row) => sum + row.value, 0)

  return (
    <Card className={cn(analyticsSoftCardClass, className)}>
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-base font-bold text-grayScale-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {data.length > 0 && total > 0 ? (
          <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="relative mx-auto h-[200px] w-full max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    strokeWidth={0}
                    label={PiePercentLabel}
                    labelLine={false}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} ${countSuffix.toLowerCase()}`,
                      String(name),
                    ]}
                    contentStyle={chartTooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {data.map((s) => (
                <div key={s.name} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-grayScale-800">{s.name}</div>
                    <div className="text-xs text-grayScale-400">
                      {s.value.toLocaleString()} {countSuffix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-grayScale-400">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  )
}

export function ActivePlansBreakdownCard({
  title = "Active Plans Breakdown",
  data,
  className,
}: {
  title?: string
  data: PieSlice[]
  className?: string
}) {
  return (
    <DonutBreakdownCard
      title={title}
      data={data}
      countSuffix="Users"
      emptyMessage="No plan data available"
      className={className}
    />
  )
}

export function RenewalRateCard({
  renewalRate,
  autoRenewCount,
  cancelledCount,
  activeNow,
  tip = "Enable automated email reminders for manual renewal users to improve retention by estimated 3–5%.",
  className,
}: {
  renewalRate: number
  autoRenewCount: number
  cancelledCount: number
  activeNow: number
  tip?: string
  className?: string
}) {
  const ratePct = Math.max(0, Math.min(100, renewalRate * 100))
  const circumference = 2 * Math.PI * 48
  const dash = (ratePct / 100) * circumference
  const autoRenewPct =
    activeNow > 0 ? Math.min(100, (autoRenewCount / activeNow) * 100) : 0
  const cancelledDenom = activeNow + cancelledCount
  const cancelledPct =
    cancelledDenom > 0 ? Math.min(100, (cancelledCount / cancelledDenom) * 100) : 0

  return (
    <Card className={cn(analyticsSoftCardClass, className)}>
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-base font-bold text-grayScale-900">Renewal Rate</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative mx-auto flex h-40 w-40 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#F0F0F0" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={BRAND}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash.toFixed(1)} ${circumference.toFixed(1)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tracking-tight text-grayScale-900">
                {formatPercentRate(renewalRate, 0)}
              </span>
              <span className="text-[11px] font-medium text-grayScale-400">Retention</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-grayScale-800">Auto-Renew</span>
                <span className="text-grayScale-400">
                  {autoRenewCount.toLocaleString()} Users
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-grayScale-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${autoRenewPct}%`, backgroundColor: BRAND }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-grayScale-800">Canceled</span>
                <span className="text-grayScale-400">
                  {cancelledCount.toLocaleString()} Users
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-grayScale-100">
                <div
                  className="h-full rounded-full bg-sky-300 transition-all"
                  style={{ width: `${Math.max(cancelledPct, cancelledCount > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5 rounded-xl bg-brand-100/50 px-3.5 py-3 text-xs leading-relaxed text-brand-600">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <p>
            <span className="font-semibold">Tip: </span>
            {tip}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function labelCountsToPieSlices(
  rows: { label: string; count: number }[],
  colors: string[] = SUBSCRIPTION_CHART_COLORS,
): PieSlice[] {
  return rows
    .filter((row) => row.count > 0)
    .map((row, i) => ({
      name: row.label,
      value: row.count,
      color: colors[i % colors.length],
    }))
}

export function SensitiveYtdValue({ amount }: { amount: number }) {
  return (
    <SensitiveValue showToggle={false}>
      {amount >= 1_000_000
        ? `ETB ${(amount / 1_000_000).toFixed(1)}M`
        : amount >= 1_000
          ? `ETB ${(amount / 1_000).toFixed(1)}K`
          : `ETB ${amount.toLocaleString()}`}
    </SensitiveValue>
  )
}
