export type AdminSubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | string

export interface AdminSubscriptionRes {
  id: number
  user_id: number
  plan_id: number
  plan_name?: string
  starts_at: string
  expires_at: string
  status: AdminSubscriptionStatus
  payment_reference?: string
  payment_method?: string
  auto_renew: boolean
  duration_value?: number
  duration_unit?: string
  price?: number
  currency?: string
  created_at: string
}

/** Body for unified grant-or-extend. */
export interface AdminApplySubscriptionBody {
  plan_id: number
  /**
   * When true (default if omitted), records a SUCCESS payment at the plan price.
   * When false, grants/extends access with no payments row.
   */
  record_payment?: boolean
}

/** @deprecated Prefer AdminApplySubscriptionBody */
export type AdminGrantSubscriptionBody = AdminApplySubscriptionBody

export interface AdminSubscriptionMutationResponse {
  message?: string
  data: AdminSubscriptionRes
  success?: boolean
  status_code?: number
  metadata?: unknown
}
