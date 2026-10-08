import { useCallback, useEffect, useRef, useState } from "react"
import { getDashboard } from "../api/analytics.api"
import { getAnalyticsKpiSignature, type AnalyticsView } from "../lib/analyticsKpi"
import { getAnalyticsPollDelay } from "../lib/analyticsPolling"
import type { DashboardData, DashboardFilters } from "../types/analytics.types"

export function useAnalyticsDashboard(
  filters: DashboardFilters,
  view: AnalyticsView,
  { enabled = true, onKpiUpdate }: {
    enabled?: boolean
    onKpiUpdate?: (updatedAt: number) => void
  } = {},
) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const refreshRef = useRef<(() => Promise<void>) | null>(null)

  const refresh = useCallback(() => refreshRef.current?.(), [])
  const dismissUpdate = useCallback(() => setUpdatedAt(null), [])
  const markUpdated = useCallback((when: number) => setUpdatedAt(when), [])

  useEffect(() => {
    let active = true
    let running = false
    let hasData = false
    let signature: string | null = null
    let failures = 0
    let startedAt = 0
    let timer: ReturnType<typeof setTimeout> | null = null
    let controller: AbortController | null = null

    // A different filter establishes a new baseline, rather than an update.
    setDashboard(null)
    setLoading(enabled)
    setError(false)
    setUpdatedAt(null)
    if (!enabled) return

    const clearTimer = () => {
      if (timer !== null) clearTimeout(timer)
      timer = null
    }

    const schedule = () => {
      clearTimer()
      if (!active || document.visibilityState === "hidden") return
      const delay = getAnalyticsPollDelay(startedAt, Date.now(), failures)
      timer = setTimeout(() => { void fetchData(false) }, delay)
    }

    const fetchData = async (manual: boolean) => {
      if (!active || running || document.visibilityState === "hidden") return
      clearTimer()
      running = true
      startedAt = Date.now()
      controller = new AbortController()
      if (manual || !hasData) {
        setLoading(true)
        setError(false)
      }
      try {
        const res = await getDashboard(filters, {
          signal: controller.signal,
          quiet: !manual,
          timeout: 30_000,
        })
        if (!active) return
        const nextSignature = getAnalyticsKpiSignature(res.data, view)
        if (!manual && signature !== null && signature !== nextSignature) {
          const when = Date.now()
          setUpdatedAt(when)
          onKpiUpdate?.(when)
        }
        signature = nextSignature
        hasData = true
        failures = 0
        setDashboard(res.data)
        setError(false)
      } catch {
        if (!active) return
        failures++
        // A failed background fetch retains the last successful snapshot.
        if (!hasData) setError(true)
      } finally {
        running = false
        controller = null
        if (active) {
          setLoading(false)
          schedule()
        }
      }
    }

    const onVisibilityChange = () => {
      clearTimer()
      if (document.visibilityState !== "hidden") void fetchData(false)
    }

    const manualRefresh = () => fetchData(true)
    refreshRef.current = manualRefresh
    document.addEventListener("visibilitychange", onVisibilityChange)
    void fetchData(false)

    return () => {
      active = false
      clearTimer()
      controller?.abort()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (refreshRef.current === manualRefresh) refreshRef.current = null
    }
  }, [filters, view, enabled, onKpiUpdate])

  useEffect(() => {
    if (updatedAt === null) return
    const timer = setTimeout(dismissUpdate, 10_000)
    return () => clearTimeout(timer)
  }, [updatedAt, dismissUpdate])

  return { dashboard, loading, error, updatedAt, refresh, dismissUpdate, markUpdated }
}
