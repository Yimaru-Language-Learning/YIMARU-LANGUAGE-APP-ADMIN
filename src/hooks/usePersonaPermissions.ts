import { useMemo } from "react"
import { hasPersonaPermission } from "../lib/personasPermissions"
import { useTeamPermissions } from "./useTeamPermissions"

export function usePersonaPermissions() {
  const { permissions, loading, reload } = useTeamPermissions()

  const canList = useMemo(
    () => hasPersonaPermission("personas.list", permissions),
    [permissions],
  )
  const canGet = useMemo(
    () => hasPersonaPermission("personas.get", permissions),
    [permissions],
  )
  const canCreate = useMemo(
    () => hasPersonaPermission("personas.create", permissions),
    [permissions],
  )
  const canUpdate = useMemo(
    () => hasPersonaPermission("personas.update", permissions),
    [permissions],
  )
  const canDelete = useMemo(
    () => hasPersonaPermission("personas.delete", permissions),
    [permissions],
  )

  return {
    permissions,
    loading,
    reload,
    canList,
    canGet,
    canCreate,
    canUpdate,
    canDelete,
  }
}
