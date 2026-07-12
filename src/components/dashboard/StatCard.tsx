import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
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
  value: ReactNode
  deltaLabel: string
  deltaPositive: boolean
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            <div className="mt-1 text-xs font-medium text-grayScale-500">{label}</div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100/60 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="border-t border-grayScale-200 mt-4 pt-3">
          <div className="text-xs font-medium">
            <span className={cn(deltaPositive ? "text-mint-500" : "text-destructive")}>{deltaLabel}</span>
            <span className="text-grayScale-400"> vs Last Month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


