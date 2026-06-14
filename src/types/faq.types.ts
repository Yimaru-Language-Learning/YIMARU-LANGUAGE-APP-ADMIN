export type FAQStatus = "ACTIVE" | "INACTIVE"

export interface FAQ {
  id: number
  question: string
  answer: string
  category?: string | null
  display_order: number
  status: FAQStatus
  created_at: string
  updated_at?: string | null
}

export interface FAQListData {
  faqs: FAQ[]
  total_count: number
}

export interface GetFAQsResponse {
  message: string
  data: FAQListData
  success?: boolean
  status_code?: number
  metadata?: unknown | null
}

export interface GetFAQResponse {
  message: string
  data: FAQ
  success?: boolean
  status_code?: number
  metadata?: unknown | null
}

export interface CreateFAQRequest {
  question: string
  answer: string
  category?: string | null
  display_order?: number
  status?: FAQStatus
}

export interface UpdateFAQRequest {
  question?: string
  answer?: string
  category?: string | null
  display_order?: number
  status?: FAQStatus
}

export interface CreateFAQResponse {
  message: string
  data: FAQ
  success?: boolean
  status_code?: number
  metadata?: unknown | null
}

export interface UpdateFAQResponse {
  message: string
  data: FAQ
  success?: boolean
  status_code?: number
  metadata?: unknown | null
}

export interface DeleteFAQResponse {
  message: string
  data?: { id: number }
  success?: boolean
  status_code?: number
  metadata?: unknown | null
}

export interface FAQFilters {
  status?: FAQStatus
  category?: string
  limit?: number
  offset?: number
}
