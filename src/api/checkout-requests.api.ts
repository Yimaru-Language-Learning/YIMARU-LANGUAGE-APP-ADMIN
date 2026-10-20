import http from "./http"

export interface CheckoutRequest {
  id: number
  user_id: number
  name: string
  email: string
  created_at: string
  metadata: {
    source?: string
    app_platform?: string
    channel?: string
    category?: string
    phone_number?: string
    destination_hint?: string
    status?: string
    legacy?: boolean
  }
}

export async function getCheckoutRequests(params: {
  search: string; channel: string; source: string; limit: number; offset: number
}, signal: AbortSignal): Promise<{ requests: CheckoutRequest[]; total_count: number }> {
  const res = await http.get("/subscriptions/checkout-link-requests", { params, signal })
  const data = res.data?.data
  if (!data || !Array.isArray(data.requests) || !Number.isFinite(data.total_count)) {
    throw new Error("Invalid checkout request history")
  }
  return data
}
