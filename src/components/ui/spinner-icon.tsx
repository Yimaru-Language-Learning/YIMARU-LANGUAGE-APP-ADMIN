import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import { cn } from "../../lib/utils"

interface SpinnerIconProps {
  className?: string
  alt?: string
}

export function SpinnerIcon({ className, alt = "Loading" }: SpinnerIconProps) {
  return <img src={spinnerSrc} alt={alt} className={cn("animate-spin", className)} />
}

