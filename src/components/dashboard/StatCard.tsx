import type { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { Card, CardContent } from "../ui/card"

export function StatCard({
  icon: Icon,
  label,
  value,
  deltaLabel,
  deltaPositive,
}: {
  icon: LucideIcon
  label: string
  value: string
  deltaLabel: string
  deltaPositive: boolean
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            <div className="mt-1 text-xs font-medium text-grayScale-500">{label}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className={cn("mt-3 text-xs font-medium", deltaPositive ? "text-mint-500" : "text-destructive")}>
          {deltaLabel} <span className="text-grayScale-400">vs Last Month</span>
        </div>
      </CardContent>
    </Card>
  )
}


