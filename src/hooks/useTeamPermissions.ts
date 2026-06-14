import { useCallback, useEffect, useState } from "react"
import { getMyProfile } from "../api/users.api"
import type { TeamMeProfile } from "../types/team.types"

export function useTeamPermissions() {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyProfile()
      const profile = res.data?.data as TeamMeProfile & { permissions?: string[] }
      setPermissions(Array.isArray(profile?.permissions) ? profile.permissions : [])
    } catch {
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const hasPermission = useCallback(
    (key: string) => permissions.includes(key),
    [permissions],
  )

  return { permissions, loading, hasPermission, reload: load }
}
