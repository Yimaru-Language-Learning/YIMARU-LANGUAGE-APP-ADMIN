import http from "./http"
import type {
  AdminApplySubscriptionBody,
  AdminSubscriptionMutationResponse,
  AdminSubscriptionRes,
} from "../types/adminSubscription.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeSubscriptionRes(raw: unknown): AdminSubscriptionRes | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  const userId = Number(raw.user_id)
  const planId = Number(raw.plan_id)
  if (!Number.isFinite(id) || !Number.isFinite(userId) || !Number.isFinite(planId)) return null

  return {
    id,
    user_id: userId,
    plan_id: planId,
    plan_name: raw.plan_name != null ? String(raw.plan_name) : undefined,
    starts_at: String(raw.starts_at ?? ""),
    expires_at: String(raw.expires_at ?? ""),
    status: String(raw.status ?? ""),
    payment_reference:
      raw.payment_reference != null ? String(raw.payment_reference) : undefined,
    payment_method: raw.payment_method != null ? String(raw.payment_method) : undefined,
    auto_renew: Boolean(raw.auto_renew),
    duration_value:
      raw.duration_value != null && Number.isFinite(Number(raw.duration_value))
        ? Number(raw.duration_value)
        : undefined,
    duration_unit: raw.duration_unit != null ? String(raw.duration_unit) : undefined,
    price:
      raw.price != null && Number.isFinite(Number(raw.price)) ? Number(raw.price) : undefined,
    currency: raw.currency != null ? String(raw.currency) : undefined,
    created_at: String(raw.created_at ?? ""),
  }
}

function mutationResult(res: { data: unknown; status?: number }) {
  const body = isRecord(res.data) ? res.data : null
  const plan = normalizeSubscriptionRes(body?.data ?? body)
  return {
    ...res,
    data: plan,
    message: body ? String(body.message ?? "") : undefined,
    httpStatus: res.status,
  }
}

/**
 * POST /admin/users/:user_id/subscriptions/extend
 * Unified grant-or-extend: no active sub in plan category → grant (201);
 * active in category → extend one period of selected plan (200).
 * Optional body.record_payment (default true) controls whether a SUCCESS
 * payment at the plan price is recorded.
 */
export const adminApplySubscription = (userId: number, body: AdminApplySubscriptionBody) =>
  http
    .post<AdminSubscriptionMutationResponse>(
      `/admin/users/${userId}/subscriptions/extend`,
      body,
    )
    .then(mutationResult)

/** @deprecated Use adminApplySubscription */
export const adminGrantSubscription = adminApplySubscription

/** POST /admin/subscriptions/:id/cancel — admin cancel (not learner self-cancel). */
export const adminCancelSubscription = (subscriptionId: number) =>
  http
    .post<AdminSubscriptionMutationResponse>(`/admin/subscriptions/${subscriptionId}/cancel`)
    .then(mutationResult)
