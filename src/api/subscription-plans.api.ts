import http from "./http"
import type {
  CreateSubscriptionPlanPayload,
  SubscriptionPlan,
  SubscriptionPlanMutationResponse,
  SubscriptionPlansListResponse,
  UpdateSubscriptionPlanPayload,
} from "../types/subscription.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeSubscriptionPlan(raw: unknown): SubscriptionPlan | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  return {
    id,
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    duration_value: Number(raw.duration_value ?? 0),
    duration_unit: String(raw.duration_unit ?? "MONTH"),
    price: Number(raw.price ?? 0),
    currency: String(raw.currency ?? "ETB"),
    is_active: Boolean(raw.is_active ?? true),
    created_at: String(raw.created_at ?? ""),
  }
}

export function parseSubscriptionPlansList(body: unknown): SubscriptionPlan[] {
  if (Array.isArray(body)) {
    return body.map(normalizeSubscriptionPlan).filter((p): p is SubscriptionPlan => p !== null)
  }
  if (isRecord(body) && Array.isArray(body.data)) {
    return body.data
      .map(normalizeSubscriptionPlan)
      .filter((p): p is SubscriptionPlan => p !== null)
  }
  return []
}

export function parseSubscriptionPlanMutation(body: unknown): SubscriptionPlan | null {
  if (isRecord(body) && body.data != null) {
    return normalizeSubscriptionPlan(body.data)
  }
  return normalizeSubscriptionPlan(body)
}

export interface GetSubscriptionPlansOptions {
  /**
   * When true or omitted, returns active plans only (`GET /subscription-plans`).
   * Pass false for admin settings/dashboard to include inactive plans.
   */
  active_only?: boolean
}

export const getSubscriptionPlans = (options?: GetSubscriptionPlansOptions) => {
  const activeOnly = options?.active_only ?? true
  return http
    .get<SubscriptionPlansListResponse | SubscriptionPlan[]>("/subscription-plans", {
      params: activeOnly ? undefined : { active_only: false },
    })
    .then((res) => {
      const plans = parseSubscriptionPlansList(res.data)
      return {
        ...res,
        data: plans,
      }
    })
}

function mutationResult(res: { data: unknown }) {
  const plan = parseSubscriptionPlanMutation(res.data)
  return {
    ...res,
    data: plan,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }
}

export const createSubscriptionPlan = (payload: CreateSubscriptionPlanPayload) =>
  http
    .post<SubscriptionPlanMutationResponse | SubscriptionPlan>("/subscription-plans", payload)
    .then(mutationResult)

export const updateSubscriptionPlan = (id: number, payload: UpdateSubscriptionPlanPayload) =>
  http
    .put<SubscriptionPlanMutationResponse | SubscriptionPlan>(`/subscription-plans/${id}`, payload)
    .then(mutationResult)

export const deleteSubscriptionPlan = (id: number) =>
  http.delete<{ message?: string }>(`/subscription-plans/${id}`).then((res) => ({
    ...res,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))
