import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "../../lib/utils"
import { Card, CardContent } from "../ui/card"
import { analyticsSoftCardClass } from "../analytics/SubscriptionRevenueVisuals"

export function StatCard({
  icon: Icon,
  label,
  value,
  deltaLabel,
  deltaPositive,
  trend = "auto",
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  deltaLabel: string
  deltaPositive: boolean
  trend?: "up" | "down" | "neutral" | "auto"
}) {
  const resolvedTrend =
    trend === "auto" ? (deltaPositive ? "up" : "down") : trend

  return (
    <Card
      className={cn(
        analyticsSoftCardClass,
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
              {label}
            </div>
            <div className="mt-1.5 text-[1.75rem] font-semibold leading-none tracking-tight text-grayScale-900">
              {value}
            </div>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/60 text-brand-600 ring-1 ring-brand-100/80">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div
          className={cn(
            "mt-4 flex items-center gap-1 border-t border-grayScale-100 pt-3 text-xs font-medium",
            resolvedTrend === "up" && "text-mint-500",
            resolvedTrend === "down" && "text-destructive",
            resolvedTrend === "neutral" && "text-grayScale-400",
          )}
        >
          {resolvedTrend === "up" && <TrendingUp className="h-3 w-3 shrink-0" />}
          {resolvedTrend === "down" && <TrendingDown className="h-3 w-3 shrink-0" />}
          <span className="line-clamp-2">{deltaLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
