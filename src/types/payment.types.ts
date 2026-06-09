export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | string

export type PaymentProvider = "CHAPA" | "ARIFPAY" | string

export type PaymentMethod = PaymentProvider | string

export type PaymentPlanCategory = "LEARN_ENGLISH" | "IELTS" | "DUOLINGO" | string

export interface Payment {
  id: number
  user_id: number
  plan_id: number
  subscription_id: number
  session_id: string
  transaction_id: string
  nonce: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: PaymentStatus
  payment_url: string
  plan_name: string
  plan_category: string
  user_email: string
  user_first_name: string
  user_last_name: string
  paid_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentsListData {
  payments: Payment[]
  total_count: number
  limit: number
  offset: number
}

export interface PaymentsListResponse {
  message?: string
  data: PaymentsListData
  success?: boolean
  status_code?: number
  metadata?: unknown
}

export interface GetPaymentsParams {
  status?: PaymentStatus
  /** Takes precedence over `payment_method` when both are sent. */
  provider?: PaymentProvider
  payment_method?: PaymentMethod
  plan_category?: PaymentPlanCategory
  currency?: string
  /** Partial match on session_id, nonce, or transaction_id. */
  reference?: string
  limit?: number
  offset?: number
}
