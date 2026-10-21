import http from "./http"
import type {
  CreateInfluencerInput,
  Influencer,
  InfluencerClick,
  InfluencerRevenueAnalytics,
  InfluencerStats,
  InfluencerSystemSummary,
  ListInfluencersParams,
  ReferredUserDetail,
  UpdateInfluencerInput,
} from "../types/influencer.types"

export interface PaginatedResponse<T> {
  status_code: number
  message: string
  data: T[]
  pagination?: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
  }
}

export interface ApiResponse<T> {
  status_code: number
  message: string
  data: T
}

export async function listInfluencers(params: ListInfluencersParams = {}) {
  const query: Record<string, string | number> = {
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(100, Math.max(1, params.limit ?? 20)),
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status?.trim()) query.status = params.status.trim()
  if (params.platform?.trim()) query.platform = params.platform.trim()

  const res = await http.get<PaginatedResponse<Influencer>>("/admin/influencers", {
    params: query,
  })
  return res.data
}

export async function getInfluencer(id: number) {
  const res = await http.get<ApiResponse<Influencer>>(`/admin/influencers/${id}`)
  return res.data.data
}

export async function createInfluencer(payload: CreateInfluencerInput) {
  const res = await http.post<ApiResponse<Influencer>>("/admin/influencers", payload)
  return res.data.data
}

export async function updateInfluencer(id: number, payload: UpdateInfluencerInput) {
  const res = await http.put<ApiResponse<Influencer>>(`/admin/influencers/${id}`, payload)
  return res.data.data
}

export async function deleteInfluencer(id: number) {
  const res = await http.delete<ApiResponse<null>>(`/admin/influencers/${id}`)
  return res.data
}

export async function getInfluencerStats(id: number) {
  const res = await http.get<ApiResponse<InfluencerStats>>(`/admin/influencers/${id}/stats`)
  return res.data.data
}

export async function listInfluencerClicks(
  id: number,
  params: { page?: number; limit?: number } = {},
) {
  const query = {
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(100, Math.max(1, params.limit ?? 20)),
  }
  const res = await http.get<PaginatedResponse<InfluencerClick>>(
    `/admin/influencers/${id}/clicks`,
    { params: query },
  )
  return res.data
}

export async function getInfluencerRevenue(
  id: number,
  params: { start_date?: string; end_date?: string } = {},
) {
  const query: Record<string, string> = {}
  if (params.start_date) query.start_date = params.start_date
  if (params.end_date) query.end_date = params.end_date

  const res = await http.get<ApiResponse<InfluencerRevenueAnalytics>>(
    `/admin/influencers/${id}/revenue`,
    { params: query },
  )
  return res.data.data
}

export async function listReferredUsers(
  id: number,
  params: { page?: number; limit?: number } = {},
) {
  const query = {
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(100, Math.max(1, params.limit ?? 20)),
  }
  const res = await http.get<PaginatedResponse<ReferredUserDetail>>(
    `/admin/influencers/${id}/referred-users`,
    { params: query },
  )
  return res.data
}

export async function getSystemRevenueSummary(
  params: { start_date?: string; end_date?: string } = {},
) {
  const query: Record<string, string> = {}
  if (params.start_date) query.start_date = params.start_date
  if (params.end_date) query.end_date = params.end_date

  const res = await http.get<ApiResponse<InfluencerSystemSummary>>(
    "/admin/influencers/analytics/summary",
    { params: query },
  )
  return res.data.data
}
