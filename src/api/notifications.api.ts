import http from "./http"
import type {
  BulkInAppRequest,
  BulkSendResult,
  BulkSmsRequest,
  GetNotificationsResponse,
  GetScheduledNotificationsParams,
  ListScheduledNotificationsResponse,
  Notification,
  ScheduledNotification,
  UnreadCountResponse,
} from "../types/notification.types"
import { isScheduledNotification, parseBulkResponseData } from "../lib/notificationBulk"

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

/** DELETE /notifications/:id — remove an in-app notification. */
export const deleteNotification = (id: string) =>
  http.delete<unknown>(`/notifications/${id}`).then((res) => ({
    ...res,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))

export type BulkSendApiResult =
  | { kind: "immediate"; data: BulkSendResult; message: string }
  | { kind: "scheduled"; data: ScheduledNotification; message: string }

function parseBulkSendApiResponse(body: unknown, status: number): BulkSendApiResult {
  const envelope = isRecord(body) ? body : {}
  const message = String(envelope.message ?? "")
  const inner = unwrapEnvelopeData(body)
  const parsed = parseBulkResponseData(inner)

  if (isScheduledNotification(parsed) || status === 201) {
    return {
      kind: "scheduled",
      data: parsed as ScheduledNotification,
      message: message || "Notification scheduled",
    }
  }

  return {
    kind: "immediate",
    data: parsed as BulkSendResult,
    message: message || "Notification sent",
  }
}

export const sendBulkSms = async (data: BulkSmsRequest): Promise<BulkSendApiResult> => {
  const res = await http.post("/notifications/bulk-sms", data)
  return parseBulkSendApiResponse(res.data, res.status)
}

export const sendBulkEmail = async (formData: FormData): Promise<BulkSendApiResult> => {
  const res = await http.post("/notifications/bulk-email", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return parseBulkSendApiResponse(res.data, res.status)
}

export const sendBulkPush = async (formData: FormData): Promise<BulkSendApiResult> => {
  const res = await http.post("/notifications/bulk-push", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return parseBulkSendApiResponse(res.data, res.status)
}

export const sendBulkInApp = async (data: BulkInAppRequest): Promise<BulkSendApiResult> => {
  const res = await http.post("/notifications/bulk-in-app", data)
  return parseBulkSendApiResponse(res.data, res.status)
}

function normalizeScheduledNotification(raw: unknown): ScheduledNotification | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!id) return null
  return {
    id,
    channel: String(raw.channel ?? "") as ScheduledNotification["channel"],
    title: raw.title != null ? String(raw.title) : undefined,
    message: String(raw.message ?? ""),
    html: raw.html != null ? String(raw.html) : undefined,
    scheduled_at: String(raw.scheduled_at ?? ""),
    status: String(raw.status ?? "pending") as ScheduledNotification["status"],
    target_user_ids: Array.isArray(raw.target_user_ids)
      ? raw.target_user_ids.map((v) => Number(v))
      : undefined,
    target_role: raw.target_role != null ? String(raw.target_role) : undefined,
    target_raw: isRecord(raw.target_raw)
      ? {
          phones: Array.isArray(raw.target_raw.phones)
            ? raw.target_raw.phones.map(String)
            : undefined,
          emails: Array.isArray(raw.target_raw.emails)
            ? raw.target_raw.emails.map(String)
            : undefined,
          type: raw.target_raw.type != null ? String(raw.target_raw.type) : undefined,
          level: raw.target_raw.level != null ? String(raw.target_raw.level) : undefined,
        }
      : undefined,
    attempt_count: raw.attempt_count != null ? Number(raw.attempt_count) : undefined,
    last_error: raw.last_error != null ? String(raw.last_error) : undefined,
    processing_started_at:
      raw.processing_started_at != null ? String(raw.processing_started_at) : null,
    sent_at: raw.sent_at != null ? String(raw.sent_at) : null,
    cancelled_at: raw.cancelled_at != null ? String(raw.cancelled_at) : null,
    created_by: raw.created_by != null ? Number(raw.created_by) : undefined,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  }
}

function parseScheduledList(body: unknown): ListScheduledNotificationsResponse {
  const inner = unwrapEnvelopeData(body)
  if (!isRecord(inner)) {
    return { scheduled_notifications: [], total_count: 0, limit: 20, page: 1 }
  }

  const rows = Array.isArray(inner.scheduled_notifications)
    ? inner.scheduled_notifications
    : []
  const scheduled_notifications = rows
    .map(normalizeScheduledNotification)
    .filter((row): row is ScheduledNotification => row !== null)

  return {
    scheduled_notifications,
    total_count: Number(inner.total_count ?? scheduled_notifications.length),
    limit: Number(inner.limit ?? 20),
    page: Number(inner.page ?? 1),
  }
}

export const getScheduledNotifications = (params: GetScheduledNotificationsParams = {}) =>
  http
    .get<unknown>("/notifications/scheduled", { params })
    .then((res) => ({ ...res, data: parseScheduledList(res.data) }))

export const getScheduledNotificationById = (id: number) =>
  http.get<unknown>(`/notifications/scheduled/${id}`).then((res) => ({
    ...res,
    data: normalizeScheduledNotification(unwrapEnvelopeData(res.data)),
  }))

export const cancelScheduledNotification = (id: number) =>
  http.post<unknown>(`/notifications/scheduled/${id}/cancel`).then((res) => ({
    ...res,
    data: normalizeScheduledNotification(unwrapEnvelopeData(res.data)),
  }))
