export type InfluencerStatus = "ACTIVE" | "INACTIVE"

export type InfluencerPlatform =
  | "TIKTOK"
  | "TELEGRAM"
  | "YOUTUBE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "OTHER"

export interface Influencer {
  id: number
  name: string
  code: string
  phone_number?: string | null
  email?: string | null
  platform: InfluencerPlatform
  social_handle?: string | null
  commission_rate: number
  target_url?: string | null
  status: InfluencerStatus
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreateInfluencerInput {
  name: string
  code: string
  phone_number?: string | null
  email?: string | null
  platform?: InfluencerPlatform
  social_handle?: string | null
  commission_rate?: number
  target_url?: string | null
  status?: InfluencerStatus
  notes?: string | null
}

export interface UpdateInfluencerInput {
  name?: string
  code?: string
  phone_number?: string | null
  email?: string | null
  platform?: InfluencerPlatform
  social_handle?: string | null
  commission_rate?: number
  target_url?: string | null
  status?: InfluencerStatus
  notes?: string | null
}

export interface ListInfluencersParams {
  search?: string
  status?: InfluencerStatus | ""
  platform?: InfluencerPlatform | ""
  page?: number
  limit?: number
}

export interface InfluencerStats {
  influencer_id: number
  total_clicks: number
  clicks_by_platform: Record<string, number>
  total_attributions: number
}

export interface InfluencerClick {
  id: number
  influencer_id: number
  referral_code: string
  ip_address?: string | null
  user_agent?: string | null
  referer?: string | null
  platform: string
  device_info?: Record<string, unknown> | null
  country?: string | null
  clicked_at: string
}

export interface InfluencerDailyRevenue {
  date: string
  clicks: number
  registrations: number
  revenue: number
  commission: number
}

export interface InfluencerAttributedPayment {
  payment_id: number
  user_id: number
  user_name: string
  user_email?: string | null
  user_phone?: string | null
  amount: number
  currency: string
  commission: number
  payment_method?: string | null
  paid_at: string
}

export interface InfluencerRevenueAnalytics {
  influencer_id: number
  influencer_name: string
  referral_code: string
  platform: string
  commission_rate: number
  status: string
  total_clicks: number
  total_referred_users: number
  total_paying_users: number
  total_payments_count: number
  total_revenue: number
  total_commission: number
  currency: string
  click_to_signup_rate: number
  signup_to_paid_rate: number
  daily_breakdown?: InfluencerDailyRevenue[]
  recent_payments?: InfluencerAttributedPayment[]
}

export interface ReferredUserDetail {
  user_id: number
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  email?: string | null
  attribution_type: string
  attributed_at: string
  user_status: string
  has_active_subscription: boolean
  total_spent: number
  payments_count: number
}

export interface InfluencerSystemSummary {
  total_influencers: number
  active_influencers: number
  total_clicks: number
  total_referred_users: number
  total_paying_users: number
  total_revenue: number
  total_commission: number
  currency: string
  click_to_signup_rate: number
  signup_to_paid_rate: number
  top_influencers?: InfluencerRevenueAnalytics[]
}
