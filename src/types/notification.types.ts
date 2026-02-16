export interface NotificationPayload {
  headline: string
  message: string
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

export interface GetNotificationsResponse {
  notifications: Notification[]
  total_count: number
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  unread: number
}
