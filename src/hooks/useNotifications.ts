import { useEffect, useState, useCallback, useRef } from "react"
import { getNotifications, getUnreadCount, markAsRead, markAsUnread, markAllRead } from "../api/notifications.api"
import type { Notification } from "../types/notification.types"

const MAX_DROPDOWN = 5

function getWsUrl() {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const wsBase = base.replace(/^https/, "wss").replace(/^http/, "ws")
  const token = localStorage.getItem("access_token") ?? ""
  return `${wsBase}/ws/connect?token=${token}`
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

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

  const connectWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

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
      if (!mountedRef.current) return
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connectWs()
      }, 5000)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    connectWs()

    return () => {
      mountedRef.current = false
      wsRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [fetchData, connectWs])

  const markOneRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    dispatchUpdate()
    try {
      await markAsRead(id)
    } catch {
      // revert on failure
      await fetchData()
    }
  }, [fetchData])

  const markOneUnread = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
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
