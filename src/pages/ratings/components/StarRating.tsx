import { Star } from "lucide-react"
import { cn } from "../../../lib/utils"

type StarRatingProps = {
  stars: number
  max?: number
  size?: "sm" | "md"
  className?: string
}

export function StarRating({ stars, max = 5, size = "md", className }: StarRatingProps) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const safeStars = Math.max(0, Math.min(max, Math.round(stars)))

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${safeStars} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            iconClass,
            i < safeStars
              ? "fill-amber-400 text-amber-400"
              : "fill-grayScale-200 text-grayScale-200",
          )}
        />
      ))}
    </div>
  )
}
