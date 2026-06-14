import { useMemo } from "react"
import { hasFaqPermission } from "../lib/faqPermissions"
import { useTeamPermissions } from "./useTeamPermissions"

export function useFaqPermissions() {
  const { permissions, loading, reload } = useTeamPermissions()

  const canList = useMemo(
    () => hasFaqPermission("faqs.list", permissions),
    [permissions],
  )
  const canGet = useMemo(
    () => hasFaqPermission("faqs.get", permissions),
    [permissions],
  )
  const canCreate = useMemo(
    () => hasFaqPermission("faqs.create", permissions),
    [permissions],
  )
  const canUpdate = useMemo(
    () => hasFaqPermission("faqs.update", permissions),
    [permissions],
  )
  const canDelete = useMemo(
    () => hasFaqPermission("faqs.delete", permissions),
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
