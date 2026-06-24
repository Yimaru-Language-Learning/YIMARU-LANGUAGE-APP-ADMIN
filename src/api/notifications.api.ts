import http from "./http"
import type {
  BulkInAppRequest,
  BulkSendResult,
  BulkSmsRequest,
  GetAllNotificationsParams,
  GetNotificationsResponse,
  GetScheduledNotificationsParams,
  ListAllNotificationsResponse,
  ListScheduledNotificationsResponse,
  Notification,
  ScheduledNotification,
  UnreadCountResponse,
} from "../types/notification.types"
import { isNumericNotificationId } from "../types/notification.types"
import { isScheduledNotification, parseBulkResponseData } from "../lib/notificationBulk"
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/tablePagination"

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

function pickNotificationText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value != null && String(value).trim()) return String(value)
  }
  return undefined
}

function normalizePayload(
  raw: unknown,
  fallback?: Record<string, unknown>,
): Notification["payload"] {
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return normalizePayload(JSON.parse(trimmed), fallback)
      } catch {
        return { tags: null }
      }
    }
    return { message: trimmed, tags: null }
  }

  const record = isRecord(raw) ? raw : {}
  const content = isRecord(record.content) ? record.content : record
  const fb = fallback ?? {}
  const fbContent = isRecord(fb.content) ? fb.content : fb

  const tags = Array.isArray(content.tags)
    ? content.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
    : Array.isArray(fb.tags)
      ? fb.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
      : null

  return {
    headline: pickNotificationText(
      content.headline,
      content.title,
      fb.headline,
      fb.title,
      fbContent.headline,
      fbContent.title,
    ),
    title: pickNotificationText(
      content.title,
      content.headline,
      fb.title,
      fb.headline,
      fbContent.title,
      fbContent.headline,
    ),
    message: pickNotificationText(
      content.message,
      content.body,
      content.text,
      fb.message,
      fb.body,
      fb.text,
      fbContent.message,
      fbContent.body,
      fbContent.text,
    ),
    body: pickNotificationText(
      content.body,
      content.message,
      fb.body,
      fb.message,
      fbContent.body,
      fbContent.message,
    ),
    tags,
  }
}

export function unwrapRealtimeNotification(raw: unknown): unknown {
  if (!isRecord(raw)) return raw

  // Already a notification row (list API or inner CREATED_NOTIFICATION payload).
  if (raw.id != null || raw.notification_id != null) {
    return raw
  }

  if ("notification" in raw && isRecord(raw.notification)) {
    return raw.notification
  }

  const envelopeType = String(raw.type ?? raw.event ?? "")
  const isCreatedEvent =
    envelopeType === "CREATED_NOTIFICATION" ||
    envelopeType === "NOTIFICATION_CREATED" ||
    envelopeType === "notification"

  // Backend WS broadcast: { type: "CREATED_NOTIFICATION", payload: { id, ... } }
  if (isCreatedEvent && isRecord(raw.payload)) {
    return raw.payload
  }

  if (isRecord(raw.data)) {
    return raw.data
  }

  return raw
}

export function normalizeNotification(raw: unknown): Notification | null {
  if (!isRecord(raw)) return null
  const id = String(raw.id ?? raw.notification_id ?? "")
  if (!id) return null

  return {
    id,
    recipient_id: Number(raw.recipient_id ?? raw.user_id ?? 0),
    receiver_type: raw.receiver_type != null ? String(raw.receiver_type) : undefined,
    type: String(raw.type ?? ""),
    level: String(raw.level ?? ""),
    error_severity: String(raw.error_severity ?? ""),
    reciever: String(raw.reciever ?? ""),
    is_read: Boolean(raw.is_read),
    delivery_status: String(raw.delivery_status ?? ""),
    delivery_channel: String(raw.delivery_channel ?? ""),
    payload: normalizePayload(raw.payload, raw),
    timestamp: String(raw.timestamp ?? raw.created_at ?? ""),
    expires: String(raw.expires ?? ""),
    image: String(raw.image ?? ""),
  }
}

