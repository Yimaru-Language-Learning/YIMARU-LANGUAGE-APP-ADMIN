import { useEffect, useState, useCallback, useRef } from "react"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllRead,
  deleteNotification,
} from "../api/notifications.api"
import type { Notification } from "../types/notification.types"
import {
  NOTIFICATION_REALTIME_EVENT,
} from "../lib/notificationsWebSocket"

const MAX_DROPDOWN = 5
const ENRICH_REFRESH_MS = 2000

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const enrichRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const syncUnreadCount = useCallback(async () => {
    try {
      const countRes = await getUnreadCount()
      if (mountedRef.current) setUnreadCount(countRes.data.unread)
    } catch {
      // silently fail
    }
  }, [])

  const refreshQuietly = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications(5, 0),
        getUnreadCount(),
      ])
      if (!mountedRef.current) return
      setNotifications((prev) => {
        const fromApi = notifRes.data.notifications ?? []
        const apiIds = new Set(fromApi.map((n) => n.id))
        const pending = prev.filter((n) => !apiIds.has(n.id))
        return [...pending, ...fromApi].slice(0, MAX_DROPDOWN)
      })
      setUnreadCount(countRes.data.unread)
    } catch {
      // silently fail
    }
  }, [])

  const clearEnrichRefreshTimer = useCallback(() => {
    if (enrichRefreshTimer.current) {
      clearTimeout(enrichRefreshTimer.current)
      enrichRefreshTimer.current = null
    }
  }, [])

  const scheduleEnrichRefresh = useCallback(() => {
    clearEnrichRefreshTimer()
    enrichRefreshTimer.current = setTimeout(() => {
      enrichRefreshTimer.current = null
      void refreshQuietly()
    }, ENRICH_REFRESH_MS)
  }, [clearEnrichRefreshTimer, refreshQuietly])

  const applyRealtimeNotification = useCallback(
    (notif: Notification) => {
      setNotifications((prev) => {
        const withoutDuplicate = prev.filter((n) => n.id !== notif.id)
        return [notif, ...withoutDuplicate].slice(0, MAX_DROPDOWN)
      })
      scheduleEnrichRefresh()
    },
    [scheduleEnrichRefresh],
  )

  useEffect(() => {
    mountedRef.current = true
    fetchData()

    const onRealtime = (event: Event) => {
      const detail = (event as CustomEvent<Notification>).detail
      if (!detail) return
      applyRealtimeNotification(detail)
    }

    const onNotificationsUpdated = () => {
      void syncUnreadCount()
    }

    window.addEventListener(NOTIFICATION_REALTIME_EVENT, onRealtime)
    window.addEventListener("notifications-updated", onNotificationsUpdated)

    return () => {
      mountedRef.current = false
      window.removeEventListener(NOTIFICATION_REALTIME_EVENT, onRealtime)
      window.removeEventListener("notifications-updated", onNotificationsUpdated)
      clearEnrichRefreshTimer()
    }
  }, [fetchData, applyRealtimeNotification, clearEnrichRefreshTimer, syncUnreadCount])

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

  const deleteOne = useCallback(async (id: string) => {
    const removed = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (removed && !removed.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    dispatchUpdate()
    try {
      await deleteNotification(id)
    } catch {
      await fetchData()
      throw new Error("delete failed")
    }
  }, [notifications, fetchData])

  const commitDeleteNotification = useCallback(async (notification: Notification) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    if (!notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    dispatchUpdate()
    try {
      await deleteNotification(notification.id)
    } catch {
      await fetchData()
      throw new Error("delete failed")
    }
  }, [fetchData])

  const restoreNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev
      return [notification, ...prev].slice(0, MAX_DROPDOWN)
    })
  }, [])

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
    deleteOne,
    commitDeleteNotification,
    restoreNotification,
    refresh,
  }
}
