import { useCallback, useEffect, useState } from "react"
import { fetchCurrentTeamMemberPermissions } from "../api/team.api"
import { getMyProfile } from "../api/users.api"
import { syncSessionTeamRole } from "../lib/teamRole"
import type { TeamMeProfile } from "../types/team.types"

export function useTeamPermissions() {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const fromMembersList = await fetchCurrentTeamMemberPermissions()
      if (fromMembersList.length > 0) {
        setPermissions(fromMembersList)
        return
      }

      const res = await getMyProfile()
      const profile = res.data?.data as TeamMeProfile & { permissions?: string[] }
      syncSessionTeamRole(profile?.team_role)
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
