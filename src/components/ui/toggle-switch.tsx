import { cn } from "../../lib/utils"

export type ToggleSwitchProps = {
  checked: boolean
  onCheckedChange?: () => void
  disabled?: boolean
  "aria-label"?: string
  className?: string
  variant?: "brand" | "plain"
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  "aria-label": ariaLabel,
  className,
  variant = "brand",
}: ToggleSwitchProps) {
  const isBrand = variant === "brand"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onCheckedChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1",
        isBrand && "border p-0.5",
        isBrand
          ? checked
            ? "border-brand-500 bg-brand-500 shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
            : "border-grayScale-300 bg-grayScale-200 hover:bg-grayScale-300/80"
          : checked
            ? "bg-brand-500"
            : "bg-grayScale-200",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ease-out",
          isBrand ? "shadow-md ring-0" : "shadow-sm",
          checked ? "translate-x-4" : isBrand ? "translate-x-0" : "translate-x-0.5",
        )}
      />
    </button>
  )
}
