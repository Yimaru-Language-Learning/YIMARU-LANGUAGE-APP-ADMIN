import type {
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanDurationUnit,
} from "../types/subscription.types"

export const SUBSCRIPTION_PLAN_CATEGORIES: {
  value: SubscriptionPlanCategory
  label: string
}[] = [
  { value: "LEARN_ENGLISH", label: "Learn English" },
  { value: "EXAM_PREP", label: "Exam prep" },
  { value: "SKILLS", label: "Skills" },
]

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

export function formatPlanDuration(plan: Pick<SubscriptionPlan, "duration_value" | "duration_unit">): string {
  const v = plan.duration_value
  const u = String(plan.duration_unit).toUpperCase()
  const word =
    u === "MONTH" ? "month" : u === "YEAR" ? "year" : u === "WEEK" ? "week" : u === "DAY" ? "day" : plan.duration_unit
  if (u === "MONTH" || u === "YEAR" || u === "WEEK" || u === "DAY") {
    return `${v} ${v === 1 ? word : `${word}s`}`
  }
  return `${v} ${word}`
}

export function formatPlanPrice(plan: Pick<SubscriptionPlan, "price" | "currency">): string {
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
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
