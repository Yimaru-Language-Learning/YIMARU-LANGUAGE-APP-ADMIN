export interface NotificationPayload {
  headline?: string
  title?: string
  message?: string
  body?: string
  tags: string[] | null
}

export interface Notification {
  id: string
  recipient_id: number
  receiver_type?: string
  type: string
  level: string
  error_severity: string
  reciever: string
  is_read: boolean
  delivery_status: string
  delivery_channel: string
  payload: NotificationPayload
  timestamp: string
  expires: string
  image: string
}

export function getNotificationTitle(notification: Notification): string {
  const payload: any = notification?.payload ?? {}
  return (
    payload.headline ??
    payload.title ??
    (notification as any)?.headline ??
    (notification as any)?.title ??
    ""
  )
}

export function getNotificationMessage(notification: Notification): string {
  const payload: any = notification?.payload ?? {}
  return (
    payload.message ??
    payload.body ??
    (notification as any)?.message ??
    (notification as any)?.body ??
    ""
  )
}

/** Platform user notifications use numeric IDs; team-member notifications use UUIDs. */
export function isNumericNotificationId(id: string): boolean {
  return /^\d+$/.test(id.trim())
}

export function hasNotificationContent(notification: Notification): boolean {
  return Boolean(getNotificationTitle(notification) || getNotificationMessage(notification))
}

export interface GetNotificationsResponse {
  notifications: Notification[]
  total_count: number
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  unread: number
}

export type NotificationChannel = "sms" | "email" | "push" | "in_app"

export type ScheduledNotificationStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled"

export type InAppNotificationLevel = "info" | "warning" | "error" | "success"

export type PlatformRole =
  | "STUDENT"
  | "OPEN_LEARNER"
  | "INSTRUCTOR"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "SUPPORT"

export type TeamRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CONTENT_MANAGER"
  | "SUPPORT_AGENT"
  | "INSTRUCTOR"
  | "FINANCE"
  | "HR"
  | "ANALYST"

export interface BulkSendResult {
  total_recipients?: number
  sent: number
  failed: number
  target_users?: number
  devices_targeted?: number
  image?: string
}

export interface ScheduledNotificationTargetRaw {
  phones?: string[]
  emails?: string[]
  type?: string
  level?: string
  team_member_ids?: number[]
  team_role?: string
}

export interface ScheduledNotification {
  id: number
  channel: NotificationChannel
  title?: string
  message: string
  html?: string
  email_template_slug?: string
  email_template_variables?: Record<string, string>
  scheduled_at: string
  status: ScheduledNotificationStatus
  target_user_ids?: number[]
  target_role?: string
  target_team_member_ids?: number[]
  target_team_role?: string
  target_raw?: ScheduledNotificationTargetRaw
  attempt_count?: number
  last_error?: string
  processing_started_at?: string | null
  sent_at?: string | null
  cancelled_at?: string | null
  created_by?: number
  created_at: string
  updated_at: string
}

export interface ListScheduledNotificationsResponse {
  scheduled_notifications: ScheduledNotification[]
  total_count: number
  limit: number
  page: number
}

export interface BulkSmsRequest {
  message: string
  user_ids?: number[]
  role?: string
  phone_numbers?: string[]
  scheduled_at?: string
}

export interface BulkInAppRequest {
  title: string
  message: string
  user_ids?: number[]
  role?: string
  team_member_ids?: number[]
  team_role?: string
  scheduled_at?: string
  type?: string
  level?: InAppNotificationLevel
}

export interface GetScheduledNotificationsParams {
  status?: ScheduledNotificationStatus
  channel?: NotificationChannel
  after?: string
  before?: string
  limit?: number
  page?: number
}

export interface GetAllNotificationsParams {
  page?: number
  limit?: number
  channel?: NotificationChannel
  type?: string
  user_id?: number
  is_read?: boolean
  after?: string
  before?: string
}

export interface ListAllNotificationsResponse {
  notifications: Notification[]
  total_count: number
  page: number
  limit: number
}