/** Parse a WebSocket payload into a notification, with fallbacks for partial events. */
export function parseRealtimeNotification(raw: unknown): Notification | null {
  const unwrapped = unwrapRealtimeNotification(raw)
  const normalized = normalizeNotification(unwrapped)
  if (normalized) return normalized
  if (!isRecord(unwrapped)) return null

  const payload = normalizePayload(unwrapped.payload, unwrapped)
  const hasContent = Boolean(
    payload.title || payload.headline || payload.message || payload.body,
  )
  if (!hasContent && unwrapped.id == null && unwrapped.notification_id == null) {
    return null
  }

  return {
    id: String(unwrapped.id ?? unwrapped.notification_id ?? crypto.randomUUID()),
    recipient_id: Number(unwrapped.recipient_id ?? 0),
    receiver_type:
      unwrapped.receiver_type != null ? String(unwrapped.receiver_type) : undefined,
    type: String(unwrapped.type ?? ""),
    level: String(unwrapped.level ?? ""),
    error_severity: String(unwrapped.error_severity ?? ""),
    reciever: String(unwrapped.reciever ?? ""),
    is_read: Boolean(unwrapped.is_read),
    delivery_status: String(unwrapped.delivery_status ?? ""),
    delivery_channel: String(unwrapped.delivery_channel ?? "in_app"),
    payload,
    timestamp: String(
      unwrapped.timestamp ?? unwrapped.created_at ?? new Date().toISOString(),
    ),
    expires: String(unwrapped.expires ?? ""),
    image: String(unwrapped.image ?? ""),
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

function extractNotificationsPagePayload(body: unknown): Record<string, unknown> | null {
  const candidates: unknown[] = [body]
  if (isRecord(body)) {
    if ("data" in body || "Data" in body) {
      candidates.push(body.data ?? body.Data)
    }
  }

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue
    if (Array.isArray(candidate.notifications)) return candidate
    if (isRecord(candidate.data) && Array.isArray(candidate.data.notifications)) {
      return candidate.data
    }
  }

  return null
}

function parseAllNotificationsListData(
  body: unknown,
  page: number,
  limit: number,
): ListAllNotificationsResponse {
  const inner = extractNotificationsPagePayload(body)
  if (!inner) {
    return { notifications: [], total_count: 0, page, limit }
  }

  const rows = inner.notifications as unknown[]
  const notifications = rows
    .map(normalizeNotification)
    .filter((n): n is Notification => n !== null)

  return {
    notifications,
    total_count: Number(inner.total_count ?? notifications.length),
    page: Number(inner.page ?? page),
    limit: Number(inner.limit ?? limit),
  }
}

export const getNotifications = (limit = 10, offset = 0) =>
  http.get<unknown>("/notifications", { params: { limit, offset } }).then((res) => ({
    ...res,
    data: parseNotificationsListData(res.data, limit, offset),
  }))

export const getAllNotifications = (params: GetAllNotificationsParams = {}) => {
  const page = params.page ?? 1
  const limit = params.limit ?? DEFAULT_TABLE_PAGE_SIZE
  const query: Record<string, string | number | boolean> = { page, limit }
  if (params.channel) query.channel = params.channel
  if (params.type?.trim()) query.type = params.type.trim()
  if (params.user_id != null && Number.isFinite(params.user_id)) query.user_id = params.user_id
  if (params.is_read != null) query.is_read = params.is_read
  if (params.after) query.after = params.after
  if (params.before) query.before = params.before

  return http.get<unknown>("/notifications/all", { params: query }).then((res) => ({
    ...res,
    data: parseAllNotificationsListData(res.data, page, limit),
  }))
}

export const getNotificationById = (id: string) =>
  http.get<unknown>(`/notifications/${id}`).then((res) => ({
    ...res,
    data: normalizeNotification(unwrapEnvelopeData(res.data)),
  }))

export async function resolveNotificationDetail(
  notification: Notification,
): Promise<Notification> {
  if (!isNumericNotificationId(notification.id)) {
    return notification
  }
  const res = await getNotificationById(notification.id)
  return res.data ?? notification
}

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
    email_template_slug:
      raw.email_template_slug != null ? String(raw.email_template_slug) : undefined,
    email_template_variables: isRecord(raw.email_template_variables)
      ? Object.fromEntries(
          Object.entries(raw.email_template_variables).map(([k, v]) => [k, String(v)]),
        )
      : undefined,
    scheduled_at: String(raw.scheduled_at ?? ""),
    status: String(raw.status ?? "pending") as ScheduledNotification["status"],
    target_user_ids: Array.isArray(raw.target_user_ids)
      ? raw.target_user_ids.map((v) => Number(v))
      : undefined,
    target_role: raw.target_role != null ? String(raw.target_role) : undefined,
    target_team_member_ids: Array.isArray(raw.target_team_member_ids)
      ? raw.target_team_member_ids.map((v) => Number(v))
      : Array.isArray(raw.target_raw?.team_member_ids)
        ? (raw.target_raw as { team_member_ids: unknown[] }).team_member_ids.map((v) =>
            Number(v),
          )
        : undefined,
    target_team_role:
      raw.target_team_role != null
        ? String(raw.target_team_role)
        : raw.target_raw?.team_role != null
          ? String((raw.target_raw as { team_role: unknown }).team_role)
          : undefined,
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
          team_member_ids: Array.isArray(raw.target_raw.team_member_ids)
            ? raw.target_raw.team_member_ids.map((v) => Number(v))
            : undefined,
          team_role:
            raw.target_raw.team_role != null ? String(raw.target_raw.team_role) : undefined,
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
