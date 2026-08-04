import type { GetUsersParams } from "../api/users.api"
import { buildUsersListQuery } from "../api/users.api"
import { paymentsFilterParams } from "../api/payments.api"
import { nextCalendarDay } from "./payments"
import type { ActivityLogFilters } from "../types/activity-log.types"
import type { QueryParams } from "./csv-export"

export function paymentListFiltersToExportQuery(filters: {
  status?: string
  provider?: string
  planCategory?: string
  currency?: string
  reference?: string
  /** Inclusive YYYY-MM-DD; mapped to created_from. */
  dateFrom?: string
  /** Inclusive YYYY-MM-DD; mapped to exclusive created_to. */
  dateTo?: string
}): QueryParams {
  const dateFrom = filters.dateFrom?.trim()
  const dateTo = filters.dateTo?.trim()
  return paymentsFilterParams({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.provider ? { provider: filters.provider } : {}),
    ...(filters.planCategory ? { plan_category: filters.planCategory } : {}),
    ...(filters.currency ? { currency: filters.currency } : {}),
    ...(filters.reference ? { reference: filters.reference } : {}),
    ...(dateFrom ? { created_from: dateFrom } : {}),
    ...(dateTo ? { created_to: nextCalendarDay(dateTo) } : {}),
  })
}

export function usersExportQuery(params: Omit<GetUsersParams, "page" | "page_size">): QueryParams {
  return buildUsersListQuery(params)
}

export function activityLogExportQuery(filters: ActivityLogFilters): QueryParams {
  const { limit: _limit, offset: _offset, ...rest } = filters
  return rest
}

export function teamMemberExportQuery(filters: {
  team_role?: string
  department?: string
  status?: string
  search?: string
}): QueryParams {
  const params: QueryParams = {}
  const role = filters.team_role?.trim()
  const department = filters.department?.trim()
  const status = filters.status?.trim()
  const search = filters.search?.trim()
  if (role) params.team_role = role
  if (department) params.department = department
  if (status) params.status = status
  if (search) params.search = search
  return params
}

export function subscriptionExportQuery(filters: {
  user_id?: number
  plan_id?: number
  status?: string
  plan_category?: string
  created_from?: string
  created_to?: string
  expires_from?: string
  expires_to?: string
}): QueryParams {
  const params: QueryParams = {}
  if (filters.user_id != null && Number.isFinite(filters.user_id)) {
    params.user_id = filters.user_id
  }
  if (filters.plan_id != null && Number.isFinite(filters.plan_id)) {
    params.plan_id = filters.plan_id
  }
  const status = filters.status?.trim()
  const planCategory = filters.plan_category?.trim()
  if (status) params.status = status
  if (planCategory) params.plan_category = planCategory
  if (filters.created_from?.trim()) params.created_from = filters.created_from.trim()
  if (filters.created_to?.trim()) params.created_to = filters.created_to.trim()
  if (filters.expires_from?.trim()) params.expires_from = filters.expires_from.trim()
  if (filters.expires_to?.trim()) params.expires_to = filters.expires_to.trim()
  return params
}
