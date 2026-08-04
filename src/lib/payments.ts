import { formatPlanCategory } from "./subscriptionPlans"
import {
  APP_TIMEZONE,
  formatAppDateTime,
  nextAppCalendarDay,
  toAppCalendarDate,
} from "./datetime"
import type { Payment } from "../types/payment.types"

export function formatPaymentAmount(payment: Pick<Payment, "amount" | "currency">): string {
  const amount = Number(payment.amount)
  const formatted = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : String(payment.amount)
  return `${formatted} ${payment.currency || "ETB"}`
}

/** @deprecated Prefer APP_TIMEZONE from datetime.ts */
export const PAYMENT_DATE_TIMEZONE = APP_TIMEZONE

export function formatPaymentDate(iso: string | null | undefined): string {
  return formatAppDateTime(iso, "unassigned")
}

/** YYYY-MM-DD of paid_at (or created_at if unpaid) in EAT. */
export function paymentEventDateEAT(payment: Pick<Payment, "paid_at" | "created_at">): string | null {
  const raw = payment.paid_at || payment.created_at
  if (!raw) return null
  return toAppCalendarDate(raw)
}

/** Inclusive YYYY-MM-DD range against the payment event date in EAT. */
export function paymentMatchesDateRange(
  payment: Pick<Payment, "paid_at" | "created_at">,
  from?: string,
  to?: string,
): boolean {
  const fromDay = from?.trim()
  const toDay = to?.trim()
  if (!fromDay && !toDay) return true
  const day = paymentEventDateEAT(payment)
  if (!day) return false
  if (fromDay && day < fromDay) return false
  if (toDay && day > toDay) return false
  return true
}

/** Next calendar day as YYYY-MM-DD (for exclusive API upper bounds). */
export function nextCalendarDay(ymd: string): string {
  return nextAppCalendarDay(ymd)
}

export function formatPaymentStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatPaymentMethod(method: string): string {
  if (!method) return "unassigned"
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function paymentCustomerName(payment: Payment): string {
  const name = [payment.user_first_name, payment.user_last_name].filter(Boolean).join(" ")
  return name || payment.user_email || `User #${payment.user_id}`
}

export function formatPaymentPlanCategory(category: string): string {
  return formatPlanCategory(category)
}

export function paymentStatusBadgeVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" | "info" {
  const s = status.toUpperCase()
  if (s === "SUCCESS" || s === "COMPLETED" || s === "PAID") return "success"
  if (s === "PENDING" || s === "PROCESSING") return "warning"
  if (s === "FAILED" || s === "CANCELLED" || s === "EXPIRED") return "destructive"
  return "secondary"
}

export interface PaymentAggregateStats {
  successfulCount: number
  totalRevenue: number
  pendingCount: number
}

export function computePaymentAggregateStats(payments: Payment[]): PaymentAggregateStats {
  let successfulCount = 0
  let totalRevenue = 0
  let pendingCount = 0

  for (const payment of payments) {
    const status = payment.status.toUpperCase()
    if (status === "SUCCESS") {
      successfulCount += 1
      totalRevenue += Number(payment.amount) || 0
    } else if (status === "PENDING" || status === "PROCESSING") {
      pendingCount += 1
    }
  }

  return { successfulCount, totalRevenue, pendingCount }
}
