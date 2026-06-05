import http from "./http"
import type {
  GetNotificationsResponse,
  Notification,
  UnreadCountResponse,
} from "../types/notification.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function unwrapEnvelopeData(body: unknown): unknown {
  if (!isRecord(body)) return body
  if ("data" in body || "Data" in body) {
    return body.data ?? body.Data
  }
  return body
}

function normalizePayload(raw: unknown): Notification["payload"] {
  if (!isRecord(raw)) {
    return { tags: null }
  }
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
    : null
  return {
    headline: raw.headline != null ? String(raw.headline) : undefined,
    title: raw.title != null ? String(raw.title) : undefined,
    message: raw.message != null ? String(raw.message) : undefined,
    body: raw.body != null ? String(raw.body) : undefined,
    tags,
  }
}

export function normalizeNotification(raw: unknown): Notification | null {
  if (!isRecord(raw)) return null
  const id = String(raw.id ?? "")
  if (!id) return null

  return {
    id,
    recipient_id: Number(raw.recipient_id ?? 0),
    receiver_type: raw.receiver_type != null ? String(raw.receiver_type) : undefined,
    type: String(raw.type ?? ""),
    level: String(raw.level ?? ""),
    error_severity: String(raw.error_severity ?? ""),
    reciever: String(raw.reciever ?? ""),
    is_read: Boolean(raw.is_read),
    delivery_status: String(raw.delivery_status ?? ""),
    delivery_channel: String(raw.delivery_channel ?? ""),
    payload: normalizePayload(raw.payload),
    timestamp: String(raw.timestamp ?? ""),
    expires: String(raw.expires ?? ""),
    image: String(raw.image ?? ""),
  }
}

function parseNotificationsListData(body: unknown, limit: number, offset: number): GetNotificationsResponse {
  const inner = unwrapEnvelopeData(body)
  if (!isRecord(inner)) {
    return { notifications: [], total_count: 0, limit, offset }
  }

  const rows = Array.isArray(inner.notifications) ? inner.notifications : []
  const notifications = rows
    .map(normalizeNotification)
    .filter((n): n is Notification => n !== null)

  return {
    notifications,
    total_count: Number(inner.total_count ?? notifications.length),
    limit: Number(inner.limit ?? limit),
    offset: Number(inner.offset ?? offset),
  }
}

function parseUnreadCount(body: unknown): UnreadCountResponse {
  const inner = unwrapEnvelopeData(body)
  if (!isRecord(inner)) return { unread: 0 }
  return { unread: Number(inner.unread ?? 0) }
}

export const getNotifications = (limit = 10, offset = 0) =>
  http.get<unknown>("/notifications", { params: { limit, offset } }).then((res) => ({
    ...res,
    data: parseNotificationsListData(res.data, limit, offset),
  }))

export const getNotificationById = (id: string) =>
  http.get<unknown>(`/notifications/${id}`).then((res) => ({
    ...res,
    data: normalizeNotification(unwrapEnvelopeData(res.data)),
  }))

export const getUnreadCount = () =>
  http.get<unknown>("/notifications/unread").then((res) => ({
    ...res,
    data: parseUnreadCount(res.data),
  }))

export const markAsRead = (id: string) =>
  http.patch(`/notifications/${id}/read`)

export const markAsUnread = (id: string) =>
  http.patch(`/notifications/${id}/unread`)

export const markAllRead = () =>
  http.post("/notifications/mark-all-read")

export const markAllUnread = () =>
  http.post("/notifications/mark-all-unread")

export const sendBulkSms = (data: { message: string; user_ids: number[]; scheduled_at?: string }) =>
  http.post("/notifications/bulk-sms", data)

export const sendBulkEmail = (formData: FormData) =>
  http.post("/notifications/bulk-email", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

export const sendBulkPush = (formData: FormData) =>
  http.post("/notifications/bulk-push", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
