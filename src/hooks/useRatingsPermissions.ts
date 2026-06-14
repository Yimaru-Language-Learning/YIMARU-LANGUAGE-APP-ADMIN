import { useMemo } from "react"
import { hasRatingsPermission } from "../lib/ratingsPermissions"
import { useTeamPermissions } from "./useTeamPermissions"

export function useRatingsPermissions() {
  const { permissions, loading, reload } = useTeamPermissions()

  const canList = useMemo(
    () => hasRatingsPermission("ratings.list_by_target", permissions),
    [permissions],
  )
  const canSummary = useMemo(
    () => hasRatingsPermission("ratings.summary", permissions),
    [permissions],
  )

  return {
    permissions,
    loading,
    reload,
    canList,
    canSummary,
  }
}
