import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-grayScale-200 bg-white px-3 py-2 pr-8 text-sm text-grayScale-600 shadow-sm ring-offset-background transition hover:bg-grayScale-50 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
      </div>
    )
  },
)
Select.displayName = "Select"

