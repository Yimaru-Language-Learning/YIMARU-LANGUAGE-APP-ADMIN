export function getSessionTeamRole(): string {
  return localStorage.getItem("role")?.trim() ?? ""
}
