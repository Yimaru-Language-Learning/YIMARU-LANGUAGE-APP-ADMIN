export type SubscriptionPlanDurationUnit = "MONTH" | "YEAR" | "WEEK" | "DAY" | string

export interface SubscriptionPlan {
  id: number
  name: string
  description: string
  duration_value: number
  duration_unit: SubscriptionPlanDurationUnit
  price: number
  currency: string
  is_active: boolean
  created_at: string
}

export interface SubscriptionPlansListResponse {
  message?: string
  data: SubscriptionPlan[]
  success?: boolean
  status_code?: number
  metadata?: unknown
}
