import { parseRealtimeNotification } from "../api/notifications.api"
import type { Notification } from "../types/notification.types"
import { getAccessToken, TEAM_SESSION_UPDATED_EVENT } from "./teamAuthStorage"

const RECONNECT_MS = 5000

export const NOTIFICATION_REALTIME_EVENT = "yimaru:notification-realtime"

function getWsUrl() {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const wsBase = base.replace(/^https/, "wss").replace(/^http/, "ws")
  const token = getAccessToken() ?? ""
  return `${wsBase}/ws/connect?token=${encodeURIComponent(token)}`
}

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let intentionalClose = false
let connectAttempt = 0
let sessionListenerAttached = false

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function dispatchRealtimeNotification(notification: Notification) {
  window.dispatchEvent(
    new CustomEvent<Notification>(NOTIFICATION_REALTIME_EVENT, { detail: notification }),
  )
  window.dispatchEvent(new Event("notifications-updated"))
}

function handleMessage(event: MessageEvent) {
  try {
    const parsed = JSON.parse(event.data as string)
    const notification = parseRealtimeNotification(parsed)
    if (!notification) return
    dispatchRealtimeNotification(notification)
  } catch {
    // ignore malformed messages
  }
}

function scheduleReconnect() {
  clearReconnectTimer()
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectNotificationsWebSocket()
  }, RECONNECT_MS)
}

export function disconnectNotificationsWebSocket() {
  intentionalClose = true
  clearReconnectTimer()
  const socket = ws
  ws = null
  if (!socket) return
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close()
  }
}

export function connectNotificationsWebSocket() {
  const token = getAccessToken()?.trim()
  if (!token) return

  disconnectNotificationsWebSocket()
  intentionalClose = false

  const attempt = ++connectAttempt
  const socket = new WebSocket(getWsUrl())
  ws = socket

  socket.onmessage = handleMessage

  socket.onclose = () => {
    if (connectAttempt !== attempt) return
    if (ws === socket) ws = null
    if (intentionalClose) return
    scheduleReconnect()
  }

  if (!sessionListenerAttached) {
    sessionListenerAttached = true
    window.addEventListener(TEAM_SESSION_UPDATED_EVENT, () => {
      connectNotificationsWebSocket()
    })
  }
}

export function ensureNotificationsWebSocket() {
  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    connectNotificationsWebSocket()
  }
}
