import { useEffect, useState, useCallback, useRef } from "react"
import { getNotifications, getUnreadCount, markAsRead, markAsUnread, markAllRead } from "../api/notifications.api"
import type { Notification } from "../types/notification.types"

const MAX_DROPDOWN = 5
const RECONNECT_MS = 5000

function getWsUrl() {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const wsBase = base.replace(/^https/, "wss").replace(/^http/, "ws")
  const token = localStorage.getItem("access_token") ?? ""
  return `${wsBase}/ws/connect?token=${encodeURIComponent(token)}`
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const intentionalCloseRef = useRef(false)
  const connectAttemptRef = useRef(0)

  const dispatchUpdate = () => {
    window.dispatchEvent(new Event("notifications-updated"))
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [notifRes, countRes] = await Promise.all([
        getNotifications(5, 0),
        getUnreadCount(),
      ])
      if (!mountedRef.current) return
      setNotifications(notifRes.data.notifications ?? [])
      setUnreadCount(countRes.data.unread)
    } catch {
      // silently fail
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }, [])

  const disconnectWs = useCallback(
    (intentional: boolean) => {
      intentionalCloseRef.current = intentional
      clearReconnectTimer()
      const ws = wsRef.current
      wsRef.current = null
      if (!ws) return
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    },
    [clearReconnectTimer],
  )

  const connectWs = useCallback(() => {
    if (!mountedRef.current) return

    const token = localStorage.getItem("access_token")?.trim()
    if (!token) return

    disconnectWs(true)
    intentionalCloseRef.current = false

    const attempt = ++connectAttemptRef.current
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data)
        const notif: Notification = {
          id: raw.id ?? crypto.randomUUID(),
          recipient_id: raw.recipient_id ?? 0,
          type: raw.type ?? "",
          level: raw.level ?? "",
          error_severity: raw.error_severity ?? "",
          reciever: raw.reciever ?? "",
          is_read: raw.is_read ?? false,
          delivery_status: raw.delivery_status ?? "",
          delivery_channel: raw.delivery_channel ?? "",
          payload: {
            headline: raw.payload?.headline ?? raw.payload?.title ?? raw.headline ?? raw.title ?? "",
            message: raw.payload?.message ?? raw.payload?.body ?? raw.message ?? raw.body ?? "",
            tags: raw.payload?.tags ?? raw.tags ?? null,
          },
          timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
          expires: raw.expires ?? "",
          image: raw.image ?? "",
        }
        setNotifications((prev) => [notif, ...prev].slice(0, MAX_DROPDOWN))
        setUnreadCount((prev) => prev + 1)
        dispatchUpdate()
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (connectAttemptRef.current !== attempt) return
      if (wsRef.current === ws) wsRef.current = null
      if (!mountedRef.current || intentionalCloseRef.current) return
      clearReconnectTimer()
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connectWs()
      }, RECONNECT_MS)
    }
  }, [clearReconnectTimer, disconnectWs])

  useEffect(() => {
    mountedRef.current = true
    intentionalCloseRef.current = false
    fetchData()
    connectWs()

    return () => {
      mountedRef.current = false
      disconnectWs(true)
    }
  }, [fetchData, connectWs, disconnectWs])

  const markOneRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    dispatchUpdate()
    try {
      await markAsRead(id)
    } catch {
      await fetchData()
    }
  }, [fetchData])

  const markOneUnread = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
    )
    setUnreadCount((prev) => prev + 1)
    dispatchUpdate()
    try {
      await markAsUnread(id)
    } catch {
      await fetchData()
    }
  }, [fetchData])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    dispatchUpdate()
    try {
      await markAllRead()
    } catch {
      await fetchData()
    }
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    notifications,
    unreadCount,
    loading,
    markOneRead,
    markOneUnread,
    markAllAsRead,
    refresh,
  }
}
