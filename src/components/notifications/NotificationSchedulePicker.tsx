import { useMemo, useState } from "react"
import { Calendar, Clock3 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { cn } from "../../lib/utils"
import { formatScheduledAtLabel, toRfc3339Utc } from "../../lib/notificationBulk"

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

type NotificationSchedulePickerProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function NotificationSchedulePicker({
  value,
  onChange,
  disabled,
  className,
}: NotificationSchedulePickerProps) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState("")
  const [minute, setMinute] = useState("")

  const label = useMemo(() => formatScheduledAtLabel(value), [value])

  const clearFields = () => {
    setYear("")
    setMonth("")
    setDay("")
    setHour("")
    setMinute("")
    onChange("")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-grayScale-200 bg-grayScale-50/70 px-3 text-sm text-grayScale-700 shadow-sm transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
        >
          <span className="truncate text-left">{label}</span>
          <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-grayScale-200 bg-white px-2 py-1 text-[11px] text-grayScale-500">
            <Calendar className="h-3.5 w-3.5" />
            <Clock3 className="h-3.5 w-3.5" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px] p-3">
        <p className="mb-2 text-xs font-semibold text-grayScale-500">Schedule notification</p>
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-grayScale-500">Date</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                placeholder="YYYY"
                value={year}
                onChange={(e) => setYear(digitsOnly(e.target.value, 4))}
                inputMode="numeric"
                maxLength={4}
                className="h-9 rounded-lg border-grayScale-200 bg-white text-center text-sm"
              />
              <span className="text-grayScale-400">-</span>
              <Input
                type="text"
                placeholder="MM"
                value={month}
                onChange={(e) => setMonth(digitsOnly(e.target.value, 2))}
                inputMode="numeric"
                maxLength={2}
                className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
              />
              <span className="text-grayScale-400">-</span>
              <Input
                type="text"
                placeholder="DD"
                value={day}
                onChange={(e) => setDay(digitsOnly(e.target.value, 2))}
                inputMode="numeric"
                maxLength={2}
                className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-grayScale-500">Time (UTC)</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                placeholder="HH"
                value={hour}
                onChange={(e) => setHour(digitsOnly(e.target.value, 2))}
                inputMode="numeric"
                maxLength={2}
                className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
              />
              <span className="text-grayScale-400">:</span>
              <Input
                type="text"
                placeholder="MM"
                value={minute}
                onChange={(e) => setMinute(digitsOnly(e.target.value, 2))}
                inputMode="numeric"
                maxLength={2}
                className="h-9 w-16 rounded-lg border-grayScale-200 bg-white text-center text-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const now = new Date()
                setYear(String(now.getUTCFullYear()))
                setMonth(String(now.getUTCMonth() + 1).padStart(2, "0"))
                setDay(String(now.getUTCDate()).padStart(2, "0"))
              }}
            >
              Today
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={clearFields}>
              Clear
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8"
            onClick={() => {
              const rfc3339 = toRfc3339Utc(year, month, day, hour, minute)
              if (!rfc3339) {
                toast.error("Invalid schedule time", {
                  description: "Use YYYY-MM-DD and HH:MM (24h UTC). Time must be in the future.",
                })
                return
              }
              onChange(rfc3339)
              setOpen(false)
            }}
          >
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
