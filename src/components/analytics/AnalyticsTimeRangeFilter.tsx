import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import type { DashboardFilters } from "../../types/analytics.types"

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

const MIN_SELECTABLE_YEAR = 2000

export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let year = currentYear; year >= MIN_SELECTABLE_YEAR; year--) {
    years.push(year)
  }
  return years
}

export function getDashboardFilterLabel(filters: DashboardFilters): string {
  if (filters.mode === "year" && filters.year != null) {
    return String(filters.year)
  }
  if (filters.mode === "year_month" && filters.year != null && filters.month != null) {
    return `${MONTH_LABELS[filters.month - 1]} ${filters.year}`
  }
  if (filters.mode === "custom" && filters.from && filters.to) {
    const from = new Date(`${filters.from}T00:00:00`)
    const to = new Date(`${filters.to}T00:00:00`)
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    return `${from.toLocaleDateString("en-US", opts)} – ${to.toLocaleDateString("en-US", opts)}`
  }
  return "All Time"
}

type AnalyticsTimeRangeFilterProps = {
  value: DashboardFilters
  onChange: (filters: DashboardFilters) => void
  className?: string
}

export function AnalyticsTimeRangeFilter({ value, onChange, className }: AnalyticsTimeRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(true)
  const [monthOpen, setMonthOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [contextYear, setContextYear] = useState(() => value.year ?? new Date().getFullYear())
  const [customFrom, setCustomFrom] = useState(value.from ?? "")
  const [customTo, setCustomTo] = useState(value.to ?? "")
  const containerRef = useRef<HTMLDivElement>(null)

  const years = getYearOptions()

  useEffect(() => {
    if (value.year != null) {
      setContextYear(value.year)
    }
  }, [value.year])

  useEffect(() => {
    if (value.mode === "custom") {
      setCustomFrom(value.from ?? "")
      setCustomTo(value.to ?? "")
    }
  }, [value.from, value.mode, value.to])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  const selectAllTime = () => {
    onChange({ mode: "all_time" })
    setOpen(false)
  }

  const selectYear = (year: number) => {
    setContextYear(year)
    onChange({ mode: "year", year })
    setOpen(false)
  }

  const selectMonth = (month: number) => {
    onChange({ mode: "year_month", year: contextYear, month })
    setOpen(false)
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    onChange({ mode: "custom", from: customFrom, to: customTo })
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-grayScale-200 bg-white px-4 py-2 text-sm font-medium text-grayScale-700 shadow-sm transition-colors hover:bg-grayScale-50"
      >
        Time Range
        <ChevronDown className={cn("h-4 w-4 text-grayScale-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[220px] overflow-hidden rounded-xl border border-grayScale-100 bg-white py-2 shadow-lg">
          <button
            type="button"
            onClick={selectAllTime}
            className={cn(
              "flex w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-grayScale-50",
              value.mode === "all_time" ? "font-semibold text-grayScale-900" : "text-grayScale-700",
            )}
          >
            All Time
          </button>

          <div className="border-t border-grayScale-100">
            <button
              type="button"
              onClick={() => setYearOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-grayScale-800 hover:bg-grayScale-50"
            >
              Year
              <ChevronDown
                className={cn("h-4 w-4 text-grayScale-400 transition-transform", yearOpen && "rotate-180")}
              />
            </button>
            {yearOpen && (
              <div className="max-h-[220px] overflow-y-auto pb-1">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => selectYear(year)}
                    className={cn(
                      "flex w-full px-6 py-2 text-left text-sm transition-colors hover:bg-grayScale-50",
                      value.mode === "year" && value.year === year
                        ? "font-semibold text-brand-600"
                        : "text-grayScale-600",
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-grayScale-100">
            <button
              type="button"
              onClick={() => setMonthOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-grayScale-800 hover:bg-grayScale-50"
            >
              Month
              <ChevronDown
                className={cn("h-4 w-4 text-grayScale-400 transition-transform", monthOpen && "rotate-180")}
              />
            </button>
            {monthOpen && (
              <div className="max-h-[260px] overflow-y-auto pb-1">
                <div className="flex max-h-[88px] flex-wrap gap-1 overflow-y-auto px-4 pb-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setContextYear(year)}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                        contextYear === year
                          ? "bg-brand-100 text-brand-700"
                          : "text-grayScale-500 hover:bg-grayScale-100",
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                {MONTH_LABELS.map((label, index) => {
                  const month = index + 1
                  const isSelected =
                    value.mode === "year_month" && value.year === contextYear && value.month === month

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => selectMonth(month)}
                      className={cn(
                        "flex w-full px-6 py-2 text-left text-sm transition-colors hover:bg-grayScale-50",
                        isSelected ? "font-semibold text-brand-600" : "text-grayScale-600",
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-grayScale-100">
            <button
              type="button"
              onClick={() => setCustomOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-grayScale-800 hover:bg-grayScale-50"
            >
              Date Range
              <ChevronDown
                className={cn("h-4 w-4 text-grayScale-400 transition-transform", customOpen && "rotate-180")}
              />
            </button>
            {customOpen && (
              <div className="space-y-2 px-4 pb-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-grayScale-500">From</label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-grayScale-500">To</label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full text-xs"
                  disabled={!customFrom || !customTo}
                  onClick={applyCustomRange}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
