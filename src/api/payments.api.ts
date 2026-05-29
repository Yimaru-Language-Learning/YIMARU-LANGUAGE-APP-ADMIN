import http from "./http"
import type { GetPaymentsParams, Payment, PaymentsListData, PaymentsListResponse } from "../types/payment.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizePayment(raw: unknown): Payment | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  const paid_at = raw.paid_at
  const expires_at = raw.expires_at

  return {
    id,
    user_id: Number(raw.user_id ?? 0),
    plan_id: Number(raw.plan_id ?? 0),
    subscription_id: Number(raw.subscription_id ?? 0),
    session_id: String(raw.session_id ?? ""),
    transaction_id: String(raw.transaction_id ?? ""),
    nonce: String(raw.nonce ?? ""),
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "ETB"),
    payment_method: String(raw.payment_method ?? ""),
    status: String(raw.status ?? ""),
    payment_url: String(raw.payment_url ?? ""),
    plan_name: String(raw.plan_name ?? ""),
    plan_category: String(raw.plan_category ?? ""),
    user_email: String(raw.user_email ?? ""),
    user_first_name: String(raw.user_first_name ?? ""),
    user_last_name: String(raw.user_last_name ?? ""),
    paid_at: paid_at == null || paid_at === "" ? null : String(paid_at),
    expires_at: expires_at == null || expires_at === "" ? null : String(expires_at),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  }
}

export function parsePaymentsList(body: unknown): PaymentsListData {
  const empty: PaymentsListData = {
    payments: [],
    total_count: 0,
    limit: 0,
    offset: 0,
  }

  if (isRecord(body)) {
    const data = body.data
    if (isRecord(data) && Array.isArray(data.payments)) {
      const payments = data.payments
        .map(normalizePayment)
        .filter((p): p is Payment => p !== null)
      const total_count = Number(data.total_count ?? payments.length)
      const limit = Number(data.limit ?? payments.length)
      const offset = Number(data.offset ?? 0)
      return {
        payments,
        total_count: Number.isFinite(total_count) ? total_count : payments.length,
        limit: Number.isFinite(limit) ? limit : payments.length,
        offset: Number.isFinite(offset) ? offset : 0,
      }
    }
    if (Array.isArray(data)) {
      const payments = data.map(normalizePayment).filter((p): p is Payment => p !== null)
      return { payments, total_count: payments.length, limit: payments.length, offset: 0 }
    }
  }

  if (Array.isArray(body)) {
    const payments = body.map(normalizePayment).filter((p): p is Payment => p !== null)
    return { payments, total_count: payments.length, limit: payments.length, offset: 0 }
  }

  return empty
}

function buildQueryParams(params: GetPaymentsParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    limit: Math.min(100, Math.max(1, params.limit ?? 20)),
    offset: Math.max(0, params.offset ?? 0),
  }
  if (params.status?.trim()) query.status = params.status.trim()
  if (params.provider?.trim()) query.provider = params.provider.trim()
  if (params.plan_category?.trim()) query.plan_category = params.plan_category.trim()
  return query
}

export const getPayments = (params: GetPaymentsParams = {}) =>
  http.get<PaymentsListResponse>("/admin/payments", { params: buildQueryParams(params) }).then((res) => {
    const parsed = parsePaymentsList(res.data)
    return {
      ...res,
      data: parsed,
      message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
    }
  })
