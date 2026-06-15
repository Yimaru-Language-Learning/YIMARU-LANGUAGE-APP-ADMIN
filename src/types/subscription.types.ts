export type SubscriptionPlanDurationUnit = "MONTH" | "YEAR" | "WEEK" | "DAY" | string

export type SubscriptionPlanCategory = "LEARN_ENGLISH" | "IELTS" | "DUOLINGO"

export interface SubscriptionPlan {
  id: number
  name: string
  description: string
  category: SubscriptionPlanCategory
  duration_value: number
  duration_unit: SubscriptionPlanDurationUnit
  price: number
  currency: string
  is_active: boolean
  created_at: string
}

export interface CreateSubscriptionPlanPayload {
  name: string
  description: string
  category: SubscriptionPlanCategory
  duration_value: number
  duration_unit: SubscriptionPlanDurationUnit
  price: number
  currency: string
  is_active: boolean
}

export interface UpdateSubscriptionPlanPayload {
  name: string
  description: string
  duration_value: number
  duration_unit: SubscriptionPlanDurationUnit
  price: number
  currency: string
  is_active: boolean
}

export interface SubscriptionPlansListResponse {
  message?: string
  data: SubscriptionPlan[]
  success?: boolean
  status_code?: number
  metadata?: unknown
}

export interface SubscriptionPlanMutationResponse {
  message?: string
  data: SubscriptionPlan
  success?: boolean
  status_code?: number
  metadata?: unknown
}
