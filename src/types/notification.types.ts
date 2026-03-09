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

export interface GetNotificationsResponse {
  notifications: Notification[]
  total_count: number
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  unread: number
}
