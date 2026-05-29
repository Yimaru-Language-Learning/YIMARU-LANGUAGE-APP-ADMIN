import { cn } from "../../../lib/utils"
import type { ResolvedTheme } from "../../../lib/theme"

type ThemeModePreviewProps = {
  variant: "light" | "dark" | "system"
  systemResolved?: ResolvedTheme
  className?: string
}

/** Mini UI mockup so theme options look distinct before applying. */
export function ThemeModePreview({
  variant,
  systemResolved = "light",
  className,
}: ThemeModePreviewProps) {
  if (variant === "system") {
    return (
      <div
        className={cn(
          "relative h-14 w-full overflow-hidden rounded-md border border-grayScale-200 shadow-inner",
          className,
        )}
      >
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="flex flex-col gap-1 bg-[#f5f5f5] p-1.5">
            <div className="h-1.5 w-8 rounded-sm bg-white shadow-sm" />
            <div className="mt-auto h-4 rounded-sm bg-white shadow-sm" />
          </div>
          <div className="flex flex-col gap-1 bg-[#12121a] p-1.5">
            <div className="h-1.5 w-8 rounded-sm bg-[#2e2e3a]" />
            <div className="mt-auto h-4 rounded-sm bg-[#1c1c24]" />
          </div>
        </div>
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          {systemResolved}
        </span>
      </div>
    )
  }

  const isDark = variant === "dark"

  return (
    <div
      className={cn(
        "flex h-14 w-full flex-col gap-1 rounded-md border p-1.5 shadow-inner",
        isDark
          ? "border-[#2e2e3a] bg-[#12121a]"
          : "border-grayScale-200 bg-[#f5f5f5]",
        className,
      )}
    >
      <div
        className={cn(
          "h-1.5 w-10 rounded-sm",
          isDark ? "bg-[#2e2e3a]" : "bg-white shadow-sm",
        )}
      />
      <div className="flex flex-1 gap-1">
        <div
          className={cn(
            "flex-1 rounded-sm",
            isDark ? "bg-[#1c1c24]" : "bg-white shadow-sm",
          )}
        />
        <div
          className={cn(
            "w-4 rounded-sm",
            isDark ? "bg-[#9E2891]" : "bg-[#9E2891]",
          )}
        />
      </div>
    </div>
  )
}
