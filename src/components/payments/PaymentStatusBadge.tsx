import { Clock, CreditCard, X } from "lucide-react"
import { formatPaymentStatus, paymentStatusAppearance } from "../../lib/payments"
import { cn } from "../../lib/utils"
import { Badge } from "../ui/badge"

export function PaymentStatusBadge({ status, className }: {
  status: string
  className?: string
}) {
  const appearance = paymentStatusAppearance(status)
  const Icon = appearance.icon === "clock" ? Clock : X

  return (
    <Badge
      variant={appearance.variant}
      className={cn("gap-1", appearance.badgeClassName, className)}
    >
      {appearance.icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {formatPaymentStatus(status)}
    </Badge>
  )
}

export function PaymentStatusIcon({ status, className }: {
  status: string
  className?: string
}) {
  const { icon } = paymentStatusAppearance(status)
  const Icon = icon === "clock" ? Clock : icon === "x" ? X : CreditCard
  return <Icon className={className} aria-hidden="true" />
}
