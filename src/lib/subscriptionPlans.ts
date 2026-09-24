import type {
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanDurationUnit,
  UpdateSubscriptionPlanPayload,
} from "../types/subscription.types"
import { formatAppDate } from "./datetime"

export const SUBSCRIPTION_PLAN_CATEGORIES: {
  value: SubscriptionPlanCategory
  label: string
}[] = [
  { value: "LEARN_ENGLISH", label: "Learn English" },
  { value: "IELTS", label: "IELTS" },
  { value: "DUOLINGO", label: "Duolingo" },
]

export const LIFETIME_DURATION_DEFAULT = {
  duration_value: 1,
  duration_unit: "YEAR" as SubscriptionPlanDurationUnit,
}

export const DUPLICATE_SUBSCRIPTION_PLAN_PERIOD_MESSAGE =
  "Only one plan is allowed per category and billing period. A free plan and a paid plan cannot share the same period—edit the existing plan or change category or duration."

export type SubscriptionPlanPeriodCandidate = {
  category: string
  is_lifetime: boolean
  duration_value: number
  duration_unit: SubscriptionPlanDurationUnit
}

function normalizedPeriod(
  candidate: SubscriptionPlanPeriodCandidate,
): SubscriptionPlanPeriodCandidate {
  if (candidate.is_lifetime) {
    return {
      category: candidate.category,
      is_lifetime: true,
      duration_value: LIFETIME_DURATION_DEFAULT.duration_value,
      duration_unit: LIFETIME_DURATION_DEFAULT.duration_unit,
    }
  }
  return {
    ...candidate,
    duration_unit: String(candidate.duration_unit).toUpperCase() as SubscriptionPlanDurationUnit,
  }
}

export function sameSubscriptionPlanPeriod(
  a: SubscriptionPlanPeriodCandidate,
  b: SubscriptionPlanPeriodCandidate,
): boolean {
  const left = normalizedPeriod(a)
  const right = normalizedPeriod(b)
  return (
    left.category === right.category &&
    left.is_lifetime === right.is_lifetime &&
    left.duration_value === right.duration_value &&
    left.duration_unit === right.duration_unit
  )
}

export function findConflictingSubscriptionPlan(
  plans: SubscriptionPlan[],
  candidate: SubscriptionPlanPeriodCandidate,
  excludePlanId?: number,
): SubscriptionPlan | undefined {
  return plans.find(
    (plan) =>
      plan.id !== excludePlanId &&
      sameSubscriptionPlanPeriod(candidate, {
        category: plan.category,
        is_lifetime: plan.is_lifetime,
        duration_value: plan.duration_value,
        duration_unit: plan.duration_unit,
      }),
  )
}

/** True when a plan is configured as one-time (never expires). */
export function isLifetimePlan(
  plan: Pick<SubscriptionPlan, "is_lifetime"> | { is_lifetime?: boolean | null } | null | undefined,
): boolean {
  return plan?.is_lifetime === true
}

/** True when expires_at is the far-future lifetime sentinel (year >= 9000). */
export function isLifetimeExpiry(expiresAt: string | null | undefined): boolean {
  if (!expiresAt?.trim()) return false
  const d = new Date(expiresAt)
  if (Number.isNaN(d.getTime())) return false
  return d.getUTCFullYear() >= 9000
}

export const SUBSCRIPTION_DURATION_UNITS: {
  value: SubscriptionPlanDurationUnit
  label: string
}[] = [
  { value: "DAY", label: "Day(s)" },
  { value: "WEEK", label: "Week(s)" },
  { value: "MONTH", label: "Month(s)" },
  { value: "YEAR", label: "Year(s)" },
]

export const SUBSCRIPTION_CURRENCIES = ["ETB", "USD"] as const

export function formatPlanDuration(
  plan: Pick<SubscriptionPlan, "duration_value" | "duration_unit"> & {
    category?: string
    is_lifetime?: boolean
  },
): string {
  if (isLifetimePlan(plan)) return "One-time"
  const v = plan.duration_value
  const u = String(plan.duration_unit).toUpperCase()
  const word =
    u === "MONTH" ? "month" : u === "YEAR" ? "year" : u === "WEEK" ? "week" : u === "DAY" ? "day" : plan.duration_unit
  if (u === "MONTH" || u === "YEAR" || u === "WEEK" || u === "DAY") {
    return `${v} ${v === 1 ? word : `${word}s`}`
  }
  return `${v} ${word}`
}

export function formatPlanPrice(
  plan: Pick<SubscriptionPlan, "price" | "currency" | "is_free">,
): string {
  if (plan.is_free) return "Free"
  const amount = Number(plan.price)
  const formatted = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : String(plan.price)
  return `${formatted} ${plan.currency}`
}

export function formatPlanCategory(category: string): string {
  const match = SUBSCRIPTION_PLAN_CATEGORIES.find((c) => c.value === category)
  if (match) return match.label
  return category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatPlanCreatedAt(iso: string): string {
  return formatAppDate(iso, iso)
}

export function planToUpdatePayload(
  plan: SubscriptionPlan,
  overrides?: Partial<UpdateSubscriptionPlanPayload>,
): UpdateSubscriptionPlanPayload {
  return {
    name: plan.name,
    description: plan.description,
    duration_value: plan.duration_value,
    duration_unit: plan.duration_unit,
    price: plan.price,
    currency: plan.currency,
    is_lifetime: plan.is_lifetime,
    is_free: plan.is_free,
    is_active: plan.is_active,
    ...overrides,
  }
}
