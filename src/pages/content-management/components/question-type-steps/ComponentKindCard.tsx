import { Check } from "lucide-react"
import { cn } from "../../../../lib/utils"
import type { LucideIcon } from "lucide-react"

interface ComponentKindCardProps {
  label: string
  Icon: LucideIcon
  selected: boolean
  onClick: () => void
}

export function ComponentKindCard({ label, Icon, selected, onClick }: ComponentKindCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start justify-between p-4 min-h-[132px] rounded-[16px] border text-left transition-all group relative",
        selected
          ? "border-[#9E2891] bg-white shadow-[0_4px_12px_rgba(158,40,145,0.08)] ring-1 ring-[#9E2891]"
          : "border-grayScale-200 bg-white hover:border-grayScale-300 hover:bg-grayScale-50/80",
      )}
    >
      <div className="w-full flex items-start justify-between gap-2">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            selected ? "bg-[#9E2891] text-white" : "bg-[#F1F5F9] text-grayScale-600 group-hover:bg-grayScale-100",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div
          className={cn(
            "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
            selected ? "border-[#9E2891] bg-white" : "border-grayScale-300 bg-white",
          )}
        >
          {selected ? <Check className="h-3.5 w-3.5 text-[#9E2891] stroke-[3]" /> : null}
        </div>
      </div>
      <span className={cn("text-[15px] font-bold leading-tight mt-2", selected ? "text-grayScale-900" : "text-grayScale-800")}>
        {label}
      </span>
    </button>
  )
}
