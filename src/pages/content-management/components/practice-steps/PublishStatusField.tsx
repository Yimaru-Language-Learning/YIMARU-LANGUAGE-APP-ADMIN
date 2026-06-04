import type { PracticePublishStatus } from "../../../../types/course.types"
import { cn } from "../../../../lib/utils"

type Props = {
  value: PracticePublishStatus
  onChange: (value: PracticePublishStatus) => void
  disabled?: boolean
  className?: string
}

export function PublishStatusField({ value, onChange, disabled, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-grayScale-700">
        Publish status <span className="text-red-500">*</span>
      </p>
      <p className="text-xs text-grayScale-500">
        Controls whether learners can see this practice after you save.
      </p>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Publish status">
        {(
          [
            { id: "DRAFT" as const, label: "Draft", hint: "Save without publishing to learners" },
            { id: "PUBLISHED" as const, label: "Published", hint: "Make the practice available" },
          ] as const
        ).map((opt) => {
          const selected = value === opt.id
          return (
            <label
              key={opt.id}
              className={cn(
                "flex min-w-[140px] flex-1 cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors",
                selected
                  ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30"
                  : "border-grayScale-200 bg-white hover:border-grayScale-300",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="publish_status"
                  value={opt.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onChange(opt.id)}
                  className="h-4 w-4 border-grayScale-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-semibold text-grayScale-800">{opt.label}</span>
              </span>
              <span className="mt-1 pl-6 text-xs text-grayScale-500">{opt.hint}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
