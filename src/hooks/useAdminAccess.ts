import { useMemo } from "react"
import {
  canSendTeamInvitations,
  getDefaultAppHome,
  hasFullAdminPanelAccess,
  isContentManagerPanelRole,
  isPathAllowedForTeamRole,
} from "../lib/adminAccess"
import { getNormalizedSessionTeamRole } from "../lib/teamRole"

export function useAdminAccess() {
  const teamRole = getNormalizedSessionTeamRole()

  return useMemo(
    () => ({
      teamRole,
      isContentManager: isContentManagerPanelRole(teamRole),
      hasFullPanel: hasFullAdminPanelAccess(teamRole),
      canInviteTeam: canSendTeamInvitations(teamRole),
      defaultHome: getDefaultAppHome(teamRole),
      isPathAllowed: (pathname: string) =>
        isPathAllowedForTeamRole(pathname, teamRole),
    }),
    [teamRole],
  )
}
